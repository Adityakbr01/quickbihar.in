/**
 * Rider matching engine.
 *
 * Assigns ready-for-pickup sub-orders to nearby, eligible, non-saturated riders by emitting
 * time-boxed `RiderOffer`s. Runs both as a background polling loop (`start`) and on-demand
 * (`initiateMatching`) when a sub-order becomes ready. Rider selection filters out busy riders,
 * capacity-full riders, and riders who have already rejected the sub-order too many times, then
 * ranks the remainder by proximity within a configurable radius. `diagnostics` explains, for a
 * given sub-order, exactly why each candidate rider was or was not offered the job.
 */

import { Types } from "mongoose";
import { SubOrder, SubOrderStatus } from "@/modules/common/order/subOrder.model";
import { Store } from "@/modules/common/store/store.model";
import { DeliveryBoy } from "@/modules/common/deliveryBoy/delivery.model";
import { socketService } from "@/modules/common/socket/socket.service";
import {
  distanceKmBetween,
  lockedOrCalculatedRiderPayout,
} from "@/modules/common/order/subOrder.service";
import { SocketEvents } from "@/constants/socketEvents";
import {
  MAX_RIDER_REJECTIONS_PER_SUB_ORDER,
  RiderOffer,
} from "@/modules/common/fulfillment/riderOffer.model";
import { ENV } from "@/config/env.config";
import { riderCapacityCountsByRider } from "./riderCapacity";
import { riderProfileMissingFields } from "./riderEligibility";
import * as appConfigService from "@/modules/common/appConfig/appConfig.service";

let isLoopRunning = false;
const activeRiderStatuses = [
  SubOrderStatus.RIDER_ASSIGNED,
  SubOrderStatus.RIDER_ARRIVING,
  SubOrderStatus.RIDER_REACHED_STORE,
  SubOrderStatus.PICKED_UP,
  SubOrderStatus.IN_TRANSIT,
  SubOrderStatus.NEAR_CUSTOMER,
];

function idString(value: any): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value.toHexString === "function") return value.toHexString();
  if (value._id) return idString(value._id);
  return value.toString?.() || String(value);
}

async function busyRiderUserIds() {
  return await SubOrder.distinct("delivery.riderId", {
    status: { $in: activeRiderStatuses },
    "delivery.riderId": { $exists: true, $ne: null },
  });
}

async function rejectionCountsForSubOrder(subOrderObjectId: any) {
  const subOrderId = new Types.ObjectId(idString(subOrderObjectId));
  const rows = await RiderOffer.aggregate([
    {
      $match: {
        subOrderObjectId: subOrderId,
        status: "REJECTED",
      },
    },
    {
      $group: {
        _id: "$riderId",
        rejectionCount: { $sum: 1 },
        lastRejectedAt: { $max: "$respondedAt" },
      },
    },
  ]);

  const countByRiderId = new Map<string, number>();
  const blockedIds: Types.ObjectId[] = [];

  for (const row of rows) {
    const riderId = idString(row._id);
    const rejectionCount = Number(row.rejectionCount || 0);
    countByRiderId.set(riderId, rejectionCount);
    if (rejectionCount >= MAX_RIDER_REJECTIONS_PER_SUB_ORDER) {
      blockedIds.push(row._id);
    }
  }

  return { countByRiderId, blockedIds };
}

function objectIdsFrom(values: any[]) {
  const ids = new Set<string>();
  for (const value of values) {
    const id = idString(value);
    if (Types.ObjectId.isValid(id)) ids.add(id);
  }
  return Array.from(ids).map((id) => new Types.ObjectId(id));
}

/**
 * Starts the background matching loop (idempotent). Polls the matching pool every 10 seconds;
 * repeated calls after the loop is running are no-ops. Errors in a tick are logged, not thrown.
 */
export function start() {
  if (isLoopRunning) return;
  isLoopRunning = true;

  console.log("🚀 Starting Rider Matching Engine Polling Loop...");
  setInterval(() => {
    processMatchingPool().catch((err) => {
      console.error("[MatchingService] Error in matching loop:", err);
    });
  }, 10000); // Check every 10 seconds
}

