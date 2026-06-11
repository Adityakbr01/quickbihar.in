import { Types } from "mongoose";
import { ApiError } from "../../utils/ApiError";
import { ProductDAO } from "../products/product.dao";
import { couponService } from "../coupon/coupon.service";
import { appConfigService } from "../appConfig/appConfig.service";
import { orderDAO } from "./order.dao";
import { DeliveryStatus, OrderStatus } from "./order.type";
import { Order } from "./order.model";
import { razorpay, verifyRazorpaySignature } from "../../utils/razorpay.util";
import { socketService } from "../socket/socket.service";
import { notificationService } from "../notification/notification.service";
import { User } from "../user/user.model";
import { SocketEvents } from "../../constants/socketEvents";
import { Seller } from "../seller/seller.model";
import { SellerEarning, SellerNotification } from "../seller/sellerPanel.model";
import { DeliveryBoy } from "../deliveryBoy/delivery.model";
import { SubOrder, SubOrderStatus } from "./subOrder.model";
import { TimelineHelper } from "./timeline.helper";
import { orderPricingService } from "./orderPricing.service";

const generateDeliveryOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

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
            .map((item: any) => item.sellerId?.toString())
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
            const sellerId = item.sellerId?.toString();
            if (!sellerId) continue;

            const sellerItems = (order.items || []).filter((orderItem: any) => orderItem.sellerId?.toString() === sellerId);
            const sellerNetSubtotal = sellerItems.reduce(
                (sum: number, orderItem: any) => sum + Number(orderItem.sellerSubtotal ?? ((orderItem.price || 0) * (orderItem.quantity || 0))),
                0,
            );
            const sellerBreakdown = sellerBreakdowns.find((breakdown) => breakdown.sellerId?.toString() === sellerId);
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
                storeId: item.storeId,
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

        console.log(`[OrderService] Initiating order for user: ${userId}`);
        const quote = await orderPricingService.buildQuote(userId, data);
        console.log(
            `[OrderService] Final Payable Amount: ${quote.payableAmount} ` +
            `(Subtotal: ${quote.totalAmount}, Coupon: ${quote.discountAmount}, Shipping: ${quote.shippingFee}, Dynamic: ${quote.dynamicDeliverySurcharge})`
        );

        const razorpayOrder = await razorpay.orders.create({
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
            status: OrderStatus.PENDING_PAYMENT,
            paymentInfo: {
                razorpayOrderId: razorpayOrder.id,
            },
        });

        // Emit New Order event to admins
        socketService.emitToAdmins(SocketEvents.NEW_ORDER, {
            orderId: order.orderId,
            fullName: normalizedShippingAddress.fullName,
            amount: quote.payableAmount,
            createdAt: order.createdAt
        });

        return {
            order,
            razorpayOrder: {
                id: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
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

        // 3. Update Order Status
        const updatedOrder = await orderDAO.updateStatus(
            order._id.toString(),
            OrderStatus.CONFIRMED,
            razorpayPaymentId,
            razorpaySignature
        );

        // 4. Atomic Stock Deduction
        for (const item of order.items) {
            const updatedProduct = await ProductDAO.deductStock(
                item.productId.toString(),
                item.sku,
                item.quantity
            );

            if (!updatedProduct) {
                console.error(`[OrderService] Race condition: Stock ran out during payment for product ${item.productId}`);
                // In a production environment, you would trigger a refund here.
                throw new ApiError(409, `One or more items in your order (SKU: ${item.sku}) ran out of stock just now. Please contact support for a refund.`);
            }

            // Emit Real-Time Stock Update to all users
            const updatedVariant = updatedProduct.variants.find(v => v.sku === item.sku);
            socketService.emitToAll(SocketEvents.STOCK_UPDATE, {
                productId: updatedProduct._id,
                sku: item.sku,
                newStock: updatedVariant?.stock || 0
            });
        }

        // 5. Update Coupon Usage if applicable
        if (order.couponCodes && order.couponCodes.length > 0) {
            for (const code of order.couponCodes) {
                await couponService.incrementUsage(code);
            }
        } else if (order.couponCode) {
            await couponService.incrementUsage(order.couponCode);
        }

        // 6. Split Order into SubOrders (Multi-Vendor Independence)
        const uniqueSellerIds = Array.from(new Set(order.items.map((item: any) => item.sellerId?.toString()).filter(Boolean)));
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
            const sellerItems = order.items.filter((item: any) => item.sellerId?.toString() === sellerId);
            
            const subtotal = sellerItems.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
            const tax = sellerItems.reduce((sum, item) => sum + (item.taxAmount || 0) * item.quantity, 0);
            const pricingBreakdown = pricingBreakdowns.find((breakdown) => breakdown.sellerId?.toString() === sellerId);
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
            
            const sellerCoupon = order.couponDiscounts?.find((cd: any) => cd.sellerId?.toString() === sellerId);
            const sellerCouponDiscount = sellerCoupon ? sellerCoupon.discountAmount : 0;
            const sellerNet = Number(sellerNetFromSnapshot ?? Math.max(0, subtotal - sellerCouponDiscount - platformCommission));
            const payableAmount = Math.max(0, subtotal + shippingFeePerSeller + dynamicDeliverySurcharge - sellerCouponDiscount);

            const storeId = sellerItems[0]?.storeId;
            const subOrderId = `${order.orderId}-S${idx + 1}`;

            // Prevent duplicate sub-orders (idempotency check)
            const existingSub = await SubOrder.findOne({ subOrderId });
            if (existingSub) continue;

            const pickupOtp = Math.floor(100000 + Math.random() * 900000).toString();
            const deliveryOtp = Math.floor(100000 + Math.random() * 900000).toString();

            await SubOrder.create({
                subOrderId,
                parentOrderId: order._id,
                sellerId: new Types.ObjectId(sellerId),
                storeId: storeId ? new Types.ObjectId(storeId.toString()) : undefined,
                items: sellerItems.map((item: any) => ({
                    productId: item.productId,
                    title: item.title,
                    sku: item.sku,
                    size: item.size,
                    color: item.color,
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
                status: SubOrderStatus.CONFIRMED,
                packageDetails: {
                    weight: 0,
                    packageCount: 1,
                    isFragile: false,
                    isCod: order.payableAmount > 0 && order.paymentInfo?.razorpayOrderId === "COD",
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
                        SubOrderStatus.CONFIRMED,
                        "SYSTEM",
                        undefined,
                        undefined,
                        { message: "Order payment verified and sub-order created" }
                    )
                ]
            });

            // Emit to seller room and user room
            socketService.emitToUser(sellerId, SocketEvents.ORDER_STATUS_UPDATE, {
                orderId: order.orderId,
                subOrderId,
                status: SubOrderStatus.CONFIRMED,
                message: `New confirmed sub-order ${subOrderId} is ready for fulfillment.`
            });
        }

        // Emission of events
        socketService.emitToAdmins(SocketEvents.ORDER_CONFIRMED, { orderId: updatedOrder?.orderId });
        socketService.emitToUser(order.userId.toString(), SocketEvents.ORDER_STATUS_UPDATE, {
            orderId: updatedOrder?.orderId,
            status: OrderStatus.CONFIRMED,
            message: "Your payment has been verified and order is confirmed!"
        });

        await this.notifyOrderSellers(order, OrderStatus.CONFIRMED, `A new paid order ${order.orderId} is ready for fulfillment.`);

        return updatedOrder;
    }

    async getMyOrders(userId: string) {
        return await orderDAO.findByUserId(userId);
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
            .populate("sellerId storeId delivery.riderId")
            .lean();

        return {
            ...order.toObject(),
            subOrders,
            fulfillmentSummary: fulfillmentSummaryOf(subOrders),
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
            await this.creditSellerEarnings(order);
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
