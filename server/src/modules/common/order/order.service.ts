import { Types } from "mongoose";
import { ApiError } from "@/utils/ApiError";
import * as ProductDAO from "@/modules/clothing/products/product.dao";
import * as couponService from "@/modules/common/coupon/coupon.service";
import * as appConfigService from "@/modules/common/appConfig/appConfig.service";
import { orderDAO } from "./order.dao";
import { DeliveryStatus, OrderStatus } from "./order.type";
import { Order } from "./order.model";
import { razorpay, verifyRazorpaySignature } from "@/utils/razorpay.util";
import { socketService } from "@/modules/common/socket/socket.service";
import * as notificationService from "@/modules/common/notification/notification.service";
import { User } from "@/modules/common/user/user.model";
import { SocketEvents } from "@/constants/socketEvents";
import { Seller } from "@/modules/common/seller/seller.model";
import { SellerEarning, SellerNotification } from "@/modules/common/seller/sellerPanel.model";
import { DeliveryBoy } from "@/modules/common/deliveryBoy/delivery.model";
import { SubOrder, SubOrderStatus } from "./subOrder.model";
import { TimelineHelper } from "./timeline.helper";
import { orderPricingService } from "./orderPricing.service";
import { sellerSettlementService } from "@/modules/common/seller/sellerSettlement.service";
import { assertCartServiceable, assertCartStoresOpen } from "@/modules/common/store/serviceability.service";
import { idString, toObjectId } from "@/utils/id.util";

const generateDeliveryOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

/**
 * Customer-facing status aliasing.
 *
 * Internally, after payment a sub-order is in `PENDING_SELLER_CONFIRMATION` until
 * the seller phones the customer and confirms. This is an operational state
 * that only the seller panel cares about — the customer just paid, so from
 * their side the order reads as `CONFIRMED` (or "ready for dispatch").
 *
 * Call `mapCustomerOrderStatus` / `mapCustomerSubOrderStatus` at the boundary
 * of any customer-facing read path so the UI never shows
 * `PENDING_SELLER_CONFIRMATION`. Seller/admin endpoints MUST NOT call these.
 */
const mapCustomerOrderStatus = (status: OrderStatus): OrderStatus =>
    status === OrderStatus.PENDING_SELLER_CONFIRMATION ? OrderStatus.CONFIRMED : status;

const mapCustomerSubOrderStatus = (status: SubOrderStatus): SubOrderStatus =>
    status === SubOrderStatus.PENDING_SELLER_CONFIRMATION
        ? SubOrderStatus.CONFIRMED
        : status;

const maskOrderForCustomer = (order: any) => {
    if (!order) return order;
    if (order.status === OrderStatus.PENDING_SELLER_CONFIRMATION) {
        order.status = OrderStatus.CONFIRMED;
    }
    if (Array.isArray(order.subOrders)) {
        for (const so of order.subOrders) {
            if (so && so.status === SubOrderStatus.PENDING_SELLER_CONFIRMATION) {
                so.status = SubOrderStatus.CONFIRMED;
            }
        }
    }
    return order;
};

const maskSubOrderForCustomer = (subOrder: any) => {
    if (!subOrder) return subOrder;
    if (subOrder.status === SubOrderStatus.PENDING_SELLER_CONFIRMATION) {
        subOrder.status = SubOrderStatus.CONFIRMED;
    }
    return subOrder;
};

// Sentinel stored in `paymentInfo.razorpayOrderId` for Cash-on-Delivery orders, which
// have no real Razorpay order. Sub-order creation reads this to flag `packageDetails.isCod`,
// which drives the whole COD subsystem (rider cash-liability ceiling + admin settle-COD).
const COD_SENTINEL = "COD";

const deliveryEvent = (status: DeliveryStatus, action: string, actorId?: string, note?: string) => ({
    status,
    action,
    note,
    actorId: actorId ? new Types.ObjectId(actorId) : undefined,
    at: new Date(),
});

const populateOrderQuery = (query: any) =>
    query
        .populate("userId", "fullName email phone")
        .populate("delivery.partnerUserId", "fullName email phone");