/**
 * Expires stale open offers, then attempts to match every unassigned, ready-for-pickup
 * sub-order. Invoked on each polling tick and by callers that want an immediate sweep.
 */
export async function processMatchingPool() {
  // Capture offers about to time out so we can notify their riders to dismiss
  // the now-stale offer prompt, then flip them to EXPIRED in one write.
  const expiringOffers = await RiderOffer.find(
    { status: "OPEN", expiresAt: { $lte: new Date() } },
    { offerId: 1, riderId: 1, subOrderId: 1 },
  )
    .lean()
    .catch(() => [] as any[]);

  await RiderOffer.updateMany(
    { status: "OPEN", expiresAt: { $lte: new Date() } },
    { $set: { status: "EXPIRED", respondedAt: new Date() } },
  );

  for (const offer of expiringOffers) {
    socketService.emitToUser(
      idString(offer.riderId),
      SocketEvents.RIDER_OFFER_CLOSED,
      {
        offerId: offer.offerId,
        subOrderId: offer.subOrderId,
        reason: "EXPIRED",
        message: "This delivery offer has expired.",
      },
    );
  }

  const activeMatches = await SubOrder.find({
    status: SubOrderStatus.READY_FOR_PICKUP,
    $or: [
      { "delivery.riderId": { $exists: false } },
      { "delivery.riderId": null },
    ],
  }).populate("storeId parentOrderId");

  for (const subOrder of activeMatches) {
    await matchSubOrder(subOrder);
  }
}

/**
 * Immediately attempts to match a single sub-order (e.g. triggered on a status change),
 * bypassing the polling interval. No-ops unless the sub-order is ready for pickup and unassigned.
 *
 * @param subOrderId - The sub-order's MongoDB ObjectId (as string).
 */
export async function initiateMatching(subOrderId: string) {
  const subOrder = await SubOrder.findById(subOrderId).populate(
    "storeId parentOrderId",
  );
  if (
    subOrder &&
    subOrder.status === SubOrderStatus.READY_FOR_PICKUP &&
    !subOrder.delivery.riderId
  ) {
    await matchSubOrder(subOrder);
  }
}

/**
 * Derives the human-readable matching "stage" (e.g. scheduling window / readiness) for a
 * sub-order from its pickup timing and status. Used by diagnostics and matching decisions.
 *
 * @param subOrder - The (populated) sub-order document.
 * @returns A descriptor of the sub-order's current matching stage.
 */
export function matchingStage(subOrder: any) {
  const pickupTime =
    subOrder.packageDetails?.pickupTiming ||
    subOrder.updatedAt ||
    subOrder.createdAt;
  const elapsedMs = Date.now() - new Date(pickupTime).getTime();
  const elapsedSeconds = Math.max(0, elapsedMs / 1000);

  if (elapsedSeconds > 120) {
    return {
      elapsedSeconds,
      stage: 4,
      radiusMeters: ENV.MATCHING_STAGE4_RADIUS_KM * 1000,
      expiresInSeconds: 60,
    };
  }
  if (elapsedSeconds > 60) {
    return {
      elapsedSeconds,
      stage: 3,
      radiusMeters: 8000,
      expiresInSeconds: 60,
    };
  }
  if (elapsedSeconds > 30) {
    return {
      elapsedSeconds,
      stage: 2,
      radiusMeters: 5000,
      expiresInSeconds: 30,
    };
  }
  return {
    elapsedSeconds,
    stage: 1,
    radiusMeters: 3000,
    expiresInSeconds: 30,
  };
}

/**
 * Explains the matching outcome for a single sub-order: the current stage, computed search
 * radius, and a per-rider breakdown of who qualified and who was excluded (busy, at capacity,
 * too many rejections, out of range, or missing profile data). Intended for admin debugging.
 *
 * @param subOrderId - The sub-order's MongoDB ObjectId (as string).
 * @returns A diagnostics report describing candidate riders and exclusion reasons.
 */
