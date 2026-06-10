import { Types } from "mongoose";
import { SubOrder, SubOrderStatus } from "./subOrder.model";
import { Order } from "./order.model";
import { Store } from "../store/store.model";
import { DeliveryBoy } from "../deliveryBoy/delivery.model";
import { User } from "../user/user.model";
import { ApiError } from "../../utils/ApiError";
import { socketService } from "../socket/socket.service";
import { TimelineHelper } from "./timeline.helper";
import type { IRequestInfo } from "./timeline.helper";
import { DeliveryStatus, OrderStatus } from "./order.type";
import { SocketEvents } from "../../constants/socketEvents";
import { MAX_RIDER_REJECTIONS_PER_SUB_ORDER, RiderOffer } from "../fulfillment/riderOffer.model";
import { ReturnRequest } from "../fulfillment/returnRequest.model";
import { CodSettlement } from "../fulfillment/codSettlement.model";
import { fulfillmentEventService } from "../fulfillment/fulfillmentEvent.service";
import { SavedAddress } from "../savedAddress/savedAddresses.model";
import { riderCapacitySnapshot } from "../delivery/riderCapacity";

// GPS distance calculation utility
const finiteLocation = (location?: any) => {
    const latitude = Number(location?.latitude);
    const longitude = Number(location?.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    return { latitude, longitude };
};

export const distanceKmBetween = (from?: any, to?: any) => {
    const origin = finiteLocation(from);
    const destination = finiteLocation(to);
    if (!origin || !destination) return null;

    const radiusKm = 6371;
    const toRadians = (degrees: number) => degrees * (Math.PI / 180);
    const dLat = toRadians(destination.latitude - origin.latitude);
    const dLng = toRadians(destination.longitude - origin.longitude);
    const lat1 = toRadians(origin.latitude);
    const lat2 = toRadians(destination.latitude);
    const a = Math.sin(dLat / 2) ** 2
        + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return radiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export function calculateRiderPayout(distanceKm: number, bonuses?: { rain?: number; peak?: number; festival?: number; night?: number }) {
    let payout = 20; // Default base
    if (distanceKm <= 3) {
        payout = 20;
    } else if (distanceKm <= 5) {
        payout = 30;
    } else if (distanceKm <= 8) {
        payout = 45;
    } else {
        const extraKm = Math.ceil(distanceKm - 8);
        payout = 45 + (extraKm * 5);
    }

    const rain = bonuses?.rain || 0;
    const peak = bonuses?.peak || 0;
    const festival = bonuses?.festival || 0;
    const night = bonuses?.night || 0;

    return {
        basePayout: payout,
        totalPayout: payout + rain + peak + festival + night,
        bonuses: { rain, peak, festival, night }
    };
}

export class SubOrderService {
    private static idString(value: any): string {
        if (!value) return "";
        if (typeof value === "string") return value;
        if (typeof value.toHexString === "function") return value.toHexString();
        if (value._id) return this.idString(value._id);
        return value.toString?.() || String(value);
    }

    private static async parentOrderOf(subOrder: any) {
        if (subOrder.parentOrderId && typeof subOrder.parentOrderId === "object" && subOrder.parentOrderId.userId) {
            return subOrder.parentOrderId;
        }
        return await Order.findById(this.idString(subOrder.parentOrderId)).lean();
    }

    private static async customerLocationFor(parentOrder: any) {
        const shippingCoords = finiteLocation({
            latitude: parentOrder.shippingAddress?.latitude,
            longitude: parentOrder.shippingAddress?.longitude,
        });

        if (shippingCoords && !(shippingCoords.latitude === 0 && shippingCoords.longitude === 0)) {
            return { coords: shippingCoords, source: "order_shipping_address" };
        }

        const userId = this.idString(parentOrder.userId);
        if (!userId || !parentOrder.shippingAddress) return null;

        const savedAddress = await SavedAddress.findOne({
            userId: new Types.ObjectId(userId),
            phone: parentOrder.shippingAddress.phone,
            pincode: parentOrder.shippingAddress.pincode,
            latitude: { $exists: true, $ne: 0 },
            longitude: { $exists: true, $ne: 0 },
        }).sort({ updatedAt: -1 });

        const savedCoords = finiteLocation(savedAddress);
        if (!savedCoords || (savedCoords.latitude === 0 && savedCoords.longitude === 0)) {
            return null;
        }

        await Order.updateOne(
            { _id: parentOrder._id },
            {
                $set: {
                    "shippingAddress.latitude": savedCoords.latitude,
                    "shippingAddress.longitude": savedCoords.longitude,
                },
            }
        );

        parentOrder.shippingAddress.latitude = savedCoords.latitude;
        parentOrder.shippingAddress.longitude = savedCoords.longitude;

        return { coords: savedCoords, source: "saved_address_backfill" };
    }

    private static async publishUpdate(
        subOrder: any,
        input: {
            type: string;
            actor: "CUSTOMER" | "SELLER" | "RIDER" | "SYSTEM" | "ADMIN";
            actorId?: string;
            message: string;
            metadata?: Record<string, any>;
        },
    ) {
        const parentOrder = await this.parentOrderOf(subOrder);
        const customerId = this.idString(parentOrder?.userId);
        const sellerId = this.idString(subOrder.sellerId);
        const riderId = this.idString(subOrder.delivery?.riderId);
        const orderId = parentOrder?.orderId;
        const subOrderId = subOrder.subOrderId;

        return fulfillmentEventService.record({
            type: input.type,
            status: subOrder.status,
            actor: input.actor,
            actorId: input.actorId,
            orderId,
            orderObjectId: this.idString(parentOrder?._id || subOrder.parentOrderId),
            subOrderId,
            subOrderObjectId: this.idString(subOrder._id),
            metadata: {
                message: input.message,
                deliveryStatus: subOrder.delivery?.status,
                ...input.metadata,
            },
            rooms: [
                "admin",
                ...(sellerId ? [`seller:${sellerId}`] : []),
                ...(riderId ? [`rider:${riderId}`] : []),
            ],
            recipients: [
                ...(customerId ? [{ userId: customerId, title: "Order update", body: input.message, push: true }] : []),
                ...(sellerId ? [{ userId: sellerId, title: "Fulfillment update", body: input.message }] : []),
                ...(riderId ? [{ userId: riderId, title: "Delivery update", body: input.message }] : []),
            ],
        });
    }

    // Helper to update parent order status
    private static async syncParentOrderStatus(parentOrderId: string | Types.ObjectId, requestInfo?: IRequestInfo) {
        const subOrders = await SubOrder.find({ parentOrderId });
        const allStatuses = subOrders.map(so => so.status);

        let newParentStatus = OrderStatus.CONFIRMED;

        const deliveredStatuses = [
            SubOrderStatus.DELIVERED,
            SubOrderStatus.DELIVERY_CONFIRMED,
            SubOrderStatus.COMPLETED,
        ];
        const cancelledStatuses = [
            SubOrderStatus.CANCELLED,
            SubOrderStatus.REJECTED,
            SubOrderStatus.SELLER_REJECTED,
            SubOrderStatus.SELLER_CANCELLED,
            SubOrderStatus.CUSTOMER_CANCELLED,
        ];
        const failedStatuses = [
            SubOrderStatus.PICKUP_FAILED,
            SubOrderStatus.DELIVERY_FAILED,
            SubOrderStatus.CUSTOMER_UNREACHABLE,
            SubOrderStatus.DISPUTED,
        ];

        const allDelivered = allStatuses.every(s => deliveredStatuses.includes(s));
        const allCancelled = allStatuses.every(s => cancelledStatuses.includes(s));
        const allCompletedOrCancelled = allStatuses.every(s => 
            deliveredStatuses.includes(s) ||
            cancelledStatuses.includes(s) ||
            failedStatuses.includes(s)
        );

        if (allDelivered) {
            newParentStatus = OrderStatus.DELIVERED;
        } else if (allCancelled) {
            newParentStatus = OrderStatus.CANCELLED;
        } else if (failedStatuses.some((status) => allStatuses.includes(status))) {
            newParentStatus = OrderStatus.FAILED;
        } else if (allCompletedOrCancelled) {
            newParentStatus = OrderStatus.DELIVERED; // Partially delivered or completed
        } else if (allStatuses.some(s => s === SubOrderStatus.PICKED_UP || s === SubOrderStatus.IN_TRANSIT || s === SubOrderStatus.NEAR_CUSTOMER)) {
            newParentStatus = OrderStatus.SHIPPED;
        } else if (allStatuses.some(s => s === SubOrderStatus.PROCESSING || s === SubOrderStatus.PACKED || s === SubOrderStatus.READY_FOR_PICKUP || s === SubOrderStatus.RIDER_ASSIGNMENT_OPEN || s === SubOrderStatus.RIDER_ASSIGNED || s === SubOrderStatus.RIDER_ACCEPTED)) {
            newParentStatus = OrderStatus.PROCESSING;
        }

        await Order.findByIdAndUpdate(parentOrderId, { status: newParentStatus });

        // Notify user
        const order = await Order.findById(parentOrderId);
        if (order) {
            socketService.emitToUser(order.userId.toString(), SocketEvents.ORDER_STATUS_UPDATE, {
                orderId: order.orderId,
                status: newParentStatus,
                message: `Your order QB-${order.orderId} status has changed to ${newParentStatus}`
            });
        }
    }

    static async listSellerSubOrders(sellerId: string, query: any = {}) {
        const filter: any = { sellerId: new Types.ObjectId(sellerId) };
        if (query.status) {
            filter.status = query.status;
        }
        
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 10;
        const skip = (page - 1) * limit;

        const subOrders = await SubOrder.find(filter)
            .populate("parentOrderId")
            .populate("delivery.riderId", "fullName email phone")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await SubOrder.countDocuments(filter);

        return {
            data: subOrders,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    static async getSellerSubOrder(sellerId: string, subOrderId: string) {
        const subOrder = await SubOrder.findOne({
            $or: [{ subOrderId }, ...(subOrderId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: subOrderId }] : [])],
            sellerId: new Types.ObjectId(sellerId)
        }).populate("parentOrderId").populate("delivery.riderId", "fullName email phone");

        if (!subOrder) {
            throw new ApiError(404, "Sub-order not found or does not belong to you");
        }
        return subOrder;
    }

    static async getSubOrderById(subOrderId: string) {
        const subOrder = await SubOrder.findOne({
            $or: [{ subOrderId }, ...(subOrderId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: subOrderId }] : [])]
        }).populate("parentOrderId sellerId storeId delivery.riderId");

        if (!subOrder) {
            throw new ApiError(404, "Sub-order not found");
        }
        return subOrder;
    }

    // 1. CONFIRMED -> PROCESSING (Seller accepts)
    static async transitionToProcessing(subOrderId: string, sellerId: string, requestInfo?: IRequestInfo) {
        const subOrder = await this.getSellerSubOrder(sellerId, subOrderId);

        if (subOrder.status !== SubOrderStatus.CONFIRMED) {
            throw new ApiError(400, `Cannot process sub-order in status ${subOrder.status}`);
        }

        subOrder.status = SubOrderStatus.PROCESSING;
        subOrder.timeline.push(
            TimelineHelper.createEvent(
                SubOrderStatus.PROCESSING,
                "SELLER",
                sellerId,
                requestInfo,
                { message: "Seller accepted and started processing the order" }
            )
        );

        await subOrder.save();
        await this.syncParentOrderStatus(subOrder.parentOrderId, requestInfo);
        await this.publishUpdate(subOrder, {
            type: "seller_accepted",
            actor: "SELLER",
            actorId: sellerId,
            message: `Seller accepted and started processing sub-order ${subOrder.subOrderId}.`,
        });

        const parentOrder = await this.parentOrderOf(subOrder);
        socketService.emitToUser(this.idString(parentOrder?.userId), SocketEvents.ORDER_STATUS_UPDATE, {
            subOrderId: subOrder.subOrderId,
            status: SubOrderStatus.PROCESSING,
            message: `Seller accepted and is preparing your package for sub-order ${subOrder.subOrderId}.`
        });

        return subOrder;
    }

    // 2. PROCESSING -> PACKED (Seller packs)
    static async transitionToPacked(subOrderId: string, sellerId: string, requestInfo?: IRequestInfo) {
        const subOrder = await this.getSellerSubOrder(sellerId, subOrderId);

        if (subOrder.status !== SubOrderStatus.PROCESSING) {
            throw new ApiError(400, `Cannot pack sub-order in status ${subOrder.status}`);
        }

        subOrder.status = SubOrderStatus.PACKED;
        subOrder.timeline.push(
            TimelineHelper.createEvent(
                SubOrderStatus.PACKED,
                "SELLER",
                sellerId,
                requestInfo,
                { message: "Seller packed the items" }
            )
        );

        await subOrder.save();
        await this.syncParentOrderStatus(subOrder.parentOrderId, requestInfo);
        await this.publishUpdate(subOrder, {
            type: "suborder_packed",
            actor: "SELLER",
            actorId: sellerId,
            message: `Sub-order ${subOrder.subOrderId} has been packed.`,
        });

        const parentOrder = await this.parentOrderOf(subOrder);
        socketService.emitToUser(this.idString(parentOrder?.userId), SocketEvents.ORDER_STATUS_UPDATE, {
            subOrderId: subOrder.subOrderId,
            status: SubOrderStatus.PACKED,
            message: `Your sub-order ${subOrder.subOrderId} has been packed.`
        });

        return subOrder;
    }

    // 3. PACKED -> READY_FOR_PICKUP (Seller inputs package details & triggers matching engine)
    static async transitionToReadyForPickup(
        subOrderId: string,
        sellerId: string,
        packageDetails: {
            dimensions?: { length: number; width: number; height: number };
            weight: number;
            packageCount: number;
            isFragile: boolean;
            pickupNotes?: string;
        },
        requestInfo?: IRequestInfo
    ) {
        const subOrder = await this.getSellerSubOrder(sellerId, subOrderId);

        if (subOrder.status !== SubOrderStatus.PACKED && subOrder.status !== SubOrderStatus.PROCESSING) {
            throw new ApiError(400, `Cannot mark sub-order as ready for pickup in status ${subOrder.status}`);
        }

        // Lock package details
        subOrder.packageDetails = {
            dimensions: packageDetails.dimensions,
            weight: packageDetails.weight || 0,
            packageCount: packageDetails.packageCount || 1,
            isFragile: !!packageDetails.isFragile,
            pickupNotes: packageDetails.pickupNotes,
            pickupTiming: new Date(),
            lockedAt: new Date(),
            isCod: subOrder.packageDetails?.isCod ?? false,
            otpRequired: subOrder.packageDetails?.otpRequired ?? true
        };

        subOrder.status = SubOrderStatus.READY_FOR_PICKUP;
        subOrder.delivery.status = DeliveryStatus.ASSIGNMENT_OPEN;
        subOrder.timeline.push(
            TimelineHelper.createEvent(
                SubOrderStatus.READY_FOR_PICKUP,
                "SELLER",
                sellerId,
                requestInfo,
                { message: "Package details locked. Ready for rider assignment." }
            )
        );

        await subOrder.save();
        await this.syncParentOrderStatus(subOrder.parentOrderId, requestInfo);
        await this.publishUpdate(subOrder, {
            type: "ready_for_pickup",
            actor: "SELLER",
            actorId: sellerId,
            message: `Sub-order ${subOrder.subOrderId} is ready for pickup. Searching for nearby riders.`,
            metadata: { packageDetails: subOrder.packageDetails },
        });

        const parentOrder = await this.parentOrderOf(subOrder);
        socketService.emitToUser(this.idString(parentOrder?.userId), SocketEvents.ORDER_STATUS_UPDATE, {
            subOrderId: subOrder.subOrderId,
            status: SubOrderStatus.READY_FOR_PICKUP,
            message: `Your sub-order ${subOrder.subOrderId} is ready for pickup. Finding nearby delivery partner.`
        });

        // Trigger matching service broadcast
        // We'll import and call it asynchronously
        import("../delivery/matching.service").then(module => {
            module.MatchingService.initiateMatching(subOrder._id.toString());
        }).catch(err => {
            console.error("[SubOrderService] Failed to trigger matching service:", err);
        });

        return subOrder;
    }

    // 4. READY_FOR_PICKUP -> RIDER_ASSIGNED (Rider accepts offer)
    static async riderAcceptOrder(riderUserId: string, subOrderId: string, requestInfo?: IRequestInfo) {
        // Atomic fetch & update to prevent race conditions
        const riderProfile = await DeliveryBoy.findOne({ userId: new Types.ObjectId(riderUserId), status: "APPROVED" }).populate("userId");
        if (!riderProfile) {
            throw new ApiError(404, "Rider profile not found or not approved");
        }

        // Fetch store coordinates & calculate distance for payout
        const subOrder = await SubOrder.findOne({
            $or: [{ subOrderId }, ...(subOrderId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: subOrderId }] : [])]
        }).populate("storeId parentOrderId");

        if (!subOrder) {
            throw new ApiError(404, "Sub-order not found");
        }

        if (subOrder.status !== SubOrderStatus.READY_FOR_PICKUP) {
            throw new ApiError(409, "Order already assigned to another rider or not ready");
        }

        const capacity = await riderCapacitySnapshot(riderUserId);
        if (!capacity.canAccept) {
            throw new ApiError(
                429,
                `Rider has reached the ${capacity.maxAcceptedOrders} accepted order limit for the last ${capacity.windowHours} hours. Capacity resets as older accepted orders leave the rolling window.`
            );
        }

        const store = subOrder.storeId as any;
        const parentOrder = subOrder.parentOrderId as any;
        if (!store || !store.currentLocation || !store.currentLocation.coordinates) {
            throw new ApiError(400, "Store location coordinates are missing; cannot assign rider");
        }

        const storeCoords = {
            latitude: store.currentLocation.coordinates[1],
            longitude: store.currentLocation.coordinates[0]
        };

        const riderCoords = riderProfile.currentLocation?.coordinates ? {
            latitude: riderProfile.currentLocation.coordinates[1],
            longitude: riderProfile.currentLocation.coordinates[0]
        } : null;

        const customerCoords = parentOrder.shippingAddress ? {
            latitude: parentOrder.shippingAddress.latitude,
            longitude: parentOrder.shippingAddress.longitude
        } : null;

        let distanceKm = 0;
        if (storeCoords && customerCoords) {
            distanceKm = distanceKmBetween(storeCoords, customerCoords) || 0;
        }

        // Apply bonus parameters if present in the configuration or query
        const payoutInfo = calculateRiderPayout(distanceKm, {
            rain: subOrder.delivery?.bonuses?.rain || 0,
            peak: subOrder.delivery?.bonuses?.peak || 0,
            festival: subOrder.delivery?.bonuses?.festival || 0,
            night: subOrder.delivery?.bonuses?.night || 0
        });
        const assignedAt = new Date();

        // Perform the atomic transition
        const updatedSubOrder = await SubOrder.findOneAndUpdate(
            {
                _id: subOrder._id,
                status: SubOrderStatus.READY_FOR_PICKUP
            },
            {
                $set: {
                    status: SubOrderStatus.RIDER_ASSIGNED,
                    "delivery.riderId": new Types.ObjectId(riderUserId),
                    "delivery.riderProfileId": riderProfile._id,
                    "delivery.status": DeliveryStatus.ASSIGNED,
                    "delivery.payoutAmount": payoutInfo.totalPayout,
                    "delivery.bonuses": payoutInfo.bonuses,
                    "delivery.assignedAt": assignedAt
                },
                $push: {
                    timeline: TimelineHelper.createEvent(
                        SubOrderStatus.RIDER_ASSIGNED,
                        "RIDER",
                        riderUserId,
                        requestInfo,
                        {
                            message: `Order assigned to rider ${riderProfile._id}`,
                            riderPhone: (riderProfile.userId as any)?.phone,
                            payout: payoutInfo.totalPayout,
                            distanceKm,
                            riderAcceptedCountInWindow: capacity.acceptedCount + 1,
                            riderMaxAcceptedOrders: capacity.maxAcceptedOrders,
                            riderAcceptanceWindowHours: capacity.windowHours,
                        }
                    )
                }
            },
            { returnDocument: "after" }
        );

        if (!updatedSubOrder) {
            throw new ApiError(409, "Order already assigned to another rider or not ready");
        }

        await RiderOffer.updateOne(
            { subOrderObjectId: subOrder._id, riderId: new Types.ObjectId(riderUserId), status: "OPEN" },
            { $set: { status: "ACCEPTED", respondedAt: new Date() } },
        ).catch(() => undefined);
        await RiderOffer.updateMany(
            { subOrderObjectId: subOrder._id, riderId: { $ne: new Types.ObjectId(riderUserId) }, status: "OPEN" },
            { $set: { status: "EXPIRED", respondedAt: new Date() } },
        ).catch(() => undefined);

        await this.publishUpdate(updatedSubOrder, {
            type: "rider_assigned",
            actor: "RIDER",
            actorId: riderUserId,
            message: `Rider assigned for sub-order ${updatedSubOrder.subOrderId}.`,
            metadata: {
                payout: payoutInfo.totalPayout,
                distanceKm,
                riderAcceptedCountInWindow: capacity.acceptedCount + 1,
                riderMaxAcceptedOrders: capacity.maxAcceptedOrders,
                riderAcceptanceWindowHours: capacity.windowHours,
            },
        });

        // Notify client
        socketService.emitToUser(parentOrder.userId.toString(), SocketEvents.ORDER_STATUS_UPDATE, {
            subOrderId: updatedSubOrder.subOrderId,
            status: SubOrderStatus.RIDER_ASSIGNED,
            message: `Rider has been assigned and is heading to the store to pick up your order.`
        });

        // Notify Seller
        socketService.emitToUser(subOrder.sellerId.toString(), SocketEvents.ORDER_STATUS_UPDATE, {
            subOrderId: updatedSubOrder.subOrderId,
            status: SubOrderStatus.RIDER_ASSIGNED,
            message: `Rider is assigned to pickup sub-order ${updatedSubOrder.subOrderId}.`
        });

        return updatedSubOrder;
    }

    // 5. RIDER_ASSIGNED -> RIDER_ARRIVING (Rider marks arriving)
    static async riderArriving(subOrderId: string, riderUserId: string, requestInfo?: IRequestInfo) {
        const subOrder = await this.getSubOrderById(subOrderId);

        if (this.idString(subOrder.delivery.riderId) !== riderUserId) {
            throw new ApiError(403, "You are not the assigned rider for this sub-order");
        }

        if (subOrder.status !== SubOrderStatus.RIDER_ASSIGNED) {
            throw new ApiError(400, `Cannot mark arriving in status ${subOrder.status}`);
        }

        subOrder.status = SubOrderStatus.RIDER_ARRIVING;
        subOrder.delivery.status = DeliveryStatus.ARRIVING_AT_STORE;
        subOrder.timeline.push(
            TimelineHelper.createEvent(
                SubOrderStatus.RIDER_ARRIVING,
                "RIDER",
                riderUserId,
                requestInfo,
                { message: "Rider is heading to the pickup store." }
            )
        );

        await subOrder.save();
        await this.publishUpdate(subOrder, {
            type: "rider_arriving_at_store",
            actor: "RIDER",
            actorId: riderUserId,
            message: `Rider is heading to the store for sub-order ${subOrder.subOrderId}.`,
        });

        socketService.emitToUser(subOrder.sellerId.toString(), SocketEvents.ORDER_STATUS_UPDATE, {
            subOrderId: subOrder.subOrderId,
            status: SubOrderStatus.RIDER_ARRIVING,
            message: `Rider is arriving at your store for sub-order ${subOrder.subOrderId}.`
        });

        return subOrder;
    }

    // 6. RIDER_ARRIVING -> RIDER_REACHED_STORE (Requires 100m GPS validation)
    static async riderReachedStore(
        subOrderId: string,
        riderUserId: string,
        location: { latitude: number; longitude: number },
        requestInfo?: IRequestInfo
    ) {
        const subOrder = await this.getSubOrderById(subOrderId);

        if (this.idString(subOrder.delivery.riderId) !== riderUserId) {
            throw new ApiError(403, "You are not the assigned rider for this sub-order");
        }

        if (subOrder.status !== SubOrderStatus.RIDER_ARRIVING && subOrder.status !== SubOrderStatus.RIDER_ASSIGNED) {
            throw new ApiError(400, `Cannot mark reached store in status ${subOrder.status}`);
        }

        // GPS Check: Store Coordinates vs Rider Location
        const store = await Store.findById(subOrder.storeId);
        if (!store || !store.currentLocation?.coordinates) {
            throw new ApiError(400, "Store location coordinates are missing; cannot verify reached store");
        }

        const storeCoords = {
            latitude: store.currentLocation.coordinates[1],
            longitude: store.currentLocation.coordinates[0]
        };

        const distance = distanceKmBetween(location, storeCoords);
        if (distance === null || distance > 0.35) { // 350m allowance for GPS drifts
            throw new ApiError(400, `GPS check failed: You are too far from the store (${distance ? (distance * 1000).toFixed(0) : "unknown"}m). You must be within 350m.`);
        }

        subOrder.status = SubOrderStatus.RIDER_REACHED_STORE;
        subOrder.delivery.status = DeliveryStatus.REACHED_STORE;
        subOrder.timeline.push(
            TimelineHelper.createEvent(
                SubOrderStatus.RIDER_REACHED_STORE,
                "RIDER",
                riderUserId,
                requestInfo,
                { message: "Rider reached store", distanceMeters: Math.round(distance * 1000) }
            )
        );

        await subOrder.save();
        await this.publishUpdate(subOrder, {
            type: "rider_reached_store",
            actor: "RIDER",
            actorId: riderUserId,
            message: `Rider reached the store for sub-order ${subOrder.subOrderId}.`,
            metadata: { distanceMeters: Math.round(distance * 1000) },
        });

        socketService.emitToUser(subOrder.sellerId.toString(), SocketEvents.ORDER_STATUS_UPDATE, {
            subOrderId: subOrder.subOrderId,
            status: SubOrderStatus.RIDER_REACHED_STORE,
            message: `Rider has reached your store for sub-order ${subOrder.subOrderId}. Please hand over the OTP: ${subOrder.delivery.pickupOtp}`
        });

        return subOrder;
    }

    // 7. RIDER_REACHED_STORE -> PICKED_UP (Requires OTP Verification & photo upload)
    static async riderPickup(
        subOrderId: string,
        riderUserId: string,
        pickupOtp: string,
        pickupPhoto: string,
        requestInfo?: IRequestInfo
    ) {
        const subOrder = await this.getSubOrderById(subOrderId);

        if (this.idString(subOrder.delivery.riderId) !== riderUserId) {
            throw new ApiError(403, "You are not the assigned rider for this sub-order");
        }

        if (subOrder.status !== SubOrderStatus.RIDER_REACHED_STORE && subOrder.status !== SubOrderStatus.RIDER_ASSIGNED && subOrder.status !== SubOrderStatus.RIDER_ARRIVING) {
            throw new ApiError(400, `Cannot mark picked up in status ${subOrder.status}`);
        }

        // Validate OTP
        if (subOrder.delivery.pickupOtp !== pickupOtp) {
            throw new ApiError(400, "Invalid pickup OTP code");
        }

        if (!pickupPhoto) {
            throw new ApiError(400, "Photo proof is required at pickup checkpoint");
        }

        subOrder.status = SubOrderStatus.PICKED_UP;
        subOrder.delivery.status = DeliveryStatus.PICKED_UP;
        subOrder.delivery.pickupPhoto = pickupPhoto;
        subOrder.timeline.push(
            TimelineHelper.createEvent(
                SubOrderStatus.PICKED_UP,
                "RIDER",
                riderUserId,
                requestInfo,
                { message: "OTP verified. Package picked up by rider.", pickupPhoto }
            )
        );

        await subOrder.save();
        await this.syncParentOrderStatus(subOrder.parentOrderId, requestInfo);
        await this.publishUpdate(subOrder, {
            type: "order_picked_up",
            actor: "RIDER",
            actorId: riderUserId,
            message: `Sub-order ${subOrder.subOrderId} was picked up from the seller.`,
            metadata: { pickupPhoto },
        });

        // Notify client
        const parentOrder = subOrder.parentOrderId as any;
        socketService.emitToUser(parentOrder.userId.toString(), SocketEvents.ORDER_STATUS_UPDATE, {
            subOrderId: subOrder.subOrderId,
            status: SubOrderStatus.PICKED_UP,
            message: `Your package for sub-order ${subOrder.subOrderId} has been picked up.`
        });

        return subOrder;
    }

    // 8. PICKED_UP -> IN_TRANSIT (Rider starts transit)
    static async startTransit(subOrderId: string, riderUserId: string, requestInfo?: IRequestInfo) {
        const subOrder = await this.getSubOrderById(subOrderId);

        if (this.idString(subOrder.delivery.riderId) !== riderUserId) {
            throw new ApiError(403, "You are not the assigned rider for this sub-order");
        }

        if (subOrder.status !== SubOrderStatus.PICKED_UP) {
            throw new ApiError(400, `Cannot mark in transit in status ${subOrder.status}`);
        }

        subOrder.status = SubOrderStatus.IN_TRANSIT;
        subOrder.delivery.status = DeliveryStatus.IN_TRANSIT;
        subOrder.timeline.push(
            TimelineHelper.createEvent(
                SubOrderStatus.IN_TRANSIT,
                "RIDER",
                riderUserId,
                requestInfo,
                { message: "Rider departed and is on the way to your shipping address." }
            )
        );

        await subOrder.save();
        await this.syncParentOrderStatus(subOrder.parentOrderId, requestInfo);
        await this.publishUpdate(subOrder, {
            type: "in_transit",
            actor: "RIDER",
            actorId: riderUserId,
            message: `Rider is in transit with sub-order ${subOrder.subOrderId}.`,
        });

        const parentOrder = subOrder.parentOrderId as any;
        socketService.emitToUser(parentOrder.userId.toString(), SocketEvents.ORDER_STATUS_UPDATE, {
            subOrderId: subOrder.subOrderId,
            status: SubOrderStatus.IN_TRANSIT,
            message: `Rider is on the way with your package.`
        });

        return subOrder;
    }

    // 9. IN_TRANSIT -> NEAR_CUSTOMER (Requires 200m GPS validation)
    static async riderNearCustomer(
        subOrderId: string,
        riderUserId: string,
        location: { latitude: number; longitude: number; heading?: number },
        requestInfo?: IRequestInfo
    ) {
        const subOrder = await this.getSubOrderById(subOrderId);

        if (this.idString(subOrder.delivery.riderId) !== riderUserId) {
            throw new ApiError(403, "You are not the assigned rider for this sub-order");
        }

        if (subOrder.status !== SubOrderStatus.IN_TRANSIT) {
            throw new ApiError(400, `Cannot mark near customer in status ${subOrder.status}`);
        }

        const parentOrder = subOrder.parentOrderId as any;
        const riderCoords = finiteLocation(location);
        if (!riderCoords) {
            throw new ApiError(400, "Rider GPS location is missing or invalid; cannot verify proximity");
        }

        const customerLocation = await this.customerLocationFor(parentOrder);
        if (!customerLocation) {
            throw new ApiError(
                400,
                "Customer shipping address GPS is missing. Ask the customer to update the delivery address with a location pin before near-customer verification."
            );
        }

        const distance = distanceKmBetween(riderCoords, customerLocation.coords);
        if (distance === null || distance > 0.35) { // 350m allowance for GPS
            throw new ApiError(400, `GPS check failed: You are too far from the customer's address (${distance ? (distance * 1000).toFixed(0) : "unknown"}m). You must be within 350m.`);
        }

        subOrder.status = SubOrderStatus.NEAR_CUSTOMER;
        subOrder.delivery.status = DeliveryStatus.NEAR_CUSTOMER;
        subOrder.delivery.currentLocation = {
            ...riderCoords,
            heading: Number(location?.heading) || 0,
            updatedAt: new Date(),
        };
        subOrder.timeline.push(
            TimelineHelper.createEvent(
                SubOrderStatus.NEAR_CUSTOMER,
                "RIDER",
                riderUserId,
                requestInfo,
                {
                    message: "Rider is near customer location",
                    distanceMeters: Math.round(distance * 1000),
                    customerGpsSource: customerLocation.source,
                }
            )
        );

        await subOrder.save();
        await this.publishUpdate(subOrder, {
            type: "near_customer",
            actor: "RIDER",
            actorId: riderUserId,
            message: `Rider is near the customer for sub-order ${subOrder.subOrderId}.`,
            metadata: {
                distanceMeters: Math.round(distance * 1000),
                customerGpsSource: customerLocation.source,
            },
        });

        socketService.emitToUser(parentOrder.userId.toString(), SocketEvents.ORDER_STATUS_UPDATE, {
            subOrderId: subOrder.subOrderId,
            status: SubOrderStatus.NEAR_CUSTOMER,
            message: `Rider has arrived near your location. Share the delivery OTP: ${subOrder.delivery.deliveryOtp}`
        });

        return subOrder;
    }

    // 10. NEAR_CUSTOMER -> DELIVERED (Requires OTP Verification & photo upload + updates rider wallet)
    static async riderDeliver(
        subOrderId: string,
        riderUserId: string,
        deliveryOtp: string,
        deliveryPhoto: string,
        deliverySignature?: string,
        requestInfo?: IRequestInfo
    ) {
        const subOrder = await this.getSubOrderById(subOrderId);

        if (this.idString(subOrder.delivery.riderId) !== riderUserId) {
            throw new ApiError(403, "You are not the assigned rider for this sub-order");
        }

        if (subOrder.status !== SubOrderStatus.NEAR_CUSTOMER && subOrder.status !== SubOrderStatus.IN_TRANSIT && subOrder.status !== SubOrderStatus.PICKED_UP) {
            throw new ApiError(400, `Cannot mark delivered in status ${subOrder.status}`);
        }

        if (subOrder.delivery.deliveryOtp !== deliveryOtp) {
            throw new ApiError(400, "Invalid delivery OTP code");
        }

        if (!deliveryPhoto) {
            throw new ApiError(400, "Photo proof of delivery is required");
        }

        subOrder.status = SubOrderStatus.DELIVERED;
        subOrder.delivery.status = DeliveryStatus.DELIVERED;
        subOrder.delivery.deliveryPhoto = deliveryPhoto;
        if (deliverySignature) {
            subOrder.delivery.deliverySignature = deliverySignature;
        }

        subOrder.timeline.push(
            TimelineHelper.createEvent(
                SubOrderStatus.DELIVERED,
                "RIDER",
                riderUserId,
                requestInfo,
                { message: "Delivery OTP verified. Package handed over successfully.", deliveryPhoto }
            )
        );

        await subOrder.save();

        // 11. Credit Rider Wallet earnings and log COD liability if applicable
        const payout = subOrder.delivery.payoutAmount || 0;
        const riderProfile = await DeliveryBoy.findOne({ userId: new Types.ObjectId(riderUserId) });

        if (riderProfile) {
            if (!riderProfile.wallet) {
                riderProfile.wallet = { availableBalance: 0, pendingPayoutBalance: 0, lifetimeEarnings: 0, collectedCodLiability: 0 };
            }
            riderProfile.wallet.lifetimeEarnings = (riderProfile.wallet.lifetimeEarnings || 0) + payout;
            riderProfile.wallet.availableBalance = (riderProfile.wallet.availableBalance || 0) + payout;
            
            // If COD, rider collects cash, creating a liability balance
            if (subOrder.packageDetails?.isCod) {
                riderProfile.wallet.collectedCodLiability = (riderProfile.wallet.collectedCodLiability || 0) + subOrder.payableAmount;
            }

            await riderProfile.save();
        }

        await this.syncParentOrderStatus(subOrder.parentOrderId, requestInfo);
        await this.publishUpdate(subOrder, {
            type: "delivered",
            actor: "RIDER",
            actorId: riderUserId,
            message: `Sub-order ${subOrder.subOrderId} has been delivered successfully.`,
            metadata: { deliveryPhoto, deliverySignature },
        });

        const parentOrder = subOrder.parentOrderId as any;
        socketService.emitToUser(parentOrder.userId.toString(), SocketEvents.ORDER_STATUS_UPDATE, {
            subOrderId: subOrder.subOrderId,
            status: SubOrderStatus.DELIVERED,
            message: `Your sub-order ${subOrder.subOrderId} has been successfully delivered! Thank you.`
        });

        // Notify Seller
        socketService.emitToUser(subOrder.sellerId.toString(), SocketEvents.ORDER_STATUS_UPDATE, {
            subOrderId: subOrder.subOrderId,
            status: SubOrderStatus.DELIVERED,
            message: `Sub-order ${subOrder.subOrderId} has been successfully delivered to the customer.`
        });

        return subOrder;
    }

    // Cancellation: Customer Request
    static async customerRequestCancellation(subOrderId: string, userId: string, reason: string, requestInfo?: IRequestInfo) {
        const subOrder = await SubOrder.findOne({
            $or: [{ subOrderId }, ...(subOrderId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: subOrderId }] : [])]
        }).populate("parentOrderId");

        if (!subOrder) {
            throw new ApiError(404, "Sub-order not found");
        }

        const parentOrder = subOrder.parentOrderId as any;
        if (parentOrder.userId.toString() !== userId) {
            throw new ApiError(403, "You do not have permission to cancel this order");
        }

        // Rule A: Before Seller Acceptance (status is CONFIRMED) -> Cancel immediately
        if (subOrder.status === SubOrderStatus.CONFIRMED) {
            subOrder.status = SubOrderStatus.CANCELLED;
            subOrder.timeline.push(
                TimelineHelper.createEvent(
                    SubOrderStatus.CANCELLED,
                    "CUSTOMER",
                    userId,
                    requestInfo,
                    { message: `Order cancelled by customer. Reason: ${reason}` }
                )
            );
            await subOrder.save();
            await this.syncParentOrderStatus(subOrder.parentOrderId, requestInfo);
            await this.publishUpdate(subOrder, {
                type: "customer_cancelled",
                actor: "CUSTOMER",
                actorId: userId,
                message: `Customer cancelled sub-order ${subOrder.subOrderId}.`,
                metadata: { reason },
            });

            socketService.emitToUser(subOrder.sellerId.toString(), SocketEvents.ORDER_STATUS_UPDATE, {
                subOrderId: subOrder.subOrderId,
                status: SubOrderStatus.CANCELLED,
                message: `Sub-order ${subOrder.subOrderId} was cancelled by customer.`
            });

            return { subOrder, cancelled: true, message: "Order cancelled successfully." };
        }

        // Rule B: After Seller Acceptance (PROCESSING or PACKED) -> Requires Seller Approval
        if (subOrder.status === SubOrderStatus.PROCESSING || subOrder.status === SubOrderStatus.PACKED) {
            subOrder.timeline.push(
                TimelineHelper.createEvent(
                    subOrder.status,
                    "CUSTOMER",
                    userId,
                    requestInfo,
                    { message: "Customer requested cancellation. Pending seller approval.", reason }
                )
            );

            // Save cancel request details on timeline metadata or schema. Since we do not have specific schema fields for cancellation request,
            // we can mark suborder metadata in timeline, and notify the seller.
            await subOrder.save();
            await this.publishUpdate(subOrder, {
                type: "cancellation_requested",
                actor: "CUSTOMER",
                actorId: userId,
                message: `Customer requested cancellation for sub-order ${subOrder.subOrderId}.`,
                metadata: { reason },
            });

            socketService.emitToUser(subOrder.sellerId.toString(), SocketEvents.ORDER_STATUS_UPDATE, {
                subOrderId: subOrder.subOrderId,
                status: subOrder.status,
                cancelRequested: true,
                message: `Customer requested cancellation for sub-order ${subOrder.subOrderId}. Reason: ${reason}. Please approve or reject.`
            });

            return { subOrder, cancelled: false, message: "Cancellation request sent to seller for approval." };
        }

        // Rule C: After Rider Assignment (RIDER_ASSIGNED, RIDER_ARRIVING, RIDER_REACHED_STORE) -> Requires Seller Approval, warning about cancellation fee
        if ([SubOrderStatus.RIDER_ASSIGNED, SubOrderStatus.RIDER_ARRIVING, SubOrderStatus.RIDER_REACHED_STORE].includes(subOrder.status)) {
            subOrder.timeline.push(
                TimelineHelper.createEvent(
                    subOrder.status,
                    "CUSTOMER",
                    userId,
                    requestInfo,
                    { message: "Customer requested cancellation. Subject to cancellation fee. Pending seller approval.", reason }
                )
            );

            await subOrder.save();
            await this.publishUpdate(subOrder, {
                type: "cancellation_requested",
                actor: "CUSTOMER",
                actorId: userId,
                message: `Customer requested cancellation for sub-order ${subOrder.subOrderId}.`,
                metadata: { reason, cancellationFeeMayApply: true },
            });

            socketService.emitToUser(subOrder.sellerId.toString(), SocketEvents.ORDER_STATUS_UPDATE, {
                subOrderId: subOrder.subOrderId,
                status: subOrder.status,
                cancelRequested: true,
                message: `Customer requested cancellation for sub-order ${subOrder.subOrderId}. (Rider assigned, fee may apply). Reason: ${reason}.`
            });

            return { subOrder, cancelled: false, message: "Cancellation request sent to seller. Cancellation fee may apply." };
        }

        // Rule D: After pickup -> strictly forbidden
        throw new ApiError(400, "Package already picked up by rider. Cancellation is blocked.");
    }

    // Cancellation: Seller approves/rejects customer cancellation
    static async sellerApproveCancellation(
        subOrderId: string,
        sellerId: string,
        approve: boolean,
        requestInfo?: IRequestInfo
    ) {
        const subOrder = await this.getSellerSubOrder(sellerId, subOrderId);

        if (approve) {
            subOrder.status = SubOrderStatus.CANCELLED;
            if (subOrder.delivery.riderId) {
                // Notify rider that order is cancelled
                socketService.emitToUser(subOrder.delivery.riderId.toString(), SocketEvents.ORDER_STATUS_UPDATE, {
                    subOrderId: subOrder.subOrderId,
                    status: DeliveryStatus.CANCELLED,
                    message: `Sub-order ${subOrder.subOrderId} has been cancelled by customer/seller.`
                });
                
                // Clear rider assignment
                subOrder.delivery.riderId = undefined;
                subOrder.delivery.riderProfileId = undefined;
                subOrder.delivery.status = DeliveryStatus.CANCELLED;
            }

            subOrder.timeline.push(
                TimelineHelper.createEvent(
                    SubOrderStatus.CANCELLED,
                    "SELLER",
                    sellerId,
                    requestInfo,
                    { message: "Seller approved customer cancellation request." }
                )
            );

            await subOrder.save();
            await this.syncParentOrderStatus(subOrder.parentOrderId, requestInfo);
            await this.publishUpdate(subOrder, {
                type: "cancellation_approved",
                actor: "SELLER",
                actorId: sellerId,
                message: `Seller approved cancellation for sub-order ${subOrder.subOrderId}.`,
            });

            const parentOrder = await this.parentOrderOf(subOrder);
            socketService.emitToUser(this.idString(parentOrder?.userId), SocketEvents.ORDER_STATUS_UPDATE, {
                subOrderId: subOrder.subOrderId,
                status: SubOrderStatus.CANCELLED,
                message: `Seller approved your cancellation request for sub-order ${subOrder.subOrderId}.`
            });

            return { subOrder, approved: true };
        } else {
            subOrder.timeline.push(
                TimelineHelper.createEvent(
                    subOrder.status,
                    "SELLER",
                    sellerId,
                    requestInfo,
                    { message: "Seller rejected customer cancellation request." }
                )
            );

            await subOrder.save();
            await this.publishUpdate(subOrder, {
                type: "cancellation_rejected",
                actor: "SELLER",
                actorId: sellerId,
                message: `Seller rejected cancellation for sub-order ${subOrder.subOrderId}.`,
            });

            const parentOrder = await this.parentOrderOf(subOrder);
            socketService.emitToUser(this.idString(parentOrder?.userId), SocketEvents.ORDER_STATUS_UPDATE, {
                subOrderId: subOrder.subOrderId,
                status: subOrder.status,
                message: `Seller rejected your cancellation request for sub-order ${subOrder.subOrderId}. Preparing dispatch.`
            });

            return { subOrder, approved: false };
        }
    }

    // Cancellation: Rider cancels before pickup
    static async riderCancelBeforePickup(subOrderId: string, riderUserId: string, reason: string, requestInfo?: IRequestInfo) {
        const subOrder = await this.getSubOrderById(subOrderId);

        if (this.idString(subOrder.delivery.riderId) !== riderUserId) {
            throw new ApiError(403, "You are not the assigned rider for this sub-order");
        }

        if ([SubOrderStatus.PICKED_UP, SubOrderStatus.IN_TRANSIT, SubOrderStatus.NEAR_CUSTOMER, SubOrderStatus.DELIVERED].includes(subOrder.status)) {
            throw new ApiError(400, "Package already picked up. Rider cancellation is blocked. Contact administrator.");
        }

        // Put order back into matching pool
        subOrder.status = SubOrderStatus.READY_FOR_PICKUP;
        subOrder.delivery.riderId = undefined;
        subOrder.delivery.riderProfileId = undefined;
        subOrder.delivery.status = DeliveryStatus.UNASSIGNED;
        subOrder.delivery.payoutAmount = 0;

        subOrder.timeline.push(
            TimelineHelper.createEvent(
                SubOrderStatus.READY_FOR_PICKUP,
                "RIDER",
                riderUserId,
                requestInfo,
                { message: `Rider cancelled assignment. Reason: ${reason}. Order returned to matching pool.` }
            )
        );

        await subOrder.save();
        await this.syncParentOrderStatus(subOrder.parentOrderId, requestInfo);
        await RiderOffer.updateMany(
            { subOrderObjectId: subOrder._id, riderId: new Types.ObjectId(riderUserId), status: "OPEN" },
            { $set: { status: "REJECTED", respondedAt: new Date(), metadata: { reason } } },
        ).catch(() => undefined);
        await this.publishUpdate(subOrder, {
            type: "rider_cancelled_before_pickup",
            actor: "RIDER",
            actorId: riderUserId,
            message: `Rider cancelled pickup for sub-order ${subOrder.subOrderId}. Searching for a replacement rider.`,
            metadata: { reason },
        });

        // Notify Seller
        socketService.emitToUser(subOrder.sellerId.toString(), SocketEvents.ORDER_STATUS_UPDATE, {
            subOrderId: subOrder.subOrderId,
            status: SubOrderStatus.READY_FOR_PICKUP,
            message: `Rider cancelled pickup for sub-order ${subOrder.subOrderId}. Finding replacement.`
        });

        // Trigger matching service broadcast
        import("../delivery/matching.service").then(module => {
            module.MatchingService.initiateMatching(subOrder._id.toString());
        }).catch(err => {
            console.error("[SubOrderService] Failed to trigger matching service:", err);
        });

        return subOrder;
    }

    // 14. Admin: List all sub-orders for tracking
    static async listAdminSubOrders(query: any = {}) {
        const filter: any = {};
        if (query.status && query.status !== "ALL") {
            filter.status = query.status;
        }
        if (query.sellerId) {
            filter.sellerId = new Types.ObjectId(query.sellerId);
        }
        if (query.riderId) {
            filter["delivery.riderId"] = new Types.ObjectId(query.riderId);
        }
        if (query.search) {
            filter.$or = [
                { subOrderId: { $regex: query.search, $options: "i" } },
                { subOrderId: query.search }
            ];
        }
        
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 10;
        const skip = (page - 1) * limit;

        const subOrders = await SubOrder.find(filter)
            .populate("parentOrderId sellerId storeId delivery.riderId")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await SubOrder.countDocuments(filter);

        return {
            data: subOrders,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    // 15. Admin: Manually assign a rider to a sub-order
    static async adminManualAssignRider(subOrderId: string, riderUserId: string, requestInfo?: IRequestInfo) {
        const subOrder = await this.getSubOrderById(subOrderId);

        if ([SubOrderStatus.DELIVERED, SubOrderStatus.COMPLETED, SubOrderStatus.CANCELLED].includes(subOrder.status)) {
            throw new ApiError(400, "Cannot assign rider to a finalized order");
        }

        const riderProfile = await DeliveryBoy.findOne({ userId: new Types.ObjectId(riderUserId), status: "APPROVED" }).populate("userId");
        if (!riderProfile) {
            throw new ApiError(404, "Approved delivery partner not found for this user ID");
        }

        const capacity = await riderCapacitySnapshot(riderUserId);
        if (!capacity.canAccept) {
            throw new ApiError(
                429,
                `Rider has reached the ${capacity.maxAcceptedOrders} accepted order limit for the last ${capacity.windowHours} hours.`
            );
        }

        const storeLocation = (subOrder.storeId as any)?.currentLocation || (subOrder.storeId as any)?.location;
        const storeCoords = storeLocation?.coordinates
            ? { latitude: storeLocation.coordinates[1], longitude: storeLocation.coordinates[0] }
            : null;
        
        const parentOrder = subOrder.parentOrderId as any;
        const customerCoords = parentOrder?.shippingAddress?.latitude && parentOrder?.shippingAddress?.longitude
            ? { latitude: parentOrder.shippingAddress.latitude, longitude: parentOrder.shippingAddress.longitude }
            : null;

        let distanceKm = 0;
        if (storeCoords && customerCoords) {
            distanceKm = distanceKmBetween(storeCoords, customerCoords) || 0;
        }

        const payoutInfo = calculateRiderPayout(distanceKm, {
            rain: subOrder.delivery?.bonuses?.rain || 0,
            peak: subOrder.delivery?.bonuses?.peak || 0,
            festival: subOrder.delivery?.bonuses?.festival || 0,
            night: subOrder.delivery?.bonuses?.night || 0
        });

        // Update fields
        subOrder.status = SubOrderStatus.RIDER_ASSIGNED;
        subOrder.delivery.riderId = new Types.ObjectId(riderUserId);
        subOrder.delivery.riderProfileId = riderProfile._id;
        subOrder.delivery.status = DeliveryStatus.ASSIGNED;
        subOrder.delivery.payoutAmount = payoutInfo.totalPayout;
        subOrder.delivery.bonuses = payoutInfo.bonuses;
        subOrder.delivery.assignedAt = new Date();

        subOrder.timeline.push(
            TimelineHelper.createEvent(
                SubOrderStatus.RIDER_ASSIGNED,
                "ADMIN",
                requestInfo?.actorId ? new Types.ObjectId(requestInfo.actorId) : undefined,
                requestInfo,
                {
                    message: `Administrator manually assigned rider: ${riderProfile.wallet ? "Approved Partner" : "Partner"}.`,
                    riderName: (riderProfile.userId as any)?.fullName,
                    riderPhone: (riderProfile.userId as any)?.phone,
                    payout: payoutInfo.totalPayout,
                    distanceKm,
                    riderAcceptedCountInWindow: capacity.acceptedCount + 1,
                    riderMaxAcceptedOrders: capacity.maxAcceptedOrders,
                    riderAcceptanceWindowHours: capacity.windowHours,
                }
            )
        );

        await subOrder.save();
        await this.syncParentOrderStatus(subOrder.parentOrderId, requestInfo);
        await RiderOffer.updateMany(
            { subOrderObjectId: subOrder._id, status: "OPEN" },
            { $set: { status: "CANCELLED", respondedAt: new Date() } },
        ).catch(() => undefined);
        await this.publishUpdate(subOrder, {
            type: "admin_rider_assigned",
            actor: "ADMIN",
            actorId: requestInfo?.actorId,
            message: `Admin assigned a rider to sub-order ${subOrder.subOrderId}.`,
            metadata: {
                riderUserId,
                payout: payoutInfo.totalPayout,
                distanceKm,
                riderAcceptedCountInWindow: capacity.acceptedCount + 1,
                riderMaxAcceptedOrders: capacity.maxAcceptedOrders,
                riderAcceptanceWindowHours: capacity.windowHours,
            },
        });

        // Notify Customer
        socketService.emitToUser(parentOrder.userId.toString(), SocketEvents.ORDER_STATUS_UPDATE, {
            subOrderId: subOrder.subOrderId,
            status: SubOrderStatus.RIDER_ASSIGNED,
            message: `Rider manually assigned to your sub-order ${subOrder.subOrderId}.`
        });

        // Notify Seller
        socketService.emitToUser(subOrder.sellerId.toString(), SocketEvents.ORDER_STATUS_UPDATE, {
            subOrderId: subOrder.subOrderId,
            status: SubOrderStatus.RIDER_ASSIGNED,
            message: `Admin manually assigned rider to pick up sub-order ${subOrder.subOrderId}.`
        });

        return subOrder;
    }

    // 16. Admin: Settle rider COD liability
    static async adminConfirmCodDeposit(subOrderId: string, adminUserId: string, requestInfo?: IRequestInfo) {
        const subOrder = await this.getSubOrderById(subOrderId);

        if (!subOrder.packageDetails?.isCod) {
            throw new ApiError(400, "This is not a Cash on Delivery order");
        }

        const isAlreadySettled = subOrder.timeline.some(
            event => event.status === "COD_SETTLED"
        );
        if (isAlreadySettled) {
            throw new ApiError(400, "This sub-order COD liability is already settled");
        }

        const riderUserId = subOrder.delivery.riderId;
        if (!riderUserId) {
            throw new ApiError(400, "No rider is assigned to this order");
        }

        const riderProfile = await DeliveryBoy.findOne({ userId: riderUserId });
        if (!riderProfile) {
            throw new ApiError(404, "Rider profile not found");
        }

        const settlementAmount = subOrder.payableAmount;
        let previousLiability = 0;
        let newLiability = 0;
        if (riderProfile.wallet) {
            previousLiability = riderProfile.wallet.collectedCodLiability || 0;
            newLiability = Math.max(0, previousLiability - settlementAmount);
            riderProfile.wallet.collectedCodLiability = newLiability;
            await riderProfile.save();
        }

        await CodSettlement.create({
            riderId: riderUserId,
            riderProfileId: riderProfile._id,
            amount: settlementAmount,
            previousLiability,
            newLiability,
            status: "VERIFIED",
            note: `COD deposit settled for ${subOrder.subOrderId}`,
            verifiedBy: new Types.ObjectId(adminUserId),
        });

        // Add settled timeline event
        subOrder.timeline.push(
            TimelineHelper.createEvent(
                "COD_SETTLED",
                "ADMIN",
                new Types.ObjectId(adminUserId),
                requestInfo,
                {
                    message: `Admin confirmed deposit of Rs. ${settlementAmount} from rider. COD liability cleared.`,
                    settlementAmount,
                    codSettled: true
                }
            )
        );

        await subOrder.save();
        await this.publishUpdate(subOrder, {
            type: "cod_settled",
            actor: "ADMIN",
            actorId: adminUserId,
            message: `COD liability settled for sub-order ${subOrder.subOrderId}.`,
            metadata: { settlementAmount, previousLiability, newLiability },
        });

        // Notify Rider
        socketService.emitToUser(riderUserId.toString(), SocketEvents.ORDER_STATUS_UPDATE, {
            subOrderId: subOrder.subOrderId,
            status: "COD_SETTLED",
            message: `Administrator has confirmed your cash deposit of Rs. ${settlementAmount} for order ${subOrder.subOrderId}.`
        });

        return subOrder;
    }

    static async riderAcceptOffer(riderUserId: string, offerId: string, requestInfo?: IRequestInfo) {
        const offer = await RiderOffer.findOne({
            $or: [
                { offerId },
                ...(offerId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: offerId }] : []),
            ],
            riderId: new Types.ObjectId(riderUserId),
            status: "OPEN",
            expiresAt: { $gt: new Date() },
        });

        if (!offer) {
            throw new ApiError(404, "Open rider offer not found or already expired");
        }

        return await this.riderAcceptOrder(riderUserId, offer.subOrderId, requestInfo);
    }

    static async riderRejectOffer(riderUserId: string, offerId: string, reason?: string, requestInfo?: IRequestInfo) {
        const riderObjectId = new Types.ObjectId(riderUserId);
        const offer = await RiderOffer.findOneAndUpdate(
            {
                $or: [
                    { offerId },
                    ...(offerId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: offerId }] : []),
                ],
                riderId: riderObjectId,
                status: "OPEN",
            },
            {
                $set: {
                    status: "REJECTED",
                    respondedAt: new Date(),
                    metadata: { reason },
                },
            },
            { returnDocument: "after" },
        );

        if (!offer) {
            throw new ApiError(404, "Open rider offer not found");
        }

        const rejectionCount = await RiderOffer.countDocuments({
            subOrderObjectId: offer.subOrderObjectId,
            riderId: riderObjectId,
            status: "REJECTED",
        });
        const suppressedForSubOrder = rejectionCount >= MAX_RIDER_REJECTIONS_PER_SUB_ORDER;

        offer.metadata = {
            ...(offer.metadata || {}),
            reason,
            rejectionCount,
            maxRejections: MAX_RIDER_REJECTIONS_PER_SUB_ORDER,
            suppressedForSubOrder,
        };
        await offer.save();

        const subOrder = await this.getSubOrderById(offer.subOrderId);
        await this.publishUpdate(subOrder, {
            type: "rider_rejected_offer",
            actor: "RIDER",
            actorId: riderUserId,
            message: `A rider rejected the offer for sub-order ${subOrder.subOrderId}.`,
            metadata: {
                reason,
                offerId: offer.offerId,
                rejectionCount,
                maxRejections: MAX_RIDER_REJECTIONS_PER_SUB_ORDER,
                suppressedForSubOrder,
            },
        });

        return offer;
    }

    static async customerRequestReturn(subOrderId: string, userId: string, reason: string, requestInfo?: IRequestInfo) {
        const subOrder = await SubOrder.findOne({
            $or: [{ subOrderId }, ...(subOrderId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: subOrderId }] : [])]
        }).populate("parentOrderId");

        if (!subOrder) throw new ApiError(404, "Sub-order not found");

        const parentOrder = subOrder.parentOrderId as any;
        if (parentOrder.userId.toString() !== userId) {
            throw new ApiError(403, "You do not have permission to return this order");
        }

        if (![SubOrderStatus.PICKED_UP, SubOrderStatus.IN_TRANSIT, SubOrderStatus.NEAR_CUSTOMER, SubOrderStatus.DELIVERED, SubOrderStatus.COMPLETED].includes(subOrder.status)) {
            throw new ApiError(400, "Return can only be initiated after pickup or delivery");
        }

        const existing = await ReturnRequest.findOne({
            subOrderObjectId: subOrder._id,
            status: { $nin: ["RETURN_REJECTED", "REFUNDED"] },
        });
        if (existing) return existing;

        subOrder.status = SubOrderStatus.RETURN_INITIATED;
        subOrder.timeline.push(
            TimelineHelper.createEvent(
                SubOrderStatus.RETURN_INITIATED,
                "CUSTOMER",
                userId,
                requestInfo,
                { message: `Return requested. Reason: ${reason}` },
            ),
        );
        await subOrder.save();
        await this.syncParentOrderStatus(subOrder.parentOrderId, requestInfo);

        const returnRequest = await ReturnRequest.create({
            parentOrderId: parentOrder._id,
            subOrderObjectId: subOrder._id,
            subOrderId: subOrder.subOrderId,
            customerId: new Types.ObjectId(userId),
            sellerId: subOrder.sellerId,
            status: "RETURN_REQUESTED",
            reason,
            pickupOtp: Math.floor(100000 + Math.random() * 900000).toString(),
            timeline: [
                TimelineHelper.createEvent(
                    SubOrderStatus.RETURN_INITIATED,
                    "CUSTOMER",
                    userId,
                    requestInfo,
                    { message: "Return request created", reason },
                ),
            ],
        });

        await this.publishUpdate(subOrder, {
            type: "return_requested",
            actor: "CUSTOMER",
            actorId: userId,
            message: `Return requested for sub-order ${subOrder.subOrderId}.`,
            metadata: { reason, returnId: returnRequest.returnId },
        });

        return returnRequest;
    }
}
