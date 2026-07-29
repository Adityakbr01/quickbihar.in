/**
 * Fulfillment event service.
 *
 * Records immutable fulfillment lifecycle events (order/sub-order status changes) and
 * fans them out over two channels: real-time Socket.IO room broadcasts and durable push
 * notifications. Every side-effect is mirrored into the `NotificationOutbox` collection
 * for idempotency and delivery auditing. Also exposes a per-user event feed used by clients
 * to hydrate/replay fulfillment timelines.
 */

import { Types } from "mongoose";
import * as notificationService from "@/modules/common/notification/notification.service";
import { User } from "@/modules/common/user/user.model";
import { socketService } from "@/modules/common/socket/socket.service";
import { FulfillmentEvent, type FulfillmentActor } from "./fulfillmentEvent.model";
import { NotificationOutbox } from "./notificationOutbox.model";

type EventRecipient = {
  userId?: string;
  title?: string;
  body?: string;
  push?: boolean;
};

type FulfillmentEventInput = {
  type: string;
  status?: string;
  actor: FulfillmentActor;
  actorId?: string;
  orderId?: string;
  orderObjectId?: string;
  subOrderId?: string;
  subOrderObjectId?: string;
  metadata?: Record<string, any>;
  rooms?: string[];
  recipients?: EventRecipient[];
};

const objectIdOrUndefined = (value?: string) =>
  value && Types.ObjectId.isValid(value) ? new Types.ObjectId(value) : undefined;

const unique = <T>(items: T[]) => Array.from(new Set(items.filter(Boolean)));

const eventPayload = (event: any) => ({
  eventId: event.eventId,
  sequence: event.sequence,
  type: event.type,
  orderId: event.orderId,
  subOrderId: event.subOrderId,
  status: event.status,
  actor: event.actor,
  actorId: event.actorId?.toString?.(),
  timestamp: event.occurredAt?.toISOString?.() || new Date().toISOString(),
  metadata: event.metadata || {},
});

const roleRoomsFor = (user: any) => {
  const userId = user._id?.toString();
  const roleName = user.roleId?.name || user.role?.name || user.role;
  const rooms = [`user:${userId}`, `user_${userId}`];
  if (roleName === "SELLER") rooms.push(`seller:${userId}`, `seller_${userId}`);
  if (roleName === "DELIVERY" || roleName === "RIDER") rooms.push(`rider:${userId}`, `rider_${userId}`);
  if (roleName === "ADMIN" || roleName === "SUPER_ADMIN") rooms.push("admin", "admins");
  return rooms;
};

/**
 * Records a fulfillment event and dispatches it across socket and push channels.
 * Computes the broadcast rooms (order/sub-order/recipient scoped), assigns a monotonic
 * per-scope sequence number, persists the event, then queues socket + push notifications
 * and emits the payload to all resolved rooms in real time.
 *
 * @param input - Event descriptor: type/status, actor, order & sub-order identifiers,
 *                 metadata, explicit rooms, and push recipients.
 * @returns The normalized event payload that was broadcast to clients.
 */
export async function record(input: FulfillmentEventInput) {
  const recipientIds = unique(
    (input.recipients || [])
      .map((recipient) => recipient.userId)
      .filter((id): id is string => Boolean(id) && Types.ObjectId.isValid(id as string))
      .map((id) => new Types.ObjectId(id).toString()),
  ).map((id) => new Types.ObjectId(id));

  const rooms = unique([
    ...(input.rooms || []),
    ...(input.orderId ? [`order:${input.orderId}`, `order_${input.orderId}`] : []),
    ...(input.subOrderId ? [`suborder:${input.subOrderId}`, `suborder_${input.subOrderId}`] : []),
    ...recipientIds.map((id) => `user:${id.toString()}`),
  ]);

  const sequenceFilter = input.subOrderId
    ? { subOrderId: input.subOrderId }
    : input.orderId
      ? { orderId: input.orderId }
      : {};
  const sequence = (await FulfillmentEvent.countDocuments(sequenceFilter)) + 1;

  const event = await FulfillmentEvent.create({
    sequence,
    type: input.type,
    orderId: input.orderId,
    orderObjectId: objectIdOrUndefined(input.orderObjectId),
    subOrderId: input.subOrderId,
    subOrderObjectId: objectIdOrUndefined(input.subOrderObjectId),
    status: input.status,
    actor: input.actor,
    actorId: objectIdOrUndefined(input.actorId),
    recipientIds,
    rooms,
    metadata: input.metadata,
    occurredAt: new Date(),
  });

  const payload = eventPayload(event);
  await queueSocketNotifications(event.eventId, rooms, payload);
  await queuePushNotifications(event.eventId, input.recipients || [], payload);
  emitRooms(rooms, payload);

  return payload;
}

