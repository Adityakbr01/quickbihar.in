import { Types } from "mongoose";
import { ENV } from "../../config/env.config";
import { SubOrder } from "../order/subOrder.model";

const idString = (value: any): string => {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value.toHexString === "function") return value.toHexString();
    if (value._id) return idString(value._id);
    return value.toString?.() || String(value);
};

export const riderCapacityConfig = () => {
    const maxAcceptedOrders = Math.max(1, ENV.RIDER_MAX_ACCEPTED_ORDERS_PER_WINDOW);
    const windowHours = Math.max(1, ENV.RIDER_ACCEPTANCE_WINDOW_HOURS);
    const windowStart = new Date(Date.now() - windowHours * 60 * 60 * 1000);

    return { maxAcceptedOrders, windowHours, windowStart };
};

const acceptedWithinWindowMatch = (windowStart: Date) => ({
    "delivery.riderId": { $exists: true, $ne: null },
    $or: [
        { "delivery.assignedAt": { $gte: windowStart } },
        {
            "delivery.assignedAt": { $exists: false },
            updatedAt: { $gte: windowStart },
        },
    ],
});

export async function riderCapacitySnapshot(riderUserId: any) {
    const riderId = idString(riderUserId);
    if (!Types.ObjectId.isValid(riderId)) {
        return {
            acceptedCount: 0,
            remaining: 0,
            canAccept: false,
            ...riderCapacityConfig(),
        };
    }

    const config = riderCapacityConfig();
    const acceptedCount = await SubOrder.countDocuments({
        ...acceptedWithinWindowMatch(config.windowStart),
        "delivery.riderId": new Types.ObjectId(riderId),
    });

    return {
        ...config,
        acceptedCount,
        remaining: Math.max(0, config.maxAcceptedOrders - acceptedCount),
        canAccept: acceptedCount < config.maxAcceptedOrders,
    };
}

export async function riderCapacityCountsByRider() {
    const config = riderCapacityConfig();
    const rows = await SubOrder.aggregate([
        { $match: acceptedWithinWindowMatch(config.windowStart) },
        {
            $group: {
                _id: "$delivery.riderId",
                acceptedCount: { $sum: 1 },
            },
        },
    ]);

    const countByRiderId = new Map<string, number>();
    const atCapacityIds: Types.ObjectId[] = [];

    for (const row of rows) {
        const riderId = idString(row._id);
        const acceptedCount = Number(row.acceptedCount || 0);
        countByRiderId.set(riderId, acceptedCount);
        if (acceptedCount >= config.maxAcceptedOrders) {
            atCapacityIds.push(row._id);
        }
    }

    return {
        ...config,
        countByRiderId,
        atCapacityIds,
    };
}