export async function diagnostics(subOrderId: string) {
  const subOrder = await SubOrder.findOne({
    $or: [
      ...(Types.ObjectId.isValid(subOrderId)
        ? [{ _id: new Types.ObjectId(subOrderId) }]
        : []),
      { subOrderId },
    ],
  })
    .populate("storeId parentOrderId")
    .lean();

  if (!subOrder) {
    return { found: false, blockers: ["Sub-order not found"] };
  }

  const stage = matchingStage(subOrder);
  const store = subOrder.storeId as any;
  const storeLng = store?.currentLocation?.coordinates?.[0];
  const storeLat = store?.currentLocation?.coordinates?.[1];
  const storeCoords =
    Number.isFinite(Number(storeLat)) && Number.isFinite(Number(storeLng))
      ? { latitude: Number(storeLat), longitude: Number(storeLng) }
      : null;

  const busyRiderIds = await busyRiderUserIds();
  const busyRiderSet = new Set(busyRiderIds.map((id) => idString(id)));
  const capacitySummary = await riderCapacityCountsByRider();
  const capacityBlockedSet = new Set(
    capacitySummary.atCapacityIds.map((id) => idString(id)),
  );
  const rejectionSummary = await rejectionCountsForSubOrder(
    subOrder._id,
  );
  const rejectionBlockedSet = new Set(
    rejectionSummary.blockedIds.map((id) => idString(id)),
  );

  const onlineRidersDb = await DeliveryBoy.find({
    status: "APPROVED",
    isVerified: true,
    isOnline: true,
    "currentLocation.coordinates.0": { $exists: true },
    "currentLocation.coordinates.1": { $exists: true },
  })
    .populate("userId", "fullName email phone")
    .lean();
  const onlineRiders = onlineRidersDb.filter(
    (rider: any) => riderProfileMissingFields(rider).length === 0,
  );

  const riders = onlineRiders
    .map((rider: any) => {
      const riderUserId = idString(rider.userId?._id || rider.userId);
      const rejectionCount =
        rejectionSummary.countByRiderId.get(riderUserId) || 0;
      const acceptedCountInWindow =
        capacitySummary.countByRiderId.get(riderUserId) || 0;
      const riderCoords = {
        latitude: Number(rider.currentLocation?.coordinates?.[1]),
        longitude: Number(rider.currentLocation?.coordinates?.[0]),
      };
      const distanceKm = storeCoords
        ? distanceKmBetween(riderCoords, storeCoords)
        : null;
      return {
        profileId: rider._id?.toString(),
        userId: rider.userId?._id?.toString(),
        fullName: rider.userId?.fullName,
        phone: rider.userId?.phone,
        email: rider.userId?.email,
        distanceKm:
          distanceKm === null ? null : Number(distanceKm.toFixed(2)),
        hasActiveJob: busyRiderSet.has(riderUserId),
        acceptedCountInWindow,
        maxAcceptedOrders: capacitySummary.maxAcceptedOrders,
        acceptanceWindowHours: capacitySummary.windowHours,
        atAcceptanceCapacity: capacityBlockedSet.has(riderUserId),
        rejectionCount,
        offerSuppressedForSubOrder: rejectionBlockedSet.has(riderUserId),
        withinCurrentRadius:
          distanceKm === null
            ? false
            : distanceKm * 1000 <= stage.radiusMeters,
      };
    })
    .sort(
      (a, b) =>
        (a.distanceKm ?? Number.POSITIVE_INFINITY) -
        (b.distanceKm ?? Number.POSITIVE_INFINITY),
    );

  const openOffers = await RiderOffer.find({
    subOrderObjectId: subOrder._id,
    status: "OPEN",
  })
    .select("offerId riderId stage radiusKm payoutAmount expiresAt createdAt")
    .lean();

  const blockers: string[] = [];
  if (subOrder.status !== SubOrderStatus.READY_FOR_PICKUP)
    blockers.push(`Sub-order status is ${subOrder.status}`);
  if (subOrder.delivery?.riderId)
    blockers.push("Sub-order already has an assigned rider");
  if (!storeCoords) blockers.push("Store pickup GPS is missing or invalid");
  if (!onlineRiders.length)
    blockers.push("No approved online riders with GPS are available");
  if (
    storeCoords &&
    onlineRiders.length &&
    !riders.some((rider) => rider.withinCurrentRadius)
  ) {
    blockers.push(
      `No online riders within ${stage.radiusMeters / 1000} km of store pickup GPS`,
    );
  }
  if (
    storeCoords &&
    riders.some((rider) => rider.withinCurrentRadius) &&
    !riders.some(
      (rider) => rider.withinCurrentRadius && !rider.atAcceptanceCapacity,
    )
  ) {
    blockers.push(
      `Nearby riders are within radius, but all are at the ${capacitySummary.maxAcceptedOrders} accepted order limit for ${capacitySummary.windowHours} hours`,
    );
  }
  if (
    storeCoords &&
    riders.some(
      (rider) => rider.withinCurrentRadius && !rider.atAcceptanceCapacity,
    ) &&
    !riders.some(
      (rider) =>
        rider.withinCurrentRadius &&
        !rider.atAcceptanceCapacity &&
        !rider.offerSuppressedForSubOrder,
    )
  ) {
    blockers.push(
      `Nearby available riders have already rejected this sub-order ${MAX_RIDER_REJECTIONS_PER_SUB_ORDER} times`,
    );
  }
  if (!openOffers.length && !blockers.length) {
    blockers.push(
      "Matching is eligible, but no open offers exist yet. Retry matching or wait for the polling loop.",
    );
  }

  return {
    found: true,
    subOrder: {
      _id: subOrder._id?.toString(),
      subOrderId: subOrder.subOrderId,
      status: subOrder.status,
      deliveryStatus: subOrder.delivery?.status,
      pickupTiming: subOrder.packageDetails?.pickupTiming,
    },
    store: {
      _id: store?._id?.toString(),
      name: store?.name,
      currentLocation: storeCoords,
      rawCoordinates: store?.currentLocation?.coordinates,
    },
    matching: {
      elapsedSeconds: Math.round(stage.elapsedSeconds),
      stage: stage.stage,
      radiusKm: stage.radiusMeters / 1000,
    },
    riders: {
      onlineWithGps: onlineRiders.length,
      busyWithActiveJob: riders.filter((rider) => rider.hasActiveJob).length,
      atAcceptanceCapacity: riders.filter(
        (rider) => rider.atAcceptanceCapacity,
      ).length,
      suppressedByRejections: riders.filter(
        (rider) => rider.offerSuppressedForSubOrder,
      ).length,
      withinCurrentRadius: riders.filter((rider) => rider.withinCurrentRadius)
        .length,
      eligibleWithinCurrentRadius: riders.filter(
        (rider) =>
          rider.withinCurrentRadius &&
          !rider.atAcceptanceCapacity &&
          !rider.offerSuppressedForSubOrder,
      ).length,
      nearest: riders.slice(0, 5),
    },
    offers: openOffers.map((offer: any) => ({
      offerId: offer.offerId,
      riderId: offer.riderId?.toString(),
      stage: offer.stage,
      radiusKm: offer.radiusKm,
      payoutAmount: offer.payoutAmount,
      expiresAt: offer.expiresAt,
      createdAt: offer.createdAt,
    })),
    blockers,
  };
}