/**
 * Returns the fulfillment event feed visible to a given user.
 * Matches events either directly addressed to the user or broadcast to any of the
 * role-scoped rooms the user belongs to. Supports cursor pagination via an `after`
 * event id and caps the page size between 1 and 200 (default 100).
 *
 * @param user - Authenticated user document (used for id + role-room resolution).
 * @param query - Optional query params: `limit` (1–200) and `after` (event id cursor).
 * @returns Chronologically ordered array of normalized event payloads.
 */
export async function listForUser(user: any, query: any = {}) {
  const userId = user._id?.toString();
  const rooms = roleRoomsFor(user);
  const limit = Math.min(Math.max(Number(query.limit) || 100, 1), 200);
  const filter: any = {
    $or: [
      { recipientIds: new Types.ObjectId(userId) },
      { rooms: { $in: rooms } },
    ],
  };

  if (query.after) {
    const anchor = await FulfillmentEvent.findOne({ eventId: String(query.after) }).lean();
    if (anchor) {
      filter.occurredAt = { $gt: anchor.occurredAt };
    }
  }

  const events = await FulfillmentEvent.find(filter)
    .sort({ occurredAt: 1, sequence: 1 })
    .limit(limit)
    .lean();

  return events.map(eventPayload);
}

/**
 * Emits an event payload to every resolved room plus the global "admins" room.
 *
 * @param rooms - Socket room names to broadcast to.
 * @param payload - Normalized event payload.
 */
function emitRooms(rooms: string[], payload: any) {
  rooms.forEach((room) => {
    socketService.emitToRoom(room, "fulfillment_event", payload);
  });
  socketService.emitToRoom("admins", "fulfillment_event", payload);
}

/**
 * Records one already-sent SOCKET outbox row per room for delivery auditing.
 * Uses a deterministic idempotency key and tolerates duplicate-key races.
 *
 * @param eventId - Owning fulfillment event id.
 * @param rooms - Rooms the socket payload was emitted to.
 * @param payload - Normalized event payload persisted alongside the outbox row.
 */
async function queueSocketNotifications(eventId: string, rooms: string[], payload: any) {
  const rows = rooms.map((room) => ({
    idempotencyKey: `${eventId}:SOCKET:${room}`,
    eventId,
    channel: "SOCKET",
    status: "SENT",
    room,
    payload,
    attempts: 1,
    sentAt: new Date(),
  }));
  if (!rows.length) return;
  await NotificationOutbox.insertMany(rows, { ordered: false }).catch(() => undefined);
}

/**
 * Sends push notifications to opted-in recipients and reconciles outbox state.
 * Resolves FCM tokens for recipients flagged `push`, creates a PENDING/SKIPPED outbox
 * row per recipient, dispatches the push, and updates the row to SENT or FAILED
 * (scheduling a 5-minute retry window on failure).
 *
 * @param eventId - Owning fulfillment event id.
 * @param recipients - Candidate recipients (only those with `push` and a `userId` are notified).
 * @param payload - Normalized event payload; select fields are attached to the push data.
 */
async function queuePushNotifications(eventId: string, recipients: EventRecipient[], payload: any) {
  const pushRecipients = recipients.filter((recipient) => recipient.push && recipient.userId);
  if (!pushRecipients.length) return;

  const users = await User.find({
    _id: { $in: pushRecipients.map((recipient) => recipient.userId as string) },
    fcmToken: { $exists: true, $ne: "" },
  }).select("_id fcmToken").lean();

  const tokenByUser = new Map(users.map((user: any) => [user._id.toString(), user.fcmToken]));

  for (const recipient of pushRecipients) {
    const token = tokenByUser.get(recipient.userId!);
    const title = recipient.title || "Order update";
    const body = recipient.body || "Your order status was updated.";
    const outbox = await NotificationOutbox.create({
      idempotencyKey: `${eventId}:PUSH:${recipient.userId}`,
      eventId,
      channel: "PUSH",
      status: token ? "PENDING" : "SKIPPED",
      recipientId: objectIdOrUndefined(recipient.userId),
      title,
      body,
      payload,
      attempts: 0,
      nextAttemptAt: token ? new Date() : undefined,
    }).catch(() => null);

    if (!token || !outbox) continue;

    try {
      await notificationService.sendPush(token, title, body, {
        eventId,
        orderId: String(payload.orderId || ""),
        subOrderId: String(payload.subOrderId || ""),
        type: String(payload.type || ""),
      });
      await NotificationOutbox.updateOne(
        { _id: outbox._id },
        { $set: { status: "SENT", sentAt: new Date() }, $inc: { attempts: 1 } },
      );
    } catch (error: any) {
      await NotificationOutbox.updateOne(
        { _id: outbox._id },
        {
          $set: {
            status: "FAILED",
            lastError: error?.message || "Push send failed",
            nextAttemptAt: new Date(Date.now() + 5 * 60 * 1000),
          },
          $inc: { attempts: 1 },
        },
      );
    }
  }
}
