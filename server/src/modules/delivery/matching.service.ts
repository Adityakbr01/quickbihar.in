import { Types } from "mongoose";
import { SubOrder, SubOrderStatus } from "../order/subOrder.model";
import { Store } from "../store/store.model";
import { DeliveryBoy } from "../deliveryBoy/delivery.model";
import { socketService } from "../socket/socket.service";
import {
  distanceKmBetween,
  lockedOrCalculatedRiderPayout,
} from "../order/subOrder.service";
import { SocketEvents } from "../../constants/socketEvents";
import {
  MAX_RIDER_REJECTIONS_PER_SUB_ORDER,
  RiderOffer,
} from "../fulfillment/riderOffer.model";
import { ENV } from "../../config/env.config";
import { riderCapacityCountsByRider } from "./riderCapacity";
import { riderProfileMissingFields } from "./riderEligibility";
import { appConfigService } from "../appConfig/appConfig.service";

export class MatchingService {
  private static isLoopRunning = false;
  private static lastDiagnosticLogAt = new Map<string, number>();
  private static activeRiderStatuses = [
    SubOrderStatus.RIDER_ASSIGNED,
    SubOrderStatus.RIDER_ARRIVING,
    SubOrderStatus.RIDER_REACHED_STORE,
    SubOrderStatus.PICKED_UP,
    SubOrderStatus.IN_TRANSIT,
    SubOrderStatus.NEAR_CUSTOMER,
  ];