// Execute matching algorithm for a sub-order
async function matchSubOrder(subOrder: any) {
  const stageDetails = matchingStage(subOrder);
  const elapsedSeconds = stageDetails.elapsedSeconds;
  const radiusMeters = stageDetails.radiusMeters;
  const stage = stageDetails.stage;
  const expiresInSeconds = stageDetails.expiresInSeconds;
  if (stage === 4) {
    // Stage 4: Escalate to admin, but keep broadcasting so late-online riders can still accept.
    socketService.emitToAdmins("admin_unassigned_escalation", {
      subOrderId: subOrder.subOrderId,
      elapsedSeconds,
      message: `Order ${subOrder.subOrderId} has been unassigned for ${(elapsedSeconds / 60).toFixed(1)} minutes. Escalated to Admin Queue.`,
    });
  }

  const store = subOrder.storeId as any;
  const parentOrder = subOrder.parentOrderId as any;

  if (!store || !store.currentLocation?.coordinates) {
    console.error(
      `[MatchingService] Store location coordinates missing for sub-order ${subOrder.subOrderId}`,
    );
    return;
  }

  const storeLng = store.currentLocation.coordinates[0];
  const storeLat = store.currentLocation.coordinates[1];

  const capacitySummary = await riderCapacityCountsByRider();
  const rejectionSummary = await rejectionCountsForSubOrder(
    subOrder._id,
  );
  const excludedRiderIds = objectIdsFrom([
    ...capacitySummary.atCapacityIds,
    ...rejectionSummary.blockedIds,
  ]);

  // Query online approved riders within active radius, excluding riders at rolling capacity
  // or riders who rejected this same sub-order too many times.
  const qualifiedRidersDb = await DeliveryBoy.find({
    status: "APPROVED",
    isVerified: true,
    isOnline: true,
    userId: { $nin: excludedRiderIds },
    currentLocation: {
      $nearSphere: {
        $geometry: {
          type: "Point",
          coordinates: [storeLng, storeLat],
        },
        $maxDistance: radiusMeters,
      },
    },
  }).populate("userId");
  const qualifiedRiders = qualifiedRidersDb.filter(
    (rider: any) => riderProfileMissingFields(rider).length === 0,
  );

  if (qualifiedRiders.length === 0) {
    console.log(
      `[MatchingService] No riders found within ${radiusMeters / 1000} KM radius for sub-order ${subOrder.subOrderId}`,
    );
    return;
  }

  // Calculate priorities and offer job
  const storeCoords = { latitude: storeLat, longitude: storeLng };
  const customerCoords = parentOrder.shippingAddress
    ? {
        latitude: parentOrder.shippingAddress.latitude,
        longitude: parentOrder.shippingAddress.longitude,
      }
    : null;

  let distanceKm = 0;
  if (customerCoords) {
    distanceKm = distanceKmBetween(storeCoords, customerCoords) || 0;
  }

  const appConfig = await appConfigService.getConfig();
  const payoutInfo = lockedOrCalculatedRiderPayout(subOrder, distanceKm, appConfig);

  // Score riders
  const ridersWithScores = qualifiedRiders.map((rider) => {
    const riderLng = rider.currentLocation?.coordinates?.[0];
    const riderLat = rider.currentLocation?.coordinates?.[1];

    let riderDistanceToStore = 0;
    if (riderLng && riderLat) {
      riderDistanceToStore =
        distanceKmBetween(
          { latitude: riderLat, longitude: riderLng },
          storeCoords,
        ) || 0;
    }

    // Priority score = proximity only. The rider model tracks none of the
    // reputation signals (rating / acceptanceRate / completionRate /
    // onlineHours) the old formula referenced, so those terms were fixed
    // constants that shifted every rider's score by the same amount and never
    // affected the ranking. Score by distance-to-store alone (closer = higher)
    // until those signals actually exist to weight in.
    const score = Math.max(0, 10 - riderDistanceToStore);

    return {
      rider,
      score,
      riderDistanceToStore,
    };
  });

  // Sort riders by priority score descending
  ridersWithScores.sort((a, b) => b.score - a.score);

  let emittedOffers = 0;
  let existingOpenOffers = 0;
  let capacitySuppressedOffers = 0;
  let rejectionSuppressedOffers = 0;

  // Broadcast offer to qualified riders via socket
  for (const item of ridersWithScores) {
    const riderUserObj = item.rider.userId as any;
    if (!riderUserObj || !riderUserObj._id) continue;
    const riderUserId = riderUserObj._id.toString();
    const acceptedCountInWindow =
      capacitySummary.countByRiderId.get(riderUserId) || 0;
    if (acceptedCountInWindow >= capacitySummary.maxAcceptedOrders) {
      capacitySuppressedOffers += 1;
      continue;
    }

    const rejectionCount =
      rejectionSummary.countByRiderId.get(riderUserId) || 0;
    if (rejectionCount >= MAX_RIDER_REJECTIONS_PER_SUB_ORDER) {
      rejectionSuppressedOffers += 1;
      continue;
    }

    const existingOpenOffer = await RiderOffer.findOne({
      subOrderObjectId: subOrder._id,
      riderId: riderUserObj._id,
      status: "OPEN",
      expiresAt: { $gt: new Date() },
    }).lean();

    if (existingOpenOffer) {
      existingOpenOffers += 1;
      continue;
    }

    const offer = await RiderOffer.findOneAndUpdate(
      {
        subOrderObjectId: subOrder._id,
        riderId: riderUserObj._id,
        status: "OPEN",
      },
      {
        $setOnInsert: {
          subOrderObjectId: subOrder._id,
          subOrderId: subOrder.subOrderId,
          parentOrderId: parentOrder?._id,
          sellerId: subOrder.sellerId,
          riderId: riderUserObj._id,
          riderProfileId: item.rider._id,
        },
        $set: {
          stage,
          radiusKm: radiusMeters / 1000,
          payoutAmount: payoutInfo.totalPayout,
          distanceKm: parseFloat(distanceKm.toFixed(2)),
          riderDistanceToStoreKm: parseFloat(
            item.riderDistanceToStore.toFixed(2),
          ),
          expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
          metadata: {
            storeName: store.name,
            storeAddress: store.address,
            riderAcceptedCountInWindow: acceptedCountInWindow,
            riderMaxAcceptedOrders: capacitySummary.maxAcceptedOrders,
            riderAcceptanceWindowHours: capacitySummary.windowHours,
          },
        },
      },
      { upsert: true, returnDocument: "after" },
    );

    emittedOffers += 1;
    socketService.emitToUser(riderUserId, SocketEvents.RIDER_JOB_OFFER, {
      offerId: offer.offerId,
      subOrderId: subOrder.subOrderId,
      storeName: store.name,
      storeAddress: store.address,
      storeLocation: storeCoords,
      customerLocation: customerCoords,
      distanceKm: parseFloat(distanceKm.toFixed(2)),
      riderDistanceToStoreKm: parseFloat(
        item.riderDistanceToStore.toFixed(2),
      ),
      payoutAmount: payoutInfo.totalPayout,
      packageDetails: {
        weight: subOrder.packageDetails?.weight || 0,
        packageCount: subOrder.packageDetails?.packageCount || 1,
        isFragile: !!subOrder.packageDetails?.isFragile,
        isCod: !!subOrder.packageDetails?.isCod,
      },
      elapsedSeconds: Math.round(elapsedSeconds),
      radiusKm: radiusMeters / 1000,
      stage,
      expiresAt: offer.expiresAt,
      riderCapacity: {
        acceptedCountInWindow,
        maxAcceptedOrders: capacitySummary.maxAcceptedOrders,
        acceptanceWindowHours: capacitySummary.windowHours,
        remainingAfterAccept: Math.max(
          0,
          capacitySummary.maxAcceptedOrders - acceptedCountInWindow - 1,
        ),
      },
    });
  }

  if (
    emittedOffers > 0 ||
    existingOpenOffers > 0 ||
    capacitySuppressedOffers > 0 ||
    rejectionSuppressedOffers > 0
  ) {
    console.log(
      `[MatchingService] Matched sub-order ${subOrder.subOrderId}: emitted ${emittedOffers} new offer(s), skipped ${existingOpenOffers} existing open offer(s), suppressed ${capacitySuppressedOffers} capacity-full rider(s), suppressed ${rejectionSuppressedOffers} rider(s) after ${MAX_RIDER_REJECTIONS_PER_SUB_ORDER} rejections, radius ${radiusMeters / 1000} KM.`,
    );
  }
}