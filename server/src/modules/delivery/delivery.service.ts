import { Types } from "mongoose";
import { SocketEvents } from "../../constants/socketEvents";
import { ApiError } from "../../utils/ApiError";
import { AdminPayout } from "../admin/admin.model";
import { appConfigService } from "../appConfig/appConfig.service";
import { DeliveryBoy } from "../deliveryBoy/delivery.model";
import { Order } from "../order/order.model";
import { SubOrder, SubOrderStatus } from "../order/subOrder.model";
import { DeliveryStatus, OrderStatus } from "../order/order.type";
import { orderService } from "../order/order.service";
import { socketService } from "../socket/socket.service";
import { User } from "../user/user.model";
import { MAX_RIDER_REJECTIONS_PER_SUB_ORDER, RiderOffer } from "../fulfillment/riderOffer.model";
import { SubOrderService } from "../order/subOrder.service";
import { MatchingService } from "./matching.service";
import { riderCapacitySnapshot } from "./riderCapacity";

const ACTIVE_DELIVERY_STATUSES = [
    DeliveryStatus.ASSIGNED,
    DeliveryStatus.ACCEPTED,
    DeliveryStatus.ARRIVING_AT_STORE,
    DeliveryStatus.REACHED_STORE,
    DeliveryStatus.PICKUP_VERIFICATION_PENDING,
    DeliveryStatus.PICKED_UP,
    DeliveryStatus.IN_TRANSIT,
    DeliveryStatus.NEAR_CUSTOMER,
    DeliveryStatus.OUT_FOR_DELIVERY,
];

const transitionMap: Record<string, DeliveryStatus> = {
    [DeliveryStatus.ASSIGNED]: DeliveryStatus.ACCEPTED,
    [DeliveryStatus.ACCEPTED]: DeliveryStatus.PICKED_UP,
    [DeliveryStatus.PICKED_UP]: DeliveryStatus.OUT_FOR_DELIVERY,
    [DeliveryStatus.OUT_FOR_DELIVERY]: DeliveryStatus.DELIVERED,
};

const timestampFieldByStatus: Partial<Record<DeliveryStatus, string>> = {
    [DeliveryStatus.ACCEPTED]: "delivery.acceptedAt",
    [DeliveryStatus.PICKED_UP]: "delivery.pickedUpAt",
    [DeliveryStatus.OUT_FOR_DELIVERY]: "delivery.outForDeliveryAt",
    [DeliveryStatus.DELIVERED]: "delivery.deliveredAt",
};

const locationPayload = (location?: { latitude: number; longitude: number; heading?: number }) =>
    location
        ? {
            latitude: location.latitude,
            longitude: location.longitude,
            heading: location.heading || 0,
            updatedAt: new Date(),
        }
        : undefined;

const idString = (value: any): string => {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value.toHexString === "function") return value.toHexString();
    if (value._id) return idString(value._id);
    return value.toString?.() || String(value);
};

const toObjectId = (value: any) => new Types.ObjectId(idString(value));

const coordinatesFromGeoJson = (currentLocation?: any) =>
    currentLocation
        ? {
            longitude: currentLocation.coordinates?.[0],
            latitude: currentLocation.coordinates?.[1],
        }
        : null;

