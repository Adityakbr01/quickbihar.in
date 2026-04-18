import { Types } from "mongoose";
import { ApiError } from "../../utils/ApiError";
import { ProductDAO } from "../products/product.dao";
import { couponService } from "../coupon/coupon.service";
import { appConfigService } from "../appConfig/appConfig.service";
import { orderDAO } from "./order.dao";
import { OrderStatus } from "./order.type";
import { razorpay, verifyRazorpaySignature } from "../../utils/razorpay.util";
import { socketService } from "../socket/socket.service";
import { notificationService } from "../notification/notification.service";
import { User } from "../user/user.model";
import { SocketEvents } from "../../constants/socketEvents";

export class OrderService {
    async createOrder(userId: string, data: any) {
        const { items, shippingAddress, couponCode } = data;

        let totalAmount = 0;   // Post-product discount subtotal
        let totalTax = 0;      // Total GST amount
        let mrpTotal = 0;      // Pre-discount total
        const processedItems = [];

        // 1. Validate Products and Calculate Totals from Database
        console.log(`[OrderService] Initiating order for user: ${userId}`);
        for (const item of items) {
            const product = await ProductDAO.findById(item.productId);
            if (!product) {
                console.error(`[OrderService] Product not found: ${item.productId}`);
                throw new ApiError(404, `Product not found: ${item.productId}`);
            }

            // Find specific variant for SKU and price
            const variant = product.variants.find(v => v.sku === item.sku);
            if (!variant) {
                console.error(`[OrderService] SKU ${item.sku} not found for product ${product.title}`);
                throw new ApiError(404, `Variant with SKU ${item.sku} not found`);
            }

            if (variant.stock < item.quantity) {
                console.error(`[OrderService] Insufficient stock for ${product.title}: ${variant.stock} < ${item.quantity}`);
                throw new ApiError(400, `Insufficient stock for ${product.title}`);
            }

            // SOURCE OF TRUTH: Always use DB prices, ignore client values
            const basePrice = product.price; // Discounted/Selling Price (Exclusive)
            const itemPrice = Math.round(product.isGstApplicable
                ? basePrice * (1 + (product.gstPercentage || 0) / 100)
                : basePrice);

            const itemOriginalPrice = product.originalPrice || product.price;
            const taxAmount = Math.round(itemPrice - basePrice);

            totalAmount += itemPrice * item.quantity;
            totalTax += taxAmount * item.quantity;
            mrpTotal += itemOriginalPrice * item.quantity;

            processedItems.push({
                productId: product._id,
                title: product.title,
                sku: variant.sku,
                size: variant.size,
                color: variant.color,
                quantity: item.quantity,
                price: itemPrice, // Final inclusive price
                basePrice: basePrice, // Exclusive price for tax records
                taxAmount,
                isGstApplicable: product.isGstApplicable,
                gstPercentage: product.gstPercentage,
                pickupLocation: product.logistics?.pickupLocation,
                warehouseName: product.logistics?.warehouseName,
                latitude: product.logistics?.latitude,
                longitude: product.logistics?.longitude,
            });
        }

        const productDiscount = mrpTotal - totalAmount;
        console.log(`[OrderService] Calculations: MRP=${mrpTotal}, Subtotal=${totalAmount}, ProductDiscount=${productDiscount}`);

        // 2. Handle Coupon Discount with Refined Logic
        let couponDiscountAmount = 0;
        if (couponCode) {
            console.log(`[OrderService] Validating coupon: ${couponCode}`);
            const validation = await couponService.validateCoupon(couponCode, totalAmount, userId);
            couponDiscountAmount = validation.discountAmount;
            console.log(`[OrderService] Coupon Applied: ${couponCode}, Savings=${couponDiscountAmount}`);
        }

        // Fetch Shipping Configuration
        const config = await appConfigService.getConfig();
        const shippingRules = config?.shipping || { freeShippingThreshold: 2000, shippingFee: 99 };

        const payableBeforeShipping = totalAmount - couponDiscountAmount;
        const shippingFee = payableBeforeShipping >= shippingRules.freeShippingThreshold ? 0 : shippingRules.shippingFee;
        const payableAmount = payableBeforeShipping + shippingFee;

        console.log(`[OrderService] Final Payable Amount: ${payableAmount} (Subtotal: ${totalAmount}, Coupon: ${couponDiscountAmount}, Shipping: ${shippingFee})`);

        // 3. Create Razorpay Order
        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(payableAmount * 100), // Razorpay expects paise
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        });

        // 4. Create Order in Database
        const order = await orderDAO.create({
            userId: new Types.ObjectId(userId) as any,
            items: processedItems as any,
            totalAmount,
            totalTax,
            mrpTotal,
            productDiscount,
            discountAmount: couponDiscountAmount,
            shippingFee,
            payableAmount,
            shippingAddress,
            couponCode,
            status: OrderStatus.PENDING_PAYMENT,
            paymentInfo: {
                razorpayOrderId: razorpayOrder.id,
            },
        });

        // Emit New Order event to admins
        socketService.emitToAdmins(SocketEvents.NEW_ORDER, {
            orderId: order.orderId,
            fullName: shippingAddress.fullName,
            amount: payableAmount,
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
        if (order.couponCode) {
            await couponService.incrementUsage(order.couponCode);
        }

        // Emission of events
        socketService.emitToAdmins(SocketEvents.ORDER_CONFIRMED, { orderId: updatedOrder?.orderId });
        socketService.emitToUser(order.userId.toString(), SocketEvents.ORDER_STATUS_UPDATE, {
            orderId: updatedOrder?.orderId,
            status: OrderStatus.CONFIRMED,
            message: "Your payment has been verified and order is confirmed!"
        });

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

        return order;
    }

    async getAdminOrders() {
        return await orderDAO.findAll();
    }

    async adminUpdateOrderStatus(orderId: string, status: OrderStatus, reason?: string) {
        const order = await orderDAO.findById(orderId);
        if (!order) throw new ApiError(404, "Order not found");

        const oldStatus = order.status;
        
        // 1. Update status and tracking info
        const updateData: any = { status };
        if (status === OrderStatus.REJECTED) {
            updateData.rejectedAt = new Date();
            updateData.cancellationReason = reason || "Rejected by Administrator";
        } else if (status === OrderStatus.CANCELLED) {
            updateData.cancelledAt = new Date();
            updateData.cancellationReason = reason || "Cancelled by Administrator";
        }

        const updatedOrder = await orderDAO.updateStatus(orderId, status);
        if (updateData.cancellationReason) {
            await orderDAO.update(orderId, updateData);
        }

        // 2. Handle Inventory Restoration if order is cancelled/rejected after payment
        const isCancellation = status === OrderStatus.CANCELLED || status === OrderStatus.REJECTED;
        const wasPaid = [OrderStatus.PAID, OrderStatus.CONFIRMED, OrderStatus.SHIPPED].includes(oldStatus);

        if (isCancellation && wasPaid) {
            console.log(`[OrderService] Restoring stock for cancelled/rejected order: ${order.orderId}`);
            for (const item of order.items) {
                await ProductDAO.restoreStock(item.productId.toString(), item.sku, item.quantity);
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

        return updatedOrder;
    }
}

export const orderService = new OrderService();