const fulfillmentSummaryOf = (subOrders: any[]) => {
    const statusCounts = subOrders.reduce((acc: Record<string, number>, subOrder: any) => {
        const status = subOrder.status || "UNKNOWN";
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {});

    const terminalStatuses = ["DELIVERED", "DELIVERY_CONFIRMED", "COMPLETED", "CANCELLED", "REJECTED", "REFUNDED", "RETURNED"];
    const activeSubOrders = subOrders.filter((subOrder) => !terminalStatuses.includes(subOrder.status));
    const deliveredCount = subOrders.filter((subOrder) => ["DELIVERED", "DELIVERY_CONFIRMED", "COMPLETED"].includes(subOrder.status)).length;
    const failedCount = subOrders.filter((subOrder) => ["PICKUP_FAILED", "DELIVERY_FAILED", "CUSTOMER_UNREACHABLE", "DISPUTED"].includes(subOrder.status)).length;

    return {
        totalSubOrders: subOrders.length,
        activeSubOrders: activeSubOrders.length,
        deliveredSubOrders: deliveredCount,
        failedSubOrders: failedCount,
        isMultiSeller: subOrders.length > 1,
        statusCounts,
    };
};

export class OrderService {
    private async notifyOrderSellers(order: any, status: OrderStatus, message: string) {
        const sellerIds = Array.from(new Set((order.items || [])
            .map((item: any) => idString(item.sellerId))
            .filter(Boolean)));

        if (!sellerIds.length) return;

        await SellerNotification.insertMany(
            sellerIds.map((sellerId) => ({
                sellerId: new Types.ObjectId(sellerId as string),
                type: "ORDER",
                title: `Order ${order.orderId} ${status}`,
                message,
                severity: ["CANCELLED", "REJECTED", "REFUNDED"].includes(status) ? "WARNING" : "INFO",
                resourceType: "ORDER",
                resourceId: order._id.toString(),
            })),
            { ordered: false },
        ).catch(() => undefined);
    }

    private async creditSellerEarnings(order: any) {
        const sellerBreakdowns = (order.pricingSnapshot?.sellerBreakdowns || []) as any[];
        for (const item of order.items || []) {
            const sellerId = idString(item.sellerId);
            if (!sellerId) continue;

            const sellerItems = (order.items || []).filter((orderItem: any) => idString(orderItem.sellerId) === sellerId);
            const sellerNetSubtotal = sellerItems.reduce(
                (sum: number, orderItem: any) => sum + Number(orderItem.sellerSubtotal ?? ((orderItem.price || 0) * (orderItem.quantity || 0))),
                0,
            );
            const sellerBreakdown = sellerBreakdowns.find((breakdown) => idString(breakdown.sellerId) === sellerId);
            const sellerCommissionTotal = Number(sellerBreakdown?.platformCommission || 0);
            const grossAmount = Number(item.sellerSubtotal ?? (item.price * item.quantity));
            const commissionAmount = sellerNetSubtotal > 0
                ? Math.round(((grossAmount / sellerNetSubtotal) * sellerCommissionTotal) * 100) / 100
                : 0;
            const netAmount = Math.max(0, grossAmount - commissionAmount);
            const key = {
                orderObjectId: order._id,
                productId: item.productId,
                sku: item.sku,
            };

            const existing = await SellerEarning.findOne(key).lean();
            if (existing) continue;

            await SellerEarning.create({
                sellerId: new Types.ObjectId(sellerId),
                storeId: toObjectId(item.storeId),
                orderId: order.orderId,
                ...key,
                quantity: item.quantity,
                grossAmount,
                commissionAmount,
                netAmount,
                status: "AVAILABLE",
                creditedAt: new Date(),
            });

            await Seller.updateOne(
                { userId: sellerId },
                {
                    $inc: {
                        "wallet.availableBalance": netAmount,
                        "wallet.lifetimeEarnings": netAmount,
                    },
                },
            );
        }
    }

    async quoteOrder(userId: string, data: any) {
        const quote = await orderPricingService.buildQuote(userId, data);
        const { shippingAddress } = data;

        await assertCartStoresOpen(quote.processedItems);
        await assertCartServiceable(quote.processedItems, {
            pincode: shippingAddress?.pincode,
            latitude: shippingAddress?.latitude,
            longitude: shippingAddress?.longitude,
        });

        return {
            subtotal: quote.totalAmount,
            totalAmount: quote.totalAmount,
            totalTax: quote.totalTax,
            mrpTotal: quote.mrpTotal,
            productDiscount: quote.productDiscount,
            discountAmount: quote.discountAmount,
            shippingFee: quote.shippingFee,
            dynamicDeliverySurcharge: quote.dynamicDeliverySurcharge,
            payableAmount: quote.payableAmount,
            platformCommissionTotal: quote.platformCommissionTotal,
            riderPayoutEstimateTotal: quote.riderPayoutEstimateTotal,
            appGrossRevenue: quote.appGrossRevenue,
            appNetAfterRiderEstimate: quote.appNetAfterRiderEstimate,
            sellerBreakdowns: quote.sellerBreakdowns,
            pricingSnapshot: quote.pricingSnapshot,
        };
    }

    async createOrder(userId: string, data: any) {
        const { shippingAddress } = data;
        const isCod = data.paymentMethod === "COD";
        const shippingLatitude = Number(shippingAddress?.latitude);
        const shippingLongitude = Number(shippingAddress?.longitude);

        if (
            !Number.isFinite(shippingLatitude)
            || !Number.isFinite(shippingLongitude)
            || (shippingLatitude === 0 && shippingLongitude === 0)
        ) {
            throw new ApiError(400, "Delivery address location pin is required before placing an order");
        }

        const normalizedShippingAddress = {
            ...shippingAddress,
            latitude: shippingLatitude,
            longitude: shippingLongitude,
        };

        console.log(`[OrderService] Initiating ${isCod ? "COD" : "online"} order for user: ${userId}`);
        const quote = await orderPricingService.buildQuote(userId, data);
        console.log(
            `[OrderService] Final Payable Amount: ${quote.payableAmount} ` +
            `(Subtotal: ${quote.totalAmount}, Coupon: ${quote.discountAmount}, Shipping: ${quote.shippingFee}, Dynamic: ${quote.dynamicDeliverySurcharge})`
        );

        // Hard availability gate: block payment if any cart store is deactivated or closed early.
        await assertCartStoresOpen(quote.processedItems);

        // Hard serviceability gate: block payment if any cart store can't reach the address.
        await assertCartServiceable(quote.processedItems, {
            pincode: normalizedShippingAddress.pincode,
            latitude: shippingLatitude,
            longitude: shippingLongitude,
        });

        // COD orders have no Razorpay order; a real one is created only for online payment.
        const razorpayOrder = isCod
            ? null
            : await razorpay.orders.create({
                amount: Math.round(quote.payableAmount * 100),
                currency: "INR",
                receipt: `receipt_${Date.now()}`,
            });

        const order = await orderDAO.create({
            userId: new Types.ObjectId(userId) as any,
            items: quote.processedItems as any,
            totalAmount: quote.totalAmount,
            totalTax: quote.totalTax,
            mrpTotal: quote.mrpTotal,
            productDiscount: quote.productDiscount,
            discountAmount: quote.discountAmount,
            shippingFee: quote.shippingFee,
            dynamicDeliverySurcharge: quote.dynamicDeliverySurcharge,
            platformCommissionTotal: quote.platformCommissionTotal,
            riderPayoutEstimateTotal: quote.riderPayoutEstimateTotal,
            appGrossRevenue: quote.appGrossRevenue,
            appNetAfterRiderEstimate: quote.appNetAfterRiderEstimate,
            pricingSnapshot: quote.pricingSnapshot,
            payableAmount: quote.payableAmount,
            shippingAddress: normalizedShippingAddress,
            couponCode: quote.couponCodes[0] || "",
            couponCodes: quote.couponCodes,
            couponDiscounts: quote.appliedCouponsInfo,
            // Persist PENDING_PAYMENT for both paths; COD is promoted to CONFIRMED below only
            // after stock is secured, so the DB never holds a confirmed order without inventory.
            status: OrderStatus.PENDING_PAYMENT,
            paymentInfo: {
                razorpayOrderId: isCod ? COD_SENTINEL : razorpayOrder!.id,
            },
        });

        // Emit New Order event to admins
        socketService.emitToAdmins(SocketEvents.NEW_ORDER, {
            orderId: order.orderId,
            fullName: normalizedShippingAddress.fullName,
            amount: quote.payableAmount,
            createdAt: order.createdAt
        });

        // COD skips Razorpay. Secure inventory first (all-or-nothing); only then move the
        // order into PENDING_SELLER_CONFIRMATION (Phase 9) and run the same post-payment
        // pipeline online orders run in verifyPayment. There is no payment to refund, so
        // an out-of-stock COD order is simply marked FAILED.
        if (isCod) {
            try {
                await this.deductOrderStock(order);
            } catch (stockError) {
                await orderDAO.updateStatus(order._id.toString(), OrderStatus.FAILED).catch(() => {});
                throw stockError;
            }
            const pendingOrder = await orderDAO.updateStatus(order._id.toString(), OrderStatus.PENDING_SELLER_CONFIRMATION);
            await this.finalizePendingConfirmation(order);
            // Customer never sees PENDING_SELLER_CONFIRMATION — the order is "confirmed"
            // from their side the moment payment/COD is placed.
            return { order: maskOrderForCustomer(pendingOrder), razorpayOrder: null };
        }

        return {
            order,
            razorpayOrder: {
                id: razorpayOrder!.id,
                amount: razorpayOrder!.amount,
                currency: razorpayOrder!.currency,
            },
        };
    }

    async verifyPayment(data: any) {
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = data;

        // 1. Verify Signature
        const isValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
        if (!isValid) {
            throw new ApiError(400, "Invalid payment signature");
        }

        // 2. Find Order
        const order = await orderDAO.findByRazorpayOrderId(razorpayOrderId);
        if (!order) {
            throw new ApiError(404, "Order not found");
        }

        if (order.status !== OrderStatus.PENDING_PAYMENT) {
            throw new ApiError(400, `Order is already ${order.status}`);
        }

        // 3. Secure inventory BEFORE confirming. If anything is out of stock we must not
        //    leave a CONFIRMED order with captured payment and no fulfillable items (M1),
        //    so we auto-refund the payment and fail the order instead.
        try {
            await this.deductOrderStock(order);
        } catch (stockError) {
            await this.refundAndFailOrder(order, razorpayPaymentId);
            throw stockError;
        }

        // 4. Stock secured — move order into PENDING_SELLER_CONFIRMATION (Phase 9).
        //    The seller(s) must call the customer to confirm before the order advances
        //    to CONFIRMED. Sub-orders are created in the same pending state by
        //    finalizePendingConfirmation, which also generates the pickup/delivery
        //    OTPs up front so the seller can read them on the call.
        const updatedOrder = await orderDAO.updateStatus(
            order._id.toString(),
            OrderStatus.PENDING_SELLER_CONFIRMATION,
            razorpayPaymentId,
            razorpaySignature
        );

        // 5. Run the post-payment pipeline: coupons, sub-orders, emissions — but in
        //    pending mode, so the seller can still see the order in their "pending
        //    confirmation" queue.
        await this.finalizePendingConfirmation(order);

        // Customer never sees PENDING_SELLER_CONFIRMATION — payment success is the
        // "order confirmed" moment for the buyer. The seller panel still surfaces
        // the pending state for the call-and-confirm workflow.
        return maskOrderForCustomer(updatedOrder);
    }

    // Compensation for a captured online payment we can no longer fulfil (M1): refund the
    // payment and mark the order REFUNDED. If the refund call itself fails, leave the order
    // FAILED and log loudly so it can be reconciled manually — never silently confirm.
    private async refundAndFailOrder(order: any, razorpayPaymentId?: string) {
        try {
            if (razorpayPaymentId) {
                await razorpay.payments.refund(razorpayPaymentId, {
                    amount: Math.round(Number(order.payableAmount || 0) * 100),
                    notes: { reason: "Out of stock at payment verification", orderId: order.orderId },
                });
            }
            await orderDAO.update(order._id.toString(), {
                status: OrderStatus.REFUNDED,
                refundedAt: new Date(),
            } as any);
            console.error(`[OrderService] Order ${order.orderId} auto-refunded (out of stock after payment).`);
        } catch (refundError) {
            await orderDAO.updateStatus(order._id.toString(), OrderStatus.FAILED).catch(() => {});
            console.error(`[OrderService] CRITICAL: refund FAILED for order ${order.orderId}, payment ${razorpayPaymentId}. Needs manual reconciliation.`, refundError);
        }
    }

    // Atomically deduct stock for every item in an order, all-or-nothing.
    // Each SKU deduction is atomic (deductStock enforces stock >= qty); if ANY item is
    // out of stock we roll back every prior deduction and throw, so we never leave an
    // order half-reserved. STOCK_UPDATE is emitted only after the whole order succeeds,
    // so a rolled-back partial never broadcasts phantom stock numbers. Callers MUST run
    // this and let it succeed BEFORE marking the order CONFIRMED (M1: no confirmed order
    // may exist without its inventory secured).
    private async deductOrderStock(order: any) {
        const deducted: { productId: string; sku: string; quantity: number; product: any }[] = [];

        for (const item of order.items) {
            const updatedProduct = await ProductDAO.deductStock(
                item.productId.toString(),
                item.sku,
                item.quantity
            );

            if (!updatedProduct) {
                // Roll back everything deducted so far, then fail the whole order.
                for (const d of deducted) {
                    try {
                        await ProductDAO.restoreStock(d.productId, d.sku, d.quantity);
                    } catch (restoreErr) {
                        console.error(`[OrderService] Failed to roll back stock for SKU ${d.sku}:`, restoreErr);
                    }
                }
                console.error(`[OrderService] Out of stock during checkout for product ${item.productId} (SKU: ${item.sku})`);
                throw new ApiError(409, `One or more items in your order (SKU: ${item.sku}) just went out of stock.`);
            }

            deducted.push({ productId: item.productId.toString(), sku: item.sku, quantity: item.quantity, product: updatedProduct });
        }

        // Whole order reserved successfully — now broadcast the new stock levels.
        for (const d of deducted) {
            const updatedVariant = d.product.variants.find((v: any) => v.sku === d.sku);
            socketService.emitToAll(SocketEvents.STOCK_UPDATE, {
                productId: d.product._id,
                sku: d.sku,
                newStock: updatedVariant?.stock || 0,
            });
        }
    }

    // Shared post-payment pipeline used by both online (verifyPayment) and COD (createOrder)
    // once payment lands: mark coupon usage, split into sub-orders, emit.
    //
    // Phase 9 change: sub-orders are created in PENDING_SELLER_CONFIRMATION (not CONFIRMED).
    // The pickup/delivery OTPs are generated NOW so the seller can read them to the customer
    // on the confirmation call. Once every sub-order is confirmed, the parent order moves to
    // CONFIRMED — see sellerConfirmSubOrder below.
    //
    // Stock is already secured by deductOrderStock (called before this).
    private async finalizePendingConfirmation(order: any) {
        const isCod = order.paymentInfo?.razorpayOrderId === COD_SENTINEL;

        // 1. Update Coupon Usage if applicable
        if (order.couponCodes && order.couponCodes.length > 0) {
            for (const code of order.couponCodes) {
                await couponService.incrementUsage(code);
            }
        } else if (order.couponCode) {
            await couponService.incrementUsage(order.couponCode);
        }

        // 2. Split Order into SubOrders (Multi-Vendor Independence)
        const uniqueSellerIds = Array.from(new Set(order.items.map((item: any) => idString(item.sellerId)).filter(Boolean)));
        const pricingBreakdowns = ((order as any).pricingSnapshot?.sellerBreakdowns || []) as any[];
        const splitAmount = (amount: number, count: number, index: number) => {
            if (count <= 0) return 0;
            const paise = Math.round(Number(amount || 0) * 100);
            const base = Math.floor(paise / count);
            const remainder = paise % count;
            return Math.round(((base + (index < remainder ? 1 : 0)) / 100) * 100) / 100;
        };

        for (let idx = 0; idx < uniqueSellerIds.length; idx++) {
            const sellerId = uniqueSellerIds[idx] as string;
            const sellerItems = order.items.filter((item: any) => idString(item.sellerId) === sellerId);

            const subtotal = sellerItems.reduce((sum: number, item: any) => sum + (item.price || 0) * item.quantity, 0);
            const tax = sellerItems.reduce((sum: number, item: any) => sum + (item.taxAmount || 0) * item.quantity, 0);
            const pricingBreakdown = pricingBreakdowns.find((breakdown) => idString(breakdown.sellerId) === sellerId);
            const shippingFeePerSeller = Number(
                pricingBreakdown?.customerDeliveryFeeShare
                ?? splitAmount(order.shippingFee || 0, uniqueSellerIds.length, idx)
            );
            const dynamicDeliverySurcharge = Number(pricingBreakdown?.customerDynamicSurchargeShare || 0);
            const platformCommission = Number(pricingBreakdown?.platformCommission || 0);
            const sellerNetFromSnapshot = pricingBreakdown?.sellerNet;
            const riderPayoutEstimate = Number(pricingBreakdown?.riderPayoutEstimate || 0);
            const riderBonuses = pricingBreakdown?.riderBonuses || { rain: 0, peak: 0, festival: 0, night: 0 };
            const appNetAfterRider = Number(pricingBreakdown?.appNetAfterRider || 0);

            const sellerCoupon = order.couponDiscounts?.find((cd: any) => idString(cd.sellerId) === sellerId);
            const sellerCouponDiscount = sellerCoupon ? sellerCoupon.discountAmount : 0;
            const sellerNet = Number(sellerNetFromSnapshot ?? Math.max(0, subtotal - sellerCouponDiscount - platformCommission));
            const payableAmount = Math.max(0, subtotal + shippingFeePerSeller + dynamicDeliverySurcharge - sellerCouponDiscount);

            const storeId = idString(sellerItems[0]?.storeId);
            const subOrderId = `${order.orderId}-S${idx + 1}`;

            // Prevent duplicate sub-orders (idempotency check)
            const existingSub = await SubOrder.findOne({ subOrderId });
            if (existingSub) continue;

            // Phase 9: generate the OTPs up front so the seller can read them to
            // the customer on the call. They are NOT sent via SMS anywhere.
            const pickupOtp = Math.floor(100000 + Math.random() * 900000).toString();
            const deliveryOtp = Math.floor(100000 + Math.random() * 900000).toString();

            await SubOrder.create({
                subOrderId,
                parentOrderId: order._id,
                sellerId: new Types.ObjectId(sellerId),
                storeId: toObjectId(storeId),
                items: sellerItems.map((item: any) => ({
                    productId: item.productId,
                    title: item.title,
                    sku: item.sku,
                    size: item.size,
                    color: item.color,
                    image: item.image,
                    quantity: item.quantity,
                    price: item.price,
                    sellerSubtotal: item.sellerSubtotal || (item.price * item.quantity),
                })),
                subtotal,
                tax,
                shippingFee: shippingFeePerSeller,
                dynamicDeliverySurcharge,
                platformCommission,
                sellerNet,
                appNetAfterRider,
                pricingSnapshot: pricingBreakdown,
                payableAmount,
                // Phase 9: sub-orders now start in PENDING_SELLER_CONFIRMATION.
                status: SubOrderStatus.PENDING_SELLER_CONFIRMATION,
                packageDetails: {
                    weight: 0,
                    packageCount: 1,
                    isFragile: false,
                    isCod: isCod && payableAmount > 0,
                    otpRequired: true,
                },
                delivery: {
                    status: DeliveryStatus.UNASSIGNED,
                    pickupOtp,
                    deliveryOtp,
                    payoutAmount: riderPayoutEstimate,
                    distanceKm: Number(pricingBreakdown?.distanceKm || 0),
                    bonuses: riderBonuses,
                },
                timeline: [
                    TimelineHelper.createEvent(
                        SubOrderStatus.PENDING_SELLER_CONFIRMATION,
                        "SYSTEM",
                        undefined,
                        undefined,
                        {
                            message: isCod
                                ? "COD order placed — seller must call the customer to confirm"
                                : "Payment verified — seller must call the customer to confirm",
                        }
                    )
                ]
            });

            // Emit to seller room and user room
            socketService.emitToUser(sellerId, SocketEvents.ORDER_STATUS_UPDATE, {
                orderId: order.orderId,
                subOrderId,
                status: SubOrderStatus.PENDING_SELLER_CONFIRMATION,
                message: `New ${isCod ? "COD" : "paid"} sub-order ${subOrderId} — please call the customer to confirm.`,
            });
        }

        // Phase 9: notify the customer and the seller panel. We DO NOT fire
        // ORDER_CONFIRMED yet (that happens when every sub-order is confirmed).
        socketService.emitToUser(order.userId.toString(), SocketEvents.ORDER_STATUS_UPDATE, {
            orderId: order.orderId,
            status: OrderStatus.PENDING_SELLER_CONFIRMATION,
            message: isCod
                ? "Your COD order is placed. The seller will call to confirm shortly."
                : "Payment received! The seller will call to confirm your order shortly.",
        });

        await this.notifyOrderSellers(
            order,
            OrderStatus.PENDING_SELLER_CONFIRMATION,
            `New ${isCod ? "COD" : "paid"} order ${order.orderId} — please call the customer to confirm.`,
        );

        return order;
    }

    /**
     * Phase 9 — seller confirms a single sub-order after phoning the customer.
     * When every sub-order on the parent order is confirmed, the parent order
     * advances to CONFIRMED. Authorization: only the sub-order's seller may call.
     */
    async sellerConfirmSubOrder(
        subOrderId: string,
        sellerUserId: string,
        data: { method?: "phone_call" | "auto"; note?: string } = {},
    ) {
        const subOrder = await SubOrder.findById(subOrderId);
        if (!subOrder) throw new ApiError(404, "Sub-order not found");

        if (idString(subOrder.sellerId) !== sellerUserId) {
            throw new ApiError(403, "Only the assigned seller can confirm this sub-order");
        }

        if (subOrder.status !== SubOrderStatus.PENDING_SELLER_CONFIRMATION) {
            throw new ApiError(400, `Sub-order is already ${subOrder.status}`);
        }

        const now = new Date();
        const updatedSub = await SubOrder.findByIdAndUpdate(
            subOrder._id,
            {
                $set: {
                    status: SubOrderStatus.CONFIRMED,
                    sellerConfirmation: {
                        confirmedAt: now,
                        confirmedBy: new Types.ObjectId(sellerUserId),
                        method: data.method || "phone_call",
                        note: data.note,
                    },
                },
                $push: {
                    timeline: TimelineHelper.createEvent(
                        SubOrderStatus.CONFIRMED,
                        "SELLER",
                        sellerUserId,
                        undefined,
                        {
                            message: `Seller confirmed the order${data.method === "phone_call" ? " after a phone call" : ""}.`,
                            method: data.method || "phone_call",
                            note: data.note,
                        },
                    ),
                },
            },
            { new: true },
        );

        socketService.emitToUser(sellerUserId, SocketEvents.ORDER_STATUS_UPDATE, {
            orderId: updatedSub?.parentOrderId?.toString(),
            subOrderId: updatedSub?.subOrderId,
            status: SubOrderStatus.CONFIRMED,
            message: `Sub-order ${updatedSub?.subOrderId} confirmed.`,
        });

        // Roll up: if every sibling sub-order is also CONFIRMED (or terminal-confirmed),
        // the parent order moves to CONFIRMED.
        await this.rollUpOrderConfirmationStatus(updatedSub!.parentOrderId.toString());

        return updatedSub;
    }

    /**
     * Phase 9 — seller declines a sub-order (customer unreachable, etc.).
     * For online payments the parent order is auto-refunded; for COD it's just
     * marked REJECTED so the customer can re-place.
     */
    async sellerDeclineSubOrder(
        subOrderId: string,
        sellerUserId: string,
        data: { reason: string },
    ) {
        const subOrder = await SubOrder.findById(subOrderId);
        if (!subOrder) throw new ApiError(404, "Sub-order not found");

        if (idString(subOrder.sellerId) !== sellerUserId) {
            throw new ApiError(403, "Only the assigned seller can decline this sub-order");
        }

        if (subOrder.status !== SubOrderStatus.PENDING_SELLER_CONFIRMATION) {
            throw new ApiError(400, `Sub-order is already ${subOrder.status}`);
        }

        const updatedSub = await SubOrder.findByIdAndUpdate(
            subOrder._id,
            {
                $set: {
                    status: SubOrderStatus.SELLER_REJECTED,
                    rejectionReason: data.reason,
                },
                $push: {
                    timeline: TimelineHelper.createEvent(
                        SubOrderStatus.SELLER_REJECTED,
                        "SELLER",
                        sellerUserId,
                        undefined,
                        { reason: data.reason },
                    ),
                },
            },
            { new: true },
        );

        // Roll up: a single rejected sub-order rejects the whole parent order.
        await this.rollUpOrderConfirmationStatus(updatedSub!.parentOrderId.toString(), {
            forceRejected: true,
            reason: data.reason,
        });

        return updatedSub;
    }

    /**
     * Recompute the parent order's status from its sub-orders.
     *  - All sub-orders CONFIRMED → order CONFIRMED
     *  - Any sub-order SELLER_REJECTED / REJECTED → order REJECTED (refund online)
     *  - Otherwise leave in PENDING_SELLER_CONFIRMATION
     */
    private async rollUpOrderConfirmationStatus(
        parentOrderId: string,
        opts: { forceRejected?: boolean; reason?: string } = {},
    ) {
        const order = await orderDAO.findById(parentOrderId);
        if (!order) return;

        if (order.status !== OrderStatus.PENDING_SELLER_CONFIRMATION) {
            // Only operate on orders that are still in the pending bucket.
            return;
        }

        const subOrders = await SubOrder.find({ parentOrderId: order._id }).select("status").lean();
        if (!subOrders.length) return;

        if (opts.forceRejected) {
            await orderDAO.updateStatus(order._id.toString(), OrderStatus.REJECTED);
            socketService.emitToUser(order.userId.toString(), SocketEvents.ORDER_STATUS_UPDATE, {
                orderId: order.orderId,
                status: OrderStatus.REJECTED,
                message: opts.reason
                    ? `Your order ${order.orderId} was declined: ${opts.reason}`
                    : `Your order ${order.orderId} was declined.`,
            });
            return;
        }

        const allConfirmed = subOrders.every((so) => so.status === SubOrderStatus.CONFIRMED);
        if (allConfirmed) {
            await orderDAO.updateStatus(order._id.toString(), OrderStatus.CONFIRMED);
            socketService.emitToAdmins(SocketEvents.ORDER_CONFIRMED, { orderId: order.orderId });
            socketService.emitToUser(order.userId.toString(), SocketEvents.ORDER_STATUS_UPDATE, {
                orderId: order.orderId,
                status: OrderStatus.CONFIRMED,
                message: `Your order ${order.orderId} is confirmed and ready for dispatch.`,
            });
            await this.notifyOrderSellers(
                order,
                OrderStatus.CONFIRMED,
                `Order ${order.orderId} is confirmed by all sellers and ready for fulfillment.`,
            );
        }
    }

    async getMyOrders(userId: string) {
        const orders = await orderDAO.findByUserId(userId);
        return Array.isArray(orders) ? orders.map((o) => maskOrderForCustomer(o)) : orders;
    }

    async getOrderById(userId: string, id: string) {
        let order;

        // 1. Try finding by database _id if it's a valid ObjectId
        if (Types.ObjectId.isValid(id)) {
            order = await orderDAO.findById(id);
        }

        // 2. Fallback to searching by custom orderId (QB-XXXXX) if not found
        if (!order) {
            order = await orderDAO.findByOrderId(id);
        }

        if (!order) {
            throw new ApiError(404, "Order not found");
        }

        // 3. Security Check: Ensure the order belongs to the user
        if (order.userId._id.toString() !== userId.toString()) {
            throw new ApiError(403, "You do not have permission to view this order");
        }

        // 4. Fetch sub-orders and append them to the response
        const subOrders = await SubOrder.find({ parentOrderId: order._id })
            .populate("sellerId storeId delivery.riderId items.productId")
            .lean();

        // Customer-facing: hide the internal pending-seller-confirmation state
        // (it is an operational state for the seller panel only).
        const maskedOrder = maskOrderForCustomer(order.toObject());
        const maskedSubOrders = subOrders.map((so) => maskSubOrderForCustomer(so));

        return {
            ...maskedOrder,
            subOrders: maskedSubOrders,
            fulfillmentSummary: fulfillmentSummaryOf(maskedSubOrders),
        };
    }

    async getAdminOrders(query: any = {}) {
        return await orderDAO.findAll(query);
    }

    async assignDeliveryPartner(orderId: string, data: { deliveryUserId: string; payoutAmount?: number }, adminId?: string) {
        const order = await orderDAO.findById(orderId);
        if (!order) throw new ApiError(404, "Order not found");

        if ([OrderStatus.PENDING_PAYMENT, OrderStatus.CANCELLED, OrderStatus.REJECTED, OrderStatus.REFUNDED, OrderStatus.FAILED, OrderStatus.DELIVERED].includes(order.status)) {
            throw new ApiError(400, `Cannot assign delivery for ${order.status} order`);
        }

        const deliveryProfile = await DeliveryBoy.findOne({
            $or: [{ userId: data.deliveryUserId }, { _id: data.deliveryUserId }],
            status: "APPROVED",
            isVerified: true,
        }).lean();
        if (!deliveryProfile) throw new ApiError(404, "Approved delivery profile not found");
        const deliveryUserId = deliveryProfile.userId?.toString();
        if (!deliveryUserId) throw new ApiError(400, "Delivery profile is missing a user account");

        const [deliveryUser, config] = await Promise.all([
            User.findById(deliveryUserId).select("fullName email phone isBlocked roleId").populate("roleId").lean(),
            appConfigService.getConfig(),
        ]);

        if (!deliveryUser || deliveryUser.isBlocked) throw new ApiError(400, "Delivery user is not available");
        const roleName = (deliveryUser.roleId as any)?.name;
        if (roleName && roleName !== "DELIVERY") {
            throw new ApiError(400, "Selected user is not a delivery partner");
        }

        const now = new Date();
        const payoutAmount = Number(
            data.payoutAmount
            ?? (order as any).riderPayoutEstimateTotal
            ?? config?.delivery?.riderPayoutAmount
            ?? order.shippingFee
            ?? 0
        );
        const otp = generateDeliveryOtp();

        const updated = await populateOrderQuery(Order.findByIdAndUpdate(
            order._id,
            {
                $set: {
                    status: [OrderStatus.CONFIRMED, OrderStatus.PAID].includes(order.status) ? OrderStatus.PROCESSING : order.status,
                    "delivery.partnerUserId": new Types.ObjectId(deliveryUserId),
                    "delivery.partnerProfileId": deliveryProfile._id,
                    "delivery.status": DeliveryStatus.ASSIGNED,
                    "delivery.otp": {
                        code: otp,
                        generatedAt: now,
                    },
                    "delivery.payoutAmount": payoutAmount,
                    "delivery.assignedAt": now,
                    "delivery.cancelledAt": undefined,
                },
                $push: {
                    "delivery.events": deliveryEvent(DeliveryStatus.ASSIGNED, "ASSIGN_DELIVERY", adminId),
                },
            },
            { returnDocument: "after" },
        ));

        if (!updated) throw new ApiError(404, "Order not found");

        socketService.emitToUser(deliveryUserId, SocketEvents.ORDER_STATUS_UPDATE, {
            orderId: updated.orderId,
            status: updated.status,
            deliveryStatus: DeliveryStatus.ASSIGNED,
            message: `Order ${updated.orderId} has been assigned to you.`,
        });
        socketService.emitToUser(updated.userId?._id?.toString() || updated.userId?.toString(), SocketEvents.ORDER_STATUS_UPDATE, {
            orderId: updated.orderId,
            status: updated.status,
            deliveryStatus: DeliveryStatus.ASSIGNED,
            message: "A delivery partner has been assigned to your order.",
        });

        return updated;
    }

    async unassignDeliveryPartner(orderId: string, adminId?: string) {
        const order = await orderDAO.findById(orderId);
        if (!order) throw new ApiError(404, "Order not found");

        if (order.delivery?.status === DeliveryStatus.DELIVERED || order.status === OrderStatus.DELIVERED) {
            throw new ApiError(400, "Cannot unassign a delivered order");
        }

        const previousDeliveryUserId = order.delivery?.partnerUserId?._id?.toString() || order.delivery?.partnerUserId?.toString();

        const updated = await populateOrderQuery(Order.findByIdAndUpdate(
            order._id,
            {
                $set: {
                    "delivery.status": DeliveryStatus.UNASSIGNED,
                    "delivery.cancelledAt": new Date(),
                },
                $unset: {
                    "delivery.partnerUserId": "",
                    "delivery.partnerProfileId": "",
                    "delivery.otp": "",
                    "delivery.currentLocation": "",
                },
                $push: {
                    "delivery.events": deliveryEvent(DeliveryStatus.UNASSIGNED, "UNASSIGN_DELIVERY", adminId),
                },
            },
            { returnDocument: "after" },
        ));

        if (!updated) throw new ApiError(404, "Order not found");

        if (previousDeliveryUserId) {
            socketService.emitToUser(previousDeliveryUserId, SocketEvents.ORDER_STATUS_UPDATE, {
                orderId: updated.orderId,
                deliveryStatus: DeliveryStatus.UNASSIGNED,
                message: `Order ${updated.orderId} has been unassigned.`,
            });
        }

        return updated;
    }

    async adminUpdateOrderStatus(orderId: string, status: OrderStatus, reason?: string, options: { allowUnverifiedDeliveryOtp?: boolean } = {}) {
        const order = await orderDAO.findById(orderId);
        if (!order) throw new ApiError(404, "Order not found");

        const oldStatus = order.status;

        if (
            status === OrderStatus.DELIVERED &&
            order.delivery?.partnerUserId &&
            !order.delivery?.otp?.verifiedAt &&
            !options.allowUnverifiedDeliveryOtp
        ) {
            throw new ApiError(400, "Delivery OTP must be verified before marking this assigned order delivered");
        }
        
        // 1. Update status and tracking info
        const updateData: any = { status };
        if (status === OrderStatus.REJECTED) {
            updateData.rejectedAt = new Date();
            updateData.cancellationReason = reason || "Rejected by Administrator";
        } else if (status === OrderStatus.CANCELLED) {
            updateData.cancelledAt = new Date();
            updateData.cancellationReason = reason || "Cancelled by Administrator";
        } else if (status === OrderStatus.REFUNDED) {
            updateData.refundedAt = new Date();
        }

        if (
            [OrderStatus.CANCELLED, OrderStatus.REJECTED, OrderStatus.REFUNDED].includes(status) &&
            order.delivery?.partnerUserId &&
            order.delivery?.status !== DeliveryStatus.DELIVERED
        ) {
            updateData["delivery.status"] = DeliveryStatus.CANCELLED;
            updateData["delivery.cancelledAt"] = new Date();
        }

        const updatedOrder = await orderDAO.updateStatus(orderId, status);
        if (Object.keys(updateData).length > 1) {
            await orderDAO.update(orderId, updateData);
        }

        // 2. Handle Inventory Restoration if order is cancelled/rejected after payment
        const isCancellation = status === OrderStatus.CANCELLED || status === OrderStatus.REJECTED || status === OrderStatus.REFUNDED;
        const wasPaid = [OrderStatus.PAID, OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.SHIPPED].includes(oldStatus);

        if (isCancellation && wasPaid) {
            console.log(`[OrderService] Restoring stock for cancelled/rejected order: ${order.orderId}`);
            for (const item of order.items) {
                await ProductDAO.restoreStock(item.productId.toString(), item.sku, item.quantity);
            }
        }

        if (status === OrderStatus.DELIVERED) {
            const subOrderCount = await SubOrder.countDocuments({ parentOrderId: order._id });
            if (subOrderCount > 0) {
                await sellerSettlementService.settleDeliveredSubOrdersForOrder(order._id, {
                    source: "ADMIN_DELIVERY",
                    note: "Parent order was marked delivered by admin.",
                });
            } else {
                await this.creditSellerEarnings(order);
            }
        }

        // 3. Notify User via Socket
        console.log(`[OrderService] Notifying user ${order.userId._id} about status update to ${status}`);
        socketService.emitToUser(order.userId._id.toString(), SocketEvents.ORDER_STATUS_UPDATE, {
            orderId: order.orderId,
            status,
            reason: reason || "",
            message: `Your order status has been updated to ${status}`
        });

        // 4. Notify User via Push Notification
        const user = await User.findById(order.userId);
        if (user?.fcmToken) {
            const title = `Order Update: ${status}`;
            const body = status === OrderStatus.REJECTED || status === OrderStatus.CANCELLED
                ? `Your order ${order.orderId} was ${status.toLowerCase()}. Reason: ${reason || "Not specified"}`
                : `Good news! Your order ${order.orderId} is now ${status.toLowerCase()}.`;
            
            await notificationService.sendPush(user.fcmToken, title, body, { orderId: order._id.toString() });
        }

        await this.notifyOrderSellers(order, status, `Order ${order.orderId} has moved to ${status}.`);

        return updatedOrder;
    }
}

export const orderService = new OrderService();