const finiteLocation = (location?: any) => {
    const latitude = Number(location?.latitude);
    const longitude = Number(location?.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    return { latitude, longitude };
};

const distanceKmBetween = (from?: any, to?: any) => {
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

const populateOrder = (query: any) =>
    query
        .populate("userId", "fullName email phone")
        .populate("delivery.partnerUserId", "fullName email phone");

const normalizeStatus = (order: any) => order?.delivery?.status || DeliveryStatus.UNASSIGNED;

const dateRangeFilter = (field: string, query: any) => {
    const range: any = {};
    if (query.dateFrom) range.$gte = query.dateFrom;
    if (query.dateTo) {
        const end = new Date(query.dateTo);
        end.setHours(23, 59, 59, 999);
        range.$lte = end;
    }
    return Object.keys(range).length ? { [field]: range } : {};
};

const dateRange = (query: any) => {
    const range: any = {};
    if (query.dateFrom) range.$gte = query.dateFrom;
    if (query.dateTo) {
        const end = new Date(query.dateTo);
        end.setHours(23, 59, 59, 999);
        range.$lte = end;
    }
    return Object.keys(range).length ? range : null;
};

const deliveryHistoryDateFilter = (query: any) => {
    const range = dateRange(query);
    if (!range) return {};

    const statusFieldMap: Record<string, string> = {
        [DeliveryStatus.ASSIGNED]: "delivery.assignedAt",
        [DeliveryStatus.ACCEPTED]: "delivery.acceptedAt",
        [DeliveryStatus.PICKED_UP]: "delivery.pickedUpAt",
        [DeliveryStatus.OUT_FOR_DELIVERY]: "delivery.outForDeliveryAt",
        [DeliveryStatus.DELIVERED]: "delivery.deliveredAt",
    };

    const fields = query.status && statusFieldMap[query.status]
        ? [statusFieldMap[query.status]]
        : [
            "delivery.assignedAt",
            "delivery.acceptedAt",
            "delivery.pickedUpAt",
            "delivery.outForDeliveryAt",
            "delivery.deliveredAt",
            "delivery.payoutCreditedAt",
            "updatedAt",
            "createdAt",
        ];

    return { $or: fields.map((field) => ({ [field as string]: range })) };
};

const walletOf = (profile: any) => profile?.wallet || {
    availableBalance: 0,
    pendingPayoutBalance: 0,
    lifetimeEarnings: 0,
    collectedCodLiability: 0,
};

const payoutMethodLabel = (method: any) => {
    if (method.type === "BANK") return method.bank?.bankName || method.label || "Bank account";
    if (method.type === "UPI") return method.upi?.upiId || method.label || "UPI";
    return method.label || method.type;
};

const serializePayoutMethod = (method: any) => ({
    _id: method._id?.toString(),
    type: method.type,
    label: method.label,
    status: method.status,
    isDefault: !!method.isDefault,
    bank: method.bank,
    upi: method.upi,
    rejectionReason: method.rejectionReason,
    verifiedAt: method.verifiedAt,
    createdAt: method.createdAt,
    displayName: payoutMethodLabel(method),
});

const serializeDeliveryProfile = (profile: any) => ({
    _id: profile._id?.toString(),
    userId: profile.userId,
    fullName: profile.userId?.fullName,
    email: profile.userId?.email,
    phone: profile.userId?.phone,
    status: profile.status,
    isVerified: !!profile.isVerified,
    isOnline: !!profile.isOnline,
    vehicleType: profile.vehicleType,
    vehicleNumber: profile.vehicleNumber,
    licenseNumber: profile.licenseNumber,
    address: profile.address,
    bankDetails: profile.bankDetails,
    payoutMethods: (profile.payoutMethods || []).map(serializePayoutMethod),
    wallet: walletOf(profile),
    currentLocation: coordinatesFromGeoJson(profile.currentLocation),
});

const serializeOffer = (offer: any) => ({
    _id: offer._id?.toString(),
    offerId: offer.offerId,
    subOrderId: offer.subOrderId,
    status: offer.status,
    stage: offer.stage,
    radiusKm: offer.radiusKm,
    payoutAmount: offer.payoutAmount,
    distanceKm: offer.distanceKm,
    riderDistanceToStoreKm: offer.riderDistanceToStoreKm,
    expiresAt: offer.expiresAt,
    createdAt: offer.createdAt,
    metadata: offer.metadata || {},
    subOrder: offer.subOrderObjectId,
});

const mapSubOrderToRiderFormat = (subOrder: any) => {
    if (!subOrder) return null;
    const parentOrder = subOrder.parentOrderId || {};
    return {
        _id: subOrder._id?.toString(),
        orderId: subOrder.subOrderId,
        userId: parentOrder.userId,
        shippingAddress: parentOrder.shippingAddress || {},
        items: subOrder.items || [],
        status: subOrder.status,
        payableAmount: subOrder.payableAmount,
        shippingFee: subOrder.shippingFee,
        delivery: {
            status: subOrder.delivery?.status || subOrder.status,
            partnerUserId: subOrder.delivery?.riderId,
            payoutAmount: subOrder.delivery?.payoutAmount || 0,
            pickupOtp: subOrder.delivery?.pickupOtp,
            deliveryOtp: subOrder.delivery?.deliveryOtp,
            events: subOrder.delivery?.events || [],
            currentLocation: subOrder.delivery?.currentLocation,
            pickupPhoto: subOrder.delivery?.pickupPhoto,
            deliveryPhoto: subOrder.delivery?.deliveryPhoto,
            deliverySignature: subOrder.delivery?.deliverySignature,
        },
        createdAt: subOrder.createdAt,
        updatedAt: subOrder.updatedAt,
    };
};

export class DeliveryService {
    static async listAdminRiders(query: any = {}) {
        const filter: any = { status: "APPROVED", isVerified: true };
        if (query.available) filter.isOnline = true;

        const profiles = await DeliveryBoy.find(filter)
            .populate("userId", "fullName email phone roleId isBlocked isVerified")
            .sort({ isOnline: -1, updatedAt: -1 })
            .limit(200)
            .lean();

        const search = query.search?.toLowerCase();
        const orderLocation = finiteLocation({ latitude: query.latitude, longitude: query.longitude });

        const riders = profiles
            .filter((profile: any) => {
                const user = profile.userId;
                if (!user || user.isBlocked) return false;
                if (!search) return true;
                return [user.fullName, user.email, user.phone, profile.vehicleNumber, profile.licenseNumber]
                    .filter(Boolean)
                    .some((value) => String(value).toLowerCase().includes(search));
            })
            .map((profile: any) => {
                const currentLocation = coordinatesFromGeoJson(profile.currentLocation);
                const distanceKm = distanceKmBetween(orderLocation, currentLocation);
                return {
                    _id: profile._id?.toString(),
                    userId: profile.userId?._id?.toString(),
                    fullName: profile.userId?.fullName,
                    email: profile.userId?.email,
                    phone: profile.userId?.phone,
                    status: profile.status,
                    isVerified: !!profile.isVerified,
                    isOnline: !!profile.isOnline,
                    vehicleType: profile.vehicleType,
                    vehicleNumber: profile.vehicleNumber,
                    licenseNumber: profile.licenseNumber,
                    wallet: profile.wallet || { availableBalance: 0, pendingPayoutBalance: 0, lifetimeEarnings: 0 },
                    currentLocation,
                    ...(distanceKm !== null ? { distanceKm: Number(distanceKm.toFixed(2)) } : {}),
                };
            });

        if (orderLocation) {
            riders.sort((a: any, b: any) => {
                const aDistance = typeof a.distanceKm === "number" ? a.distanceKm : Number.POSITIVE_INFINITY;
                const bDistance = typeof b.distanceKm === "number" ? b.distanceKm : Number.POSITIVE_INFINITY;
                if (aDistance !== bDistance) return aDistance - bDistance;
                return Number(b.isOnline) - Number(a.isOnline);
            });
        }

        return riders;
    }

    static async getMyProfile(userId: string) {
        const profile = await DeliveryBoy.findOne({ userId }).populate("userId", "fullName email phone").lean();
        if (!profile) throw new ApiError(404, "Delivery profile not found");

        const activeStatuses = ["READY_FOR_PICKUP", "RIDER_ASSIGNED", "RIDER_ARRIVING", "RIDER_REACHED_STORE", "PICKED_UP", "IN_TRANSIT", "NEAR_CUSTOMER"];
        const activeOrders = await SubOrder.countDocuments({
            "delivery.riderId": new Types.ObjectId(userId),
            status: { $in: activeStatuses },
        });
        const completedOrders = await SubOrder.countDocuments({
            "delivery.riderId": new Types.ObjectId(userId),
            status: "DELIVERED",
        });

        return {
            profile: serializeDeliveryProfile(profile),
            stats: {
                activeOrders,
                completedOrders,
            },
        };
    }

    static async getDashboard(userId: string) {
        const profile = await DeliveryBoy.findOne({ userId }).populate("userId", "fullName email phone").lean();
        if (!profile) throw new ApiError(404, "Delivery profile not found");

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const activeStatuses = ["READY_FOR_PICKUP", "RIDER_ASSIGNED", "RIDER_ARRIVING", "RIDER_REACHED_STORE", "PICKED_UP", "IN_TRANSIT", "NEAR_CUSTOMER"];

        const [
            activeOrdersDb,
            recentOrdersDb,
            todayDeliveries,
            completedOrders,
            pendingPayouts,
            recentPayouts,
        ] = await Promise.all([
            SubOrder.find({
                "delivery.riderId": new Types.ObjectId(userId),
                status: { $in: activeStatuses },
            }).populate("parentOrderId storeId").sort({ updatedAt: -1 }).limit(8).lean(),
            SubOrder.find({ "delivery.riderId": new Types.ObjectId(userId) }).populate("parentOrderId storeId").sort({ updatedAt: -1 }).limit(8).lean(),
            SubOrder.countDocuments({
                "delivery.riderId": new Types.ObjectId(userId),
                status: "DELIVERED",
                updatedAt: { $gte: todayStart },
            }),
            SubOrder.countDocuments({
                "delivery.riderId": new Types.ObjectId(userId),
                status: "DELIVERED",
            }),
            AdminPayout.countDocuments({
                partnerId: new Types.ObjectId(userId),
                partnerType: "DELIVERY",
                status: { $in: ["PENDING", "PROCESSING"] },
            }),
            AdminPayout.find({ partnerId: new Types.ObjectId(userId), partnerType: "DELIVERY" })
                .sort({ createdAt: -1 })
                .limit(5)
                .lean(),
        ]);

        const activeOrders = activeOrdersDb.map(mapSubOrderToRiderFormat).filter(Boolean);
        const recentOrders = recentOrdersDb.map(mapSubOrderToRiderFormat).filter(Boolean);

        return {
            profile: serializeDeliveryProfile(profile),
            stats: {
                activeOrders: activeOrders.length,
                todayDeliveries,
                completedOrders,
                pendingPayouts,
                availableBalance: walletOf(profile).availableBalance || 0,
                pendingPayoutBalance: walletOf(profile).pendingPayoutBalance || 0,
                lifetimeEarnings: walletOf(profile).lifetimeEarnings || 0,
            },
            activeOrders,
            recentOrders,
            recentPayouts,
        };
    }

    static async listHistory(userId: string, query: any = {}) {
        const page = Math.max(Number(query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
        const filter: any = {
            "delivery.riderId": new Types.ObjectId(userId),
            status: { $in: ["DELIVERED", "COMPLETED", "CANCELLED", "REJECTED"] }
        };

        if (query.status) {
            filter.status = query.status;
        }

        const [dataDb, total] = await Promise.all([
            SubOrder.find(filter)
                .populate("parentOrderId storeId")
                .sort({ updatedAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            SubOrder.countDocuments(filter),
        ]);

        const data = dataDb.map(mapSubOrderToRiderFormat).filter(Boolean);

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.max(1, Math.ceil(total / limit)),
        };
    }

    static async getEarnings(userId: string, query: any = {}) {
        const filter: any = {
            "delivery.riderId": new Types.ObjectId(userId),
            status: "DELIVERED",
        };

        const [profile, subOrders] = await Promise.all([
            DeliveryBoy.findOne({ userId }).lean(),
            SubOrder.find(filter).populate("parentOrderId").sort({ updatedAt: -1 }).limit(200).lean(),
        ]);

        if (!profile) throw new ApiError(404, "Delivery profile not found");

        const ledger = subOrders.map((subOrder: any) => ({
            _id: subOrder._id?.toString(),
            orderId: subOrder.subOrderId,
            amount: Number(subOrder.delivery?.payoutAmount || 0),
            creditedAt: subOrder.updatedAt,
            deliveredAt: subOrder.updatedAt,
            customerName: subOrder.parentOrderId?.shippingAddress?.fullName || "Customer",
            status: subOrder.status,
        }));

        return {
            wallet: walletOf(profile),
            totalCredited: ledger.reduce((sum: number, item: any) => sum + item.amount, 0),
            ledger,
        };
    }

    static async listPayouts(userId: string) {
        const profile = await DeliveryBoy.findOne({ userId }).lean();
        if (!profile) throw new ApiError(404, "Delivery profile not found");

        const payouts = await AdminPayout.find({ partnerId: userId, partnerType: "DELIVERY" })
            .populate("processedBy", "fullName email")
            .sort({ createdAt: -1 })
            .limit(100)
            .lean();

        return {
            wallet: walletOf(profile),
            payoutMethods: (profile.payoutMethods || []).map(serializePayoutMethod),
            payouts,
        };
    }

    static async addPayoutMethod(userId: string, data: any) {
        const profile: any = await DeliveryBoy.findOne({ userId, status: "APPROVED", isVerified: true });
        if (!profile) throw new ApiError(403, "Approved delivery profile required");

        const hasDefault = (profile.payoutMethods || []).some((method: any) => method.isDefault);
        profile.payoutMethods.push({
            ...data,
            status: "PENDING_VERIFICATION",
            isDefault: !hasDefault,
            createdAt: new Date(),
        });
        await profile.save();

        const method = profile.payoutMethods[profile.payoutMethods.length - 1];
        return serializePayoutMethod(method);
    }

    static async setDefaultPayoutMethod(userId: string, methodId: string) {
        const profile: any = await DeliveryBoy.findOne({ userId });
        if (!profile) throw new ApiError(404, "Delivery profile not found");

        const method = profile.payoutMethods.id(methodId);
        if (!method) throw new ApiError(404, "Payout method not found");
        if (method.status !== "VERIFIED") {
            throw new ApiError(400, "Only verified payout methods can be set as default");
        }

        profile.payoutMethods.forEach((item: any) => {
            item.isDefault = item._id.toString() === methodId;
        });
        await profile.save();

        return profile.payoutMethods.map(serializePayoutMethod);
    }

    static async createPayoutRequest(userId: string, data: any) {
        const profile: any = await DeliveryBoy.findOne({ userId, status: "APPROVED", isVerified: true });
        if (!profile) throw new ApiError(403, "Approved delivery profile required");

        const method = profile.payoutMethods.id(data.payoutMethodId);
        if (!method || method.status !== "VERIFIED") {
            throw new ApiError(400, "A verified payout method is required before requesting payout");
        }

        const wallet = walletOf(profile);
        if ((wallet.availableBalance || 0) < data.amount) {
            throw new ApiError(400, "Insufficient available balance for this payout request");
        }

        wallet.availableBalance -= data.amount;
        wallet.pendingPayoutBalance = (wallet.pendingPayoutBalance || 0) + data.amount;
        profile.wallet = wallet;

        const payout = await AdminPayout.create({
            partnerId: new Types.ObjectId(userId),
            partnerType: "DELIVERY",
            amount: data.amount,
            status: "PENDING",
            method: payoutMethodLabel(method),
            payoutMethodId: method._id,
            note: data.note,
            requestedBy: new Types.ObjectId(userId),
        });

        await profile.save();
        return await payout.populate("partnerId", "fullName email");
    }

    static async updateProfile(userId: string, data: any) {
        const profile: any = await DeliveryBoy.findOne({ userId }).populate("userId", "fullName email phone");
        if (!profile) throw new ApiError(404, "Delivery profile not found");

        const setData: any = {};
        for (const key of ["vehicleType", "vehicleNumber", "licenseNumber", "address", "bankDetails"]) {
            if (data[key] !== undefined) setData[key] = data[key];
        }

        if (Object.keys(setData).length) {
            await DeliveryBoy.updateOne({ userId }, { $set: setData });
        }

        if (data.phone !== undefined) {
            await User.updateOne({ _id: userId }, { $set: { phone: data.phone } });
        }

        const updated = await DeliveryBoy.findOne({ userId }).populate("userId", "fullName email phone").lean();
        return serializeDeliveryProfile(updated);
    }

    static async updateAvailability(userId: string, data: any) {
        const setData: any = { isOnline: data.isOnline };
        if (data.location) {
            setData.currentLocation = {
                type: "Point",
                coordinates: [data.location.longitude, data.location.latitude],
            };
        }

        const profile = await DeliveryBoy.findOneAndUpdate(
            { userId, status: "APPROVED", isVerified: true },
            { $set: setData },
            { returnDocument: "after" },
        ).populate("userId", "fullName email phone");

        if (!profile) throw new ApiError(403, "Approved delivery profile required");
        if (data.isOnline && data.location) {
            MatchingService.processMatchingPool().catch((error) => {
                console.error("[DeliveryService] Failed to refresh rider matching pool:", error);
            });
        }
        return profile;
    }

    static async listMyOrders(userId: string, query: any = {}) {
        const page = Math.max(Number(query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
        const filter: any = { "delivery.riderId": new Types.ObjectId(userId) };
        
        const activeStatuses = ["READY_FOR_PICKUP", "RIDER_ASSIGNED", "RIDER_ARRIVING", "RIDER_REACHED_STORE", "PICKED_UP", "IN_TRANSIT", "NEAR_CUSTOMER"];
        if (query.status) {
            filter.status = query.status;
        } else {
            filter.status = { $in: activeStatuses };
        }

        const [dataDb, total] = await Promise.all([
            SubOrder.find(filter)
                .populate("parentOrderId storeId")
                .sort({ updatedAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            SubOrder.countDocuments(filter),
        ]);

        const data = dataDb.map(mapSubOrderToRiderFormat).filter(Boolean);

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.max(1, Math.ceil(total / limit)),
        };
    }

    static async listOffers(userId: string) {
        const profile = await DeliveryBoy.findOne({
            userId: new Types.ObjectId(idString(userId)),
            status: "APPROVED",
            isVerified: true,
            isOnline: true,
            "currentLocation.coordinates.0": { $exists: true },
            "currentLocation.coordinates.1": { $exists: true },
        }).select("_id").lean();

        if (profile) {
            await MatchingService.processMatchingPool().catch((error) => {
                console.error("[DeliveryService] Failed to refresh rider offers:", error);
            });
        }

        const riderObjectId = new Types.ObjectId(idString(userId));

        await RiderOffer.updateMany(
            { riderId: riderObjectId, status: "OPEN", expiresAt: { $lte: new Date() } },
            { $set: { status: "EXPIRED", respondedAt: new Date() } },
        );

        const capacity = await riderCapacitySnapshot(userId);
        if (!capacity.canAccept) {
            await RiderOffer.updateMany(
                { riderId: riderObjectId, status: "OPEN" },
                {
                    $set: {
                        status: "CANCELLED",
                        respondedAt: new Date(),
                        metadata: {
                            reason: "rider_acceptance_capacity_reached",
                            acceptedCountInWindow: capacity.acceptedCount,
                            maxAcceptedOrders: capacity.maxAcceptedOrders,
                            acceptanceWindowHours: capacity.windowHours,
                        },
                    },
                },
            );
            return [];
        }

        const blockedSubOrders = await RiderOffer.aggregate([
            {
                $match: {
                    riderId: riderObjectId,
                    status: "REJECTED",
                },
            },
            {
                $group: {
                    _id: "$subOrderObjectId",
                    rejectionCount: { $sum: 1 },
                },
            },
            {
                $match: {
                    rejectionCount: { $gte: MAX_RIDER_REJECTIONS_PER_SUB_ORDER },
                },
            },
        ]);

        if (blockedSubOrders.length) {
            await RiderOffer.updateMany(
                {
                    riderId: riderObjectId,
                    subOrderObjectId: { $in: blockedSubOrders.map((item) => item._id) },
                    status: "OPEN",
                },
                {
                    $set: {
                        status: "CANCELLED",
                        respondedAt: new Date(),
                        metadata: {
                            reason: "max_rejections_reached",
                            maxRejections: MAX_RIDER_REJECTIONS_PER_SUB_ORDER,
                            suppressedForSubOrder: true,
                        },
                    },
                },
            );
        }

        const offers = await RiderOffer.find({
            riderId: riderObjectId,
            status: "OPEN",
            expiresAt: { $gt: new Date() },
        })
            .populate({
                path: "subOrderObjectId",
                populate: [
                    { path: "storeId" },
                    { path: "parentOrderId", select: "orderId shippingAddress payableAmount" },
                ],
            })
            .sort({ expiresAt: 1 })
            .limit(50)
            .lean();

        return offers.map(serializeOffer);
    }

    static async acceptOffer(userId: string, offerId: string, requestInfo?: any) {
        return await SubOrderService.riderAcceptOffer(idString(userId), offerId, requestInfo);
    }

    static async rejectOffer(userId: string, offerId: string, reason?: string, requestInfo?: any) {
        return await SubOrderService.riderRejectOffer(idString(userId), offerId, reason, requestInfo);
    }

    static async getMyOrder(userId: string, id: string) {
        const subOrder = await SubOrder.findOne({
            $or: [
                ...(Types.ObjectId.isValid(id) ? [{ _id: new Types.ObjectId(id) }] : []),
                { subOrderId: id }
            ],
            "delivery.riderId": new Types.ObjectId(userId)
        }).populate("parentOrderId storeId").lean();

        if (!subOrder) throw new ApiError(404, "Sub-order not found for this delivery partner");
        return mapSubOrderToRiderFormat(subOrder);
    }

    static async updateOrderStatus(userId: string, id: string, data: any) {
        const riderUserId = idString(userId);
        const order = await this.findOrderForDeliveryUser(userId, id);
        const currentStatus = normalizeStatus(order);
        const targetStatus = data.action as DeliveryStatus;

        if (transitionMap[currentStatus] !== targetStatus) {
            throw new ApiError(400, `Cannot move delivery from ${currentStatus} to ${targetStatus}`);
        }

        const location = locationPayload(data.location);

        if (targetStatus === DeliveryStatus.DELIVERED) {
            const expectedOtp = order.delivery?.otp?.code;
            if (!expectedOtp || expectedOtp !== data.otp) {
                throw new ApiError(400, "Valid delivery OTP is required");
            }

            await orderService.adminUpdateOrderStatus(
                order._id.toString(),
                OrderStatus.DELIVERED,
                undefined,
                { allowUnverifiedDeliveryOtp: true },
            );
        }

        const setData: any = {
            "delivery.status": targetStatus,
            [timestampFieldByStatus[targetStatus] || "delivery.updatedAt"]: new Date(),
        };

        if (targetStatus === DeliveryStatus.DELIVERED) {
            setData["delivery.otp.verifiedAt"] = new Date();
        }

        if (location) {
            setData["delivery.currentLocation"] = location;
            await DeliveryBoy.updateOne(
                { userId: riderUserId },
                { $set: { currentLocation: { type: "Point", coordinates: [location.longitude, location.latitude] } } },
            );
        }

        const event = {
            status: targetStatus,
            action: targetStatus,
            note: data.note,
            actorId: toObjectId(userId),
            at: new Date(),
            location,
        };

        const updated = await populateOrder(Order.findByIdAndUpdate(
            order._id,
            {
                $set: {
                    ...setData,
                    ...(targetStatus === DeliveryStatus.PICKED_UP || targetStatus === DeliveryStatus.OUT_FOR_DELIVERY
                        ? { status: OrderStatus.SHIPPED }
                        : {}),
                },
                $push: { "delivery.events": event },
            },
            { returnDocument: "after" },
        ));

        if (!updated) throw new ApiError(404, "Order not found");

        if (targetStatus === DeliveryStatus.DELIVERED) {
            await this.creditDeliveryEarnings(updated);
        }

        this.emitDeliveryUpdate(updated, targetStatus, data.note);
        return updated;
    }

    static async updateOrderLocation(userId: string, id: string, locationData: any) {
        const riderUserId = idString(userId);
        const order = await this.findOrderForDeliveryUser(userId, id);
        if (!ACTIVE_DELIVERY_STATUSES.includes(normalizeStatus(order))) {
            throw new ApiError(400, "Location can only be updated for active delivery orders");
        }

        const location = locationPayload(locationData);
        await DeliveryBoy.updateOne(
            { userId: riderUserId },
            { $set: { currentLocation: { type: "Point", coordinates: [location!.longitude, location!.latitude] } } },
        );

        const updated = await populateOrder(Order.findByIdAndUpdate(
            order._id,
            { $set: { "delivery.currentLocation": location } },
            { returnDocument: "after" },
        ));

        if (!updated) throw new ApiError(404, "Order not found");
        socketService.emitToOrderRoom(updated.orderId, SocketEvents.DELIVERY_LOCATION_UPDATED, {
            orderId: updated.orderId,
            latitude: location!.latitude,
            longitude: location!.longitude,
            heading: location!.heading || 0,
            timestamp: new Date().toISOString(),
        });
        return updated;
    }

    static async assertAssignedDeliveryUser(userId: string, orderId: string) {
        await this.findOrderForDeliveryUser(userId, orderId);
        return true;
    }

    private static async findOrderForDeliveryUser(userId: string, id: string) {
        const riderUserId = idString(userId);
        let order: any = null;
        if (Types.ObjectId.isValid(id)) {
            order = await populateOrder(Order.findById(id));
        }
        if (!order) {
            order = await populateOrder(Order.findOne({ orderId: id }));
        }
        if (!order) throw new ApiError(404, "Order not found");
        const assignedUserId = idString(order.delivery?.partnerUserId);
        if (assignedUserId === riderUserId) {
            return order;
        }

        const possibleProfileIds = [idString(order.delivery?.partnerProfileId), assignedUserId].filter(Boolean);
        if (possibleProfileIds.length) {
            const riderProfile = await DeliveryBoy.findOne({
                userId: riderUserId,
                _id: { $in: possibleProfileIds },
            }).lean();

            if (riderProfile) {
                await Order.updateOne(
                    { _id: order._id },
                    {
                        $set: {
                            "delivery.partnerUserId": toObjectId(riderUserId),
                            "delivery.partnerProfileId": riderProfile._id,
                        },
                    },
                );
                order.delivery.partnerUserId = riderUserId;
                order.delivery.partnerProfileId = riderProfile._id;
                return order;
            }
        }

        throw new ApiError(403, "This order is not assigned to you");
    }

    private static async creditDeliveryEarnings(order: any) {
        if (order.delivery?.payoutCreditedAt || !order.delivery?.partnerUserId) return;

        const config = await appConfigService.getConfig();
        const configPayout = config?.delivery?.riderPayoutAmount;
        const payoutAmount = Number(order.delivery?.payoutAmount || configPayout || order.shippingFee || 0);
        if (payoutAmount <= 0) return;

        await DeliveryBoy.updateOne(
            { userId: idString(order.delivery.partnerUserId) },
            {
                $inc: {
                    "wallet.availableBalance": payoutAmount,
                    "wallet.lifetimeEarnings": payoutAmount,
                },
            },
        );

        await Order.updateOne(
            { _id: order._id, "delivery.payoutCreditedAt": { $exists: false } },
            {
                $set: {
                    "delivery.payoutAmount": payoutAmount,
                    "delivery.payoutCreditedAt": new Date(),
                },
            },
        );
    }

    private static emitDeliveryUpdate(order: any, status: DeliveryStatus, note?: string) {
        socketService.emitToUser(order.userId?._id?.toString() || order.userId?.toString(), SocketEvents.ORDER_STATUS_UPDATE, {
            orderId: order.orderId,
            status: order.status,
            deliveryStatus: status,
            message: note || `Delivery status updated to ${status}`,
        });

        socketService.emitToUser(order.delivery?.partnerUserId?._id?.toString() || order.delivery?.partnerUserId?.toString(), SocketEvents.ORDER_STATUS_UPDATE, {
            orderId: order.orderId,
            status: order.status,
            deliveryStatus: status,
        });

        socketService.emitToOrderRoom(order.orderId, SocketEvents.ORDER_STATUS_UPDATE, {
            orderId: order.orderId,
            status: order.status,
            deliveryStatus: status,
        });
    }
}

export const deliveryService = DeliveryService;
