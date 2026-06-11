import { Types } from "mongoose";
import { ApiError } from "../../utils/ApiError";
import { Order } from "../order/order.model";
import { SubOrder, SubOrderStatus } from "../order/subOrder.model";
import { Seller } from "./seller.model";
import { SellerEarning } from "./sellerPanel.model";

export type SellerSettlementSource = "RIDER_DELIVERY" | "ADMIN_DELIVERY" | "BACKFILL" | "LEGACY_ORDER";

type SettlementOptions = {
    source?: SellerSettlementSource;
    note?: string;
    allowNonDelivered?: boolean;
};

type MissingSettlementOptions = {
    limit?: number;
};

const deliveredSubOrderStatuses = [
    SubOrderStatus.DELIVERED,
    SubOrderStatus.DELIVERY_CONFIRMED,
    SubOrderStatus.COMPLETED,
];

const roundMoney = (value: number) => Math.round(Number(value || 0) * 100) / 100;

const idString = (value: any): string => {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value.toHexString === "function") return value.toHexString();
    if (value._id) return idString(value._id);
    return value.toString?.() || String(value);
};

const objectIdOf = (value: any, fieldName: string) => {
    const id = idString(value);
    if (!Types.ObjectId.isValid(id)) {
        throw new ApiError(400, `${fieldName} is missing or invalid for seller settlement`);
    }
    return new Types.ObjectId(id);
};

const quantityOf = (subOrder: any) =>
    (subOrder.items || []).reduce((sum: number, item: any) => sum + Number(item.quantity || 0), 0) || 1;

const grossOf = (subOrder: any) => {
    const subtotal = Number(subOrder.subtotal);
    if (Number.isFinite(subtotal) && subtotal >= 0) return roundMoney(subtotal);

    return roundMoney((subOrder.items || []).reduce(
        (sum: number, item: any) => sum + Number(item.sellerSubtotal ?? ((item.price || 0) * (item.quantity || 0))),
        0,
    ));
};

const parentOrderOf = async (subOrder: any) => {
    const parentOrder = subOrder.parentOrderId;
    if (
        parentOrder
        && typeof parentOrder === "object"
        && typeof parentOrder.toHexString !== "function"
        && (parentOrder.orderId || parentOrder._id)
    ) {
        return parentOrder;
    }

    const parentOrderId = idString(parentOrder);
    if (!parentOrderId) return null;
    return await Order.findById(parentOrderId).select("orderId").lean();
};

const duplicateKeyError = (error: any) => Number(error?.code) === 11000;

export class SellerSettlementService {
    readonly deliveredStatuses = deliveredSubOrderStatuses;

    isDeliveredStatus(status: string) {
        return deliveredSubOrderStatuses.includes(status as SubOrderStatus);
    }

    idempotencyKeyForSubOrder(subOrder: any) {
        return `seller-suborder:${idString(subOrder._id)}`;
    }

    calculateSubOrderAmounts(subOrder: any) {
        const grossAmount = grossOf(subOrder);
        const commissionAmount = roundMoney(Number(subOrder.platformCommission || 0));
        const snapshotNet = Number(subOrder.sellerNet);
        const fallbackNet = roundMoney(Math.max(0, grossAmount - commissionAmount));
        const netAmount = roundMoney(
            Number.isFinite(snapshotNet) && snapshotNet > 0
                ? Math.max(0, snapshotNet)
                : fallbackNet,
        );

        return { grossAmount, commissionAmount, netAmount };
    }

