import { z } from "zod";

const orderItemSchema = z.object({
    productId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Product ID"),
    sku: z.string().min(1, "SKU is required"),
    quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

const shippingAddressSchema = z.object({
    fullName: z.string().min(2, "Full name is required"),
    phone: z.string().min(10, "Valid phone number required").max(15),
    street: z.string().min(5, "Street address is required"),
    city: z.string().min(2, "City is required"),
    state: z.string().min(2, "State is required"),
    pincode: z.string().min(6, "Pincode required").max(6),
    landmark: z.string().optional(),
});

export const createOrderSchema = z.object({
    items: z.array(orderItemSchema).min(1, "Order must have at least one item"),
    shippingAddress: shippingAddressSchema,
    couponCode: z.string().optional(),
});

export const verifyPaymentSchema = z.object({
    razorpayOrderId: z.string().min(1, "Razorpay Order ID is required"),
    razorpayPaymentId: z.string().min(1, "Razorpay Payment ID is required"),
    razorpaySignature: z.string().min(1, "Razorpay Signature is required"),
});
