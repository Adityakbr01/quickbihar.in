import { Types } from "mongoose";
import { SocketEvents } from "../../constants/socketEvents";
import { ApiError } from "../../utils/ApiError";
import { AdminPayout } from "../admin/admin.model";
import { appConfigService } from "../appConfig/appConfig.service";
import { DeliveryBoy } from "../deliveryBoy/delivery.model";
import { Order } from "../order/order.model";
import { DeliveryStatus, OrderStatus } from "../order/order.type";
import { orderService } from "../order/order.service";
import { socketService } from "../socket/socket.service";
import { User } from "../user/user.model";

const ACTIVE_DELIVERY_STATUSES = [
    DeliveryStatus.ASSIGNED,
    DeliveryStatus.ACCEPTED,
    DeliveryStatus.PICKED_UP,
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

    return { $or: fields.map((field) => ({ [field]: range })) };
};

const walletOf = (profile: any) => profile?.wallet || {
    availableBalance: 0,
    pendingPayoutBalance: 0,
    lifetimeEarnings: 0,
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

        const activeOrders = await Order.countDocuments({
            "delivery.partnerUserId": userId,
            "delivery.status": { $in: ACTIVE_DELIVERY_STATUSES },
        });
        const completedOrders = await Order.countDocuments({
            "delivery.partnerUserId": userId,
            "delivery.status": DeliveryStatus.DELIVERED,
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

        const [
            activeOrders,
            recentOrders,
            todayDeliveries,
            completedOrders,
            pendingPayouts,
            recentPayouts,
        ] = await Promise.all([
            populateOrder(Order.find({
                "delivery.partnerUserId": userId,
                "delivery.status": { $in: ACTIVE_DELIVERY_STATUSES },
            }).sort({ updatedAt: -1 }).limit(8)),
            populateOrder(Order.find({ "delivery.partnerUserId": userId }).sort({ updatedAt: -1 }).limit(8)),
            Order.countDocuments({
                "delivery.partnerUserId": userId,
                "delivery.status": DeliveryStatus.DELIVERED,
                "delivery.deliveredAt": { $gte: todayStart },
            }),
            Order.countDocuments({
                "delivery.partnerUserId": userId,
                "delivery.status": DeliveryStatus.DELIVERED,
            }),
            AdminPayout.countDocuments({
                partnerId: userId,
                partnerType: "DELIVERY",
                status: { $in: ["PENDING", "PROCESSING"] },
            }),
            AdminPayout.find({ partnerId: userId, partnerType: "DELIVERY" })
                .sort({ createdAt: -1 })
                .limit(5)
                .lean(),
        ]);

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
            "delivery.partnerUserId": userId,
            ...deliveryHistoryDateFilter(query),
        };

        if (query.status) filter["delivery.status"] = query.status;

        const [data, total] = await Promise.all([
            populateOrder(Order.find(filter))
                .sort({ updatedAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            Order.countDocuments(filter),
        ]);

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
            "delivery.partnerUserId": userId,
            "delivery.status": DeliveryStatus.DELIVERED,
            "delivery.payoutCreditedAt": { $exists: true },
            ...dateRangeFilter("delivery.payoutCreditedAt", query),
        };

        const [profile, orders] = await Promise.all([
            DeliveryBoy.findOne({ userId }).lean(),
            populateOrder(Order.find(filter).sort({ "delivery.payoutCreditedAt": -1 }).limit(200)),
        ]);

        if (!profile) throw new ApiError(404, "Delivery profile not found");

        const ledger = orders.map((order: any) => ({
            _id: order._id?.toString(),
            orderId: order.orderId,
            amount: Number(order.delivery?.payoutAmount || 0),
            creditedAt: order.delivery?.payoutCreditedAt,
            deliveredAt: order.delivery?.deliveredAt,
            customerName: order.shippingAddress?.fullName,
            status: order.delivery?.status,
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
        return profile;
    }

    static async listMyOrders(userId: string, query: any = {}) {
        const page = Math.max(Number(query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
        const filter: any = { "delivery.partnerUserId": userId };
        if (query.status) filter["delivery.status"] = query.status;

        const [data, total] = await Promise.all([
            populateOrder(Order.find(filter))
                .sort({ updatedAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            Order.countDocuments(filter),
        ]);

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.max(1, Math.ceil(total / limit)),
        };
    }

    static async getMyOrder(userId: string, id: string) {
        const order = await this.findOrderForDeliveryUser(userId, id);
        return order;
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