    async settleSubOrder(subOrder: any, options: SettlementOptions = {}) {
        const status = String(subOrder.status || "");
        if (!this.isDeliveredStatus(status) && !options.allowNonDelivered) {
            return {
                settled: false,
                alreadySettled: false,
                reason: "SUB_ORDER_NOT_DELIVERED",
                amount: 0,
            };
        }

        const parentOrder = await parentOrderOf(subOrder);
        const parentOrderObjectId = objectIdOf(parentOrder?._id || subOrder.parentOrderId, "Parent order id");
        const sellerObjectId = objectIdOf(subOrder.sellerId, "Seller id");
        const subOrderObjectId = objectIdOf(subOrder._id, "Sub-order id");
        const idempotencyKey = this.idempotencyKeyForSubOrder(subOrder);
        const existing = await SellerEarning.findOne({ idempotencyKey }).lean();

        if (existing) {
            return {
                settled: false,
                alreadySettled: true,
                reason: "ALREADY_SETTLED",
                amount: Number(existing.netAmount || 0),
                earning: existing,
            };
        }

        const { grossAmount, commissionAmount, netAmount } = this.calculateSubOrderAmounts(subOrder);
        const now = new Date();

        try {
            const earning = await SellerEarning.create({
                sellerId: sellerObjectId,
                storeId: subOrder.storeId ? objectIdOf(subOrder.storeId, "Store id") : undefined,
                orderId: parentOrder?.orderId || idString(parentOrderObjectId),
                orderObjectId: parentOrderObjectId,
                subOrderId: subOrder.subOrderId,
                subOrderObjectId,
                idempotencyKey,
                quantity: quantityOf(subOrder),
                grossAmount,
                commissionAmount,
                netAmount,
                status: "AVAILABLE",
                creditedAt: now,
                settlementSource: options.source || "RIDER_DELIVERY",
                settlementNote: options.note,
                metadata: {
                    subOrderStatus: status,
                    payableAmount: Number(subOrder.payableAmount || 0),
                    deliveryStatus: subOrder.delivery?.status,
                },
            });

            await Seller.updateOne(
                { userId: sellerObjectId },
                {
                    $inc: {
                        "wallet.availableBalance": netAmount,
                        "wallet.lifetimeEarnings": netAmount,
                    },
                },
            );

            return {
                settled: true,
                alreadySettled: false,
                amount: netAmount,
                earning,
            };
        } catch (error) {
            if (!duplicateKeyError(error)) throw error;

            const duplicate = await SellerEarning.findOne({ idempotencyKey }).lean();
            return {
                settled: false,
                alreadySettled: true,
                reason: "ALREADY_SETTLED",
                amount: Number(duplicate?.netAmount || 0),
                earning: duplicate,
            };
        }
    }

    async settleDeliveredSubOrdersForOrder(parentOrderId: string | Types.ObjectId, options: SettlementOptions = {}) {
        const subOrders = await SubOrder.find({
            parentOrderId: objectIdOf(parentOrderId, "Parent order id"),
            status: { $in: deliveredSubOrderStatuses },
        }).populate("parentOrderId");

        const results = [];
        for (const subOrder of subOrders) {
            results.push(await this.settleSubOrder(subOrder, options));
        }

        return {
            found: subOrders.length,
            settled: results.filter((result) => result.settled).length,
            alreadySettled: results.filter((result) => result.alreadySettled).length,
            amount: roundMoney(results.reduce((sum, result) => sum + Number(result.settled ? result.amount : 0), 0)),
            results,
        };
    }

    async missingDeliveredSubOrderSettlements(options: MissingSettlementOptions = {}) {
        const limit = Math.min(Math.max(Number(options.limit || 500), 1), 5000);
        const subOrders = await SubOrder.find({
            status: { $in: deliveredSubOrderStatuses },
        })
            .populate("parentOrderId")
            .sort({ updatedAt: 1 })
            .limit(limit)
            .lean();

        const subOrderIds = subOrders
            .map((subOrder: any) => idString(subOrder._id))
            .filter((id) => Types.ObjectId.isValid(id))
            .map((id) => new Types.ObjectId(id));

        const existing = await SellerEarning.find({ subOrderObjectId: { $in: subOrderIds } })
            .select("subOrderObjectId")
            .lean();
        const settledIds = new Set(existing.map((earning: any) => idString(earning.subOrderObjectId)));
        const missing = subOrders.filter((subOrder: any) => !settledIds.has(idString(subOrder._id)));

        const rows = missing.map((subOrder: any) => {
            const amounts = this.calculateSubOrderAmounts(subOrder);
            const parentOrder = subOrder.parentOrderId;
            return {
                subOrderId: subOrder.subOrderId,
                subOrderObjectId: idString(subOrder._id),
                orderId: parentOrder?.orderId || idString(subOrder.parentOrderId),
                orderObjectId: idString(parentOrder?._id || subOrder.parentOrderId),
                sellerId: idString(subOrder.sellerId),
                storeId: idString(subOrder.storeId),
                status: subOrder.status,
                ...amounts,
            };
        });

        return {
            scanned: subOrders.length,
            missing: rows.length,
            totalNetAmount: roundMoney(rows.reduce((sum, row) => sum + row.netAmount, 0)),
            rows,
        };
    }

