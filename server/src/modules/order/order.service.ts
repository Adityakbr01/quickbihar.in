import { Types } from "mongoose";
import { ApiError } from "../../utils/ApiError";
import { ProductDAO } from "../products/product.dao";
import { couponService } from "../coupon/coupon.service";
import { orderDAO } from "./order.dao";
import { OrderStatus } from "./order.type";
import { razorpay, verifyRazorpaySignature } from "../../utils/razorpay.util";

export class OrderService {
    async createOrder(userId: string, data: any) {
        const { items, shippingAddress, couponCode } = data;

        let totalAmount = 0;   // Post-product discount subtotal
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
            const itemPrice = product.price; // Discounted/Selling Price
            const itemOriginalPrice = product.originalPrice || product.price;

            totalAmount += itemPrice * item.quantity;
            mrpTotal += itemOriginalPrice * item.quantity;

            processedItems.push({
                productId: product._id,
                title: product.title,
                sku: variant.sku,
                size: variant.size,
                color: variant.color,
                quantity: item.quantity,
                price: itemPrice,
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

        const payableBeforeShipping = totalAmount - couponDiscountAmount;
        const shippingFee = payableBeforeShipping > 2000 ? 0 : 99;
        const payableAmount = payableBeforeShipping + shippingFee;

        console.log(`[OrderService] Final Payable Amount: ${payableAmount} (Subtotal: ${totalAmount}, Coupon: -${couponDiscountAmount}, Shipping: ${shippingFee})`);

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
        }

        // 5. Update Coupon Usage if applicable
        if (order.couponCode) {
            await couponService.incrementUsage(order.couponCode);
        }

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
}

export const orderService = new OrderService();