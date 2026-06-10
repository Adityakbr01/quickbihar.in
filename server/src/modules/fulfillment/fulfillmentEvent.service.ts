import { Types } from "mongoose";
import { notificationService } from "../notification/notification.service";
import { User } from "../user/user.model";
import { socketService } from "../socket/socket.service";
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

export class FulfillmentEventService {
  static async record(input: FulfillmentEventInput) {
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
    await this.queueSocketNotifications(event.eventId, rooms, payload);
    await this.queuePushNotifications(event.eventId, input.recipients || [], payload);
    this.emitRooms(rooms, payload);

    return payload;
  }

  static async listForUser(user: any, query: any = {}) {
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

  private static emitRooms(rooms: string[], payload: any) {
    rooms.forEach((room) => {
      socketService.emitToRoom(room, "fulfillment_event", payload);
    });
    socketService.emitToRoom("admins", "fulfillment_event", payload);
  }

  private static async queueSocketNotifications(eventId: string, rooms: string[], payload: any) {
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

  private static async queuePushNotifications(eventId: string, recipients: EventRecipient[], payload: any) {
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
}

export const fulfillmentEventService = FulfillmentEventService;