    async underpaidDeliveredSubOrderSettlements(options: MissingSettlementOptions = {}) {
        const limit = Math.min(Math.max(Number(options.limit || 500), 1), 5000);
        const subOrders = await SubOrder.find({
            status: { $in: deliveredSubOrderStatuses },
        })
            .populate("parentOrderId")
            .sort({ updatedAt: 1 })
            .limit(limit)
            .lean();

        const subOrderIds = subOrders
            .map((subOrder: any) => idString(subOrder._id))
            .filter((id) => Types.ObjectId.isValid(id))
            .map((id) => new Types.ObjectId(id));

        const earnings = await SellerEarning.find({ subOrderObjectId: { $in: subOrderIds } }).lean();
        const earningBySubOrderId = new Map(
            earnings.map((earning: any) => [idString(earning.subOrderObjectId), earning]),
        );

        const rows = subOrders.flatMap((subOrder: any) => {
            const earning = earningBySubOrderId.get(idString(subOrder._id));
            if (!earning) return [];

            const amounts = this.calculateSubOrderAmounts(subOrder);
            const creditedAmount = roundMoney(Number(earning.netAmount || 0));
            const delta = roundMoney(amounts.netAmount - creditedAmount);
            if (delta <= 0) return [];

            const parentOrder = subOrder.parentOrderId;
            return [{
                earningId: idString(earning._id),
                subOrderId: subOrder.subOrderId,
                subOrderObjectId: idString(subOrder._id),
                orderId: parentOrder?.orderId || idString(subOrder.parentOrderId),
                orderObjectId: idString(parentOrder?._id || subOrder.parentOrderId),
                sellerId: idString(subOrder.sellerId),
                storeId: idString(subOrder.storeId),
                status: subOrder.status,
                creditedAmount,
                expectedNetAmount: amounts.netAmount,
                delta,
                grossAmount: amounts.grossAmount,
                commissionAmount: amounts.commissionAmount,
            }];
        });

        return {
            scanned: subOrders.length,
            underpaid: rows.length,
            totalDelta: roundMoney(rows.reduce((sum, row) => sum + row.delta, 0)),
            rows,
        };
    }

    async repairUnderpaidSubOrderSettlement(subOrder: any, earningId: string, options: SettlementOptions = {}) {
        const earning = await SellerEarning.findById(earningId).lean();
        if (!earning) {
            return {
                repaired: false,
                reason: "EARNING_NOT_FOUND",
                delta: 0,
            };
        }

        const { grossAmount, commissionAmount, netAmount } = this.calculateSubOrderAmounts(subOrder);
        const currentNetAmount = roundMoney(Number(earning.netAmount || 0));
        const delta = roundMoney(netAmount - currentNetAmount);
        if (delta <= 0) {
            return {
                repaired: false,
                reason: "NOT_UNDERPAID",
                delta: 0,
                amount: currentNetAmount,
            };
        }

        const updated = await SellerEarning.updateOne(
            { _id: objectIdOf(earningId, "Seller earning id"), netAmount: currentNetAmount },
            {
                $set: {
                    grossAmount,
                    commissionAmount,
                    netAmount,
                    status: "AVAILABLE",
                    settlementSource: options.source || earning.settlementSource || "BACKFILL",
                    settlementNote: options.note || earning.settlementNote,
                    creditedAt: earning.creditedAt || new Date(),
                    "metadata.repairedAt": new Date(),
                    "metadata.repairReason": "UNDERPAID_SELLER_NET",
                    "metadata.previousNetAmount": currentNetAmount,
                },
            },
        );

        if (!updated.modifiedCount) {
            return {
                repaired: false,
                reason: "EARNING_CHANGED",
                delta: 0,
            };
        }

        await Seller.updateOne(
            { userId: objectIdOf(subOrder.sellerId, "Seller id") },
            {
                $inc: {
                    "wallet.availableBalance": delta,
                    "wallet.lifetimeEarnings": delta,
                },
            },
        );

        return {
            repaired: true,
            delta,
            amount: netAmount,
        };
    }
}

export const sellerSettlementService = new SellerSettlementService();