  private static idString(value: any): string {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value.toHexString === "function") return value.toHexString();
    if (value._id) return this.idString(value._id);
    return value.toString?.() || String(value);
  }

  private static async busyRiderUserIds() {
    return await SubOrder.distinct("delivery.riderId", {
      status: { $in: this.activeRiderStatuses },
      "delivery.riderId": { $exists: true, $ne: null },
    });
  }

  private static async rejectionCountsForSubOrder(subOrderObjectId: any) {
    const subOrderId = new Types.ObjectId(this.idString(subOrderObjectId));
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
      const riderId = this.idString(row._id);
      const rejectionCount = Number(row.rejectionCount || 0);
      countByRiderId.set(riderId, rejectionCount);
      if (rejectionCount >= MAX_RIDER_REJECTIONS_PER_SUB_ORDER) {
        blockedIds.push(row._id);
      }
    }

    return { countByRiderId, blockedIds };
  }

  private static objectIdsFrom(values: any[]) {
    const ids = new Set<string>();
    for (const value of values) {
      const id = this.idString(value);
      if (Types.ObjectId.isValid(id)) ids.add(id);
    }
    return Array.from(ids).map((id) => new Types.ObjectId(id));
  }

  // Start background polling loop
  static start() {
    if (this.isLoopRunning) return;
    this.isLoopRunning = true;

    console.log("🚀 Starting Rider Matching Engine Polling Loop...");
    setInterval(() => {
      this.processMatchingPool().catch((err) => {
        console.error("[MatchingService] Error in matching loop:", err);
      });
    }, 10000); // Check every 10 seconds
  }

  // Process all sub-orders ready for pickup
  static async processMatchingPool() {
    await RiderOffer.updateMany(
      { status: "OPEN", expiresAt: { $lte: new Date() } },
      { $set: { status: "EXPIRED", respondedAt: new Date() } },
    );

    const activeMatches = await SubOrder.find({
      status: SubOrderStatus.READY_FOR_PICKUP,
      $or: [
        { "delivery.riderId": { $exists: false } },
        { "delivery.riderId": null },
      ],
    }).populate("storeId parentOrderId");

    for (const subOrder of activeMatches) {
      await this.matchSubOrder(subOrder);
    }
  }

  // Match a single sub-order immediately (e.g. triggered on status change)
  static async initiateMatching(subOrderId: string) {
    const subOrder = await SubOrder.findById(subOrderId).populate(
      "storeId parentOrderId",
    );
    if (
      subOrder &&
      subOrder.status === SubOrderStatus.READY_FOR_PICKUP &&
      !subOrder.delivery.riderId
    ) {
      await this.matchSubOrder(subOrder);
    }
  }

  static matchingStage(subOrder: any) {
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

  static async diagnostics(subOrderId: string) {
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

    const stage = this.matchingStage(subOrder);
    const store = subOrder.storeId as any;
    const storeLng = store?.currentLocation?.coordinates?.[0];
    const storeLat = store?.currentLocation?.coordinates?.[1];
    const storeCoords =
      Number.isFinite(Number(storeLat)) && Number.isFinite(Number(storeLng))
        ? { latitude: Number(storeLat), longitude: Number(storeLng) }
        : null;

    const busyRiderIds = await this.busyRiderUserIds();
    const busyRiderSet = new Set(busyRiderIds.map((id) => this.idString(id)));
    const capacitySummary = await riderCapacityCountsByRider();
    const capacityBlockedSet = new Set(
      capacitySummary.atCapacityIds.map((id) => this.idString(id)),
    );
    const rejectionSummary = await this.rejectionCountsForSubOrder(
      subOrder._id,
    );
    const rejectionBlockedSet = new Set(
      rejectionSummary.blockedIds.map((id) => this.idString(id)),
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
        const riderUserId = this.idString(rider.userId?._id || rider.userId);
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

  private static validCoordsFromGeoJson(currentLocation?: any) {
    const longitude = Number(currentLocation?.coordinates?.[0]);
    const latitude = Number(currentLocation?.coordinates?.[1]);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    return { latitude, longitude };
  }

  private static async logNoQualifiedRiders(input: {
    subOrder: any;
    store: any;
    parentOrder: any;
    radiusMeters: number;
    stage: number;
    elapsedSeconds: number;
    reason: string;
  }) {
    const key =
      input.subOrder?._id?.toString?.() ||
      input.subOrder?.subOrderId ||
      "unknown";
    const now = Date.now();
    const last = this.lastDiagnosticLogAt.get(key) || 0;
    if (now - last < 30000) return;
    this.lastDiagnosticLogAt.set(key, now);

    const storeCoords = this.validCoordsFromGeoJson(
      input.store?.currentLocation,
    );
    const customerCoords = input.parentOrder?.shippingAddress
      ? {
          latitude: Number(input.parentOrder.shippingAddress.latitude),
          longitude: Number(input.parentOrder.shippingAddress.longitude),
        }
      : null;

    const busyRiderIds = await this.busyRiderUserIds();
    const busyRiderSet = new Set(busyRiderIds.map((id) => this.idString(id)));
    const capacitySummary = await riderCapacityCountsByRider();
    const capacityBlockedSet = new Set(
      capacitySummary.atCapacityIds.map((id) => this.idString(id)),
    );
    const rejectionSummary = await this.rejectionCountsForSubOrder(
      input.subOrder._id,
    );
    const rejectionBlockedSet = new Set(
      rejectionSummary.blockedIds.map((id) => this.idString(id)),
    );

    const approvedOnlineRiders = await DeliveryBoy.find({
      status: "APPROVED",
      isOnline: true,
    })
      .populate("userId", "fullName email phone")
      .lean();

    const riderDiagnostics = approvedOnlineRiders
      .map((rider: any) => {
        const riderUserId = this.idString(rider.userId?._id || rider.userId);
        const rejectionCount =
          rejectionSummary.countByRiderId.get(riderUserId) || 0;
        const acceptedCountInWindow =
          capacitySummary.countByRiderId.get(riderUserId) || 0;
        const riderCoords = this.validCoordsFromGeoJson(rider.currentLocation);
        const distanceKm =
          riderCoords && storeCoords
            ? distanceKmBetween(riderCoords, storeCoords)
            : null;
        return {
          profileId: rider._id?.toString(),
          userId: riderUserId,
          email: rider.userId?.email,
          phone: rider.userId?.phone,
          isVerified: !!rider.isVerified,
          hasActiveJob: busyRiderSet.has(riderUserId),
          acceptedCountInWindow,
          maxAcceptedOrders: capacitySummary.maxAcceptedOrders,
          acceptanceWindowHours: capacitySummary.windowHours,
          atAcceptanceCapacity: capacityBlockedSet.has(riderUserId),
          rejectionCount,
          offerSuppressedForSubOrder: rejectionBlockedSet.has(riderUserId),
          hasGps: !!riderCoords,
          rawCoordinates: rider.currentLocation?.coordinates || null,
          location: riderCoords,
          distanceKm:
            distanceKm === null ? null : Number(distanceKm.toFixed(3)),
          withinRadius:
            distanceKm === null
              ? false
              : distanceKm * 1000 <= input.radiusMeters,
        };
      })
      .sort(
        (a, b) =>
          (a.distanceKm ?? Number.POSITIVE_INFINITY) -
          (b.distanceKm ?? Number.POSITIVE_INFINITY),
      );

    const blockers: string[] = [];
    if (!storeCoords) blockers.push("Store pickup GPS is missing/invalid.");
    if (!approvedOnlineRiders.length)
      blockers.push("No approved online rider profiles found.");
    if (
      approvedOnlineRiders.length &&
      !riderDiagnostics.some((rider) => rider.hasGps)
    ) {
      blockers.push(
        "Approved online riders exist, but none have GPS coordinates saved.",
      );
    }
    if (
      storeCoords &&
      riderDiagnostics.some((rider) => rider.hasGps) &&
      !riderDiagnostics.some((rider) => rider.withinRadius)
    ) {
      blockers.push(
        `Approved online riders with GPS exist, but none are within ${input.radiusMeters / 1000} km of the store.`,
      );
    }
    if (
      storeCoords &&
      riderDiagnostics.some((rider) => rider.withinRadius) &&
      !riderDiagnostics.some(
        (rider) => rider.withinRadius && !rider.atAcceptanceCapacity,
      )
    ) {
      blockers.push(
        `Approved online riders are within radius, but all are at the ${capacitySummary.maxAcceptedOrders} accepted order limit for ${capacitySummary.windowHours} hours.`,
      );
    }
    if (
      storeCoords &&
      riderDiagnostics.some(
        (rider) => rider.withinRadius && !rider.atAcceptanceCapacity,
      ) &&
      !riderDiagnostics.some(
        (rider) =>
          rider.withinRadius &&
          !rider.atAcceptanceCapacity &&
          !rider.offerSuppressedForSubOrder,
      )
    ) {
      blockers.push(
        `Approved online riders are within radius, but all nearby available riders have already rejected this sub-order ${MAX_RIDER_REJECTIONS_PER_SUB_ORDER} times.`,
      );
    }

    // console.warn(
    //   "[MatchingService] Matching diagnostics",
    //   JSON.stringify(
    //     {
    //       reason: input.reason,
    //       subOrder: {
    //         _id: input.subOrder?._id?.toString?.(),
    //         subOrderId: input.subOrder?.subOrderId,
    //         status: input.subOrder?.status,
    //         deliveryStatus: input.subOrder?.delivery?.status,
    //         pickupTiming: input.subOrder?.packageDetails?.pickupTiming,
    //       },
    //       matching: {
    //         stage: input.stage,
    //         radiusKm: input.radiusMeters / 1000,
    //         elapsedSeconds: Math.round(input.elapsedSeconds),
    //       },
    //       store: {
    //         _id: input.store?._id?.toString?.(),
    //         name: input.store?.name,
    //         rawCoordinates: input.store?.currentLocation?.coordinates || null,
    //         location: storeCoords,
    //       },
    //       customer: {
    //         rawLatitude: input.parentOrder?.shippingAddress?.latitude,
    //         rawLongitude: input.parentOrder?.shippingAddress?.longitude,
    //         location:
    //           customerCoords &&
    //           Number.isFinite(customerCoords.latitude) &&
    //           Number.isFinite(customerCoords.longitude)
    //             ? customerCoords
    //             : null,
    //       },
    //       riderSummary: {
    //         approvedOnline: approvedOnlineRiders.length,
    //         approvedOnlineVerified: approvedOnlineRiders.filter(
    //           (rider: any) => rider.isVerified,
    //         ).length,
    //         approvedOnlineWithGps: riderDiagnostics.filter(
    //           (rider) => rider.hasGps,
    //         ).length,
    //         busyWithActiveJob: riderDiagnostics.filter(
    //           (rider) => rider.hasActiveJob,
    //         ).length,
    //         atAcceptanceCapacity: riderDiagnostics.filter(
    //           (rider) => rider.atAcceptanceCapacity,
    //         ).length,
    //         suppressedByRejections: riderDiagnostics.filter(
    //           (rider) => rider.offerSuppressedForSubOrder,
    //         ).length,
    //         withinRadius: riderDiagnostics.filter((rider) => rider.withinRadius)
    //           .length,
    //         eligibleWithinRadius: riderDiagnostics.filter(
    //           (rider) =>
    //             rider.withinRadius &&
    //             !rider.atAcceptanceCapacity &&
    //             !rider.offerSuppressedForSubOrder,
    //         ).length,
    //       },
    //       nearestRiders: riderDiagnostics.slice(0, 5),
    //       blockers,
    //     },
    //     null,
    //     2,
    //   ),
    // );
  }

  // Execute matching algorithm for a sub-order
  private static async matchSubOrder(subOrder: any) {
    const stageDetails = this.matchingStage(subOrder);
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
      await this.logNoQualifiedRiders({
        subOrder,
        store,
        parentOrder,
        radiusMeters,
        stage,
        elapsedSeconds,
        reason: "Store location coordinates missing",
      });
      return;
    }

    const storeLng = store.currentLocation.coordinates[0];
    const storeLat = store.currentLocation.coordinates[1];

    const capacitySummary = await riderCapacityCountsByRider();
    const rejectionSummary = await this.rejectionCountsForSubOrder(
      subOrder._id,
    );
    const excludedRiderIds = this.objectIdsFrom([
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
      await this.logNoQualifiedRiders({
        subOrder,
        store,
        parentOrder,
        radiusMeters,
        stage,
        elapsedSeconds,
        reason: "No qualified riders matched geospatial radius query",
      });
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

      // Priority Score logic
      const rating = 4.5; // default fallback
      const acceptanceRate = 0.9; // default fallback
      const completionRate = 0.95; // default fallback
      const onlineHours = 4.0; // default fallback

      // Priority score equation:
      // Score = distanceWeight + acceptanceRateWeight + completionRateWeight + ratingWeight + onlineTimeWeight
      const distanceScore = Math.max(0, 10 - riderDistanceToStore); // Closer is higher score
      const score =
        distanceScore * 0.4 +
        rating * 2.0 +
        acceptanceRate * 10 +
        completionRate * 10 +
        onlineHours * 0.1;

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
}
