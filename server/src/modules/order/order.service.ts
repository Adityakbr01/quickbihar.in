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

        // 1. Validate Products and Calculate Totals
        for (const item of items) {
            const product = await ProductDAO.findById(item.productId);
            if (!product) {
                throw new ApiError(404, `Product not found: ${item.productId}`);
            }

            // Find specific variant for SKU and price
            const variant = product.variants.find(v => v.sku === item.sku);
            if (!variant) {
                throw new ApiError(404, `Variant with SKU ${item.sku} not found for product ${product.title}`);
            }

            if (variant.stock < item.quantity) {
                throw new ApiError(400, `Insufficient stock for ${product.title} (${variant.size}/${variant.color})`);
            }

            const itemPrice = product.price; // Discounted Price
            const itemOriginalPrice = product.originalPrice || product.price; // Fallback to selling price if no original

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

        // 2. Handle Coupon Discount
        let couponDiscountAmount = 0;
        if (couponCode) {
            const validation = await couponService.validateCoupon(couponCode, totalAmount, userId);
            couponDiscountAmount = validation.discountAmount;
        }

        const payableAmount = totalAmount - couponDiscountAmount;

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
            await ProductDAO.updateById(item.productId.toString(), {
                $inc: {
                    "variants.$[elem].stock": -item.quantity,
                    totalStock: -item.quantity
                }
            }, {
                arrayFilters: [{ "elem.sku": item.sku }],
                new: true
            });
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
}

export const orderService = new OrderService();