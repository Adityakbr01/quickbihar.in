import { z } from "zod";
import { DeliveryStatus, OrderStatus } from "./order.type";

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
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
}).refine(
    (address) => !(address.latitude === 0 && address.longitude === 0),
    {
        path: ["latitude"],
        message: "Delivery address location pin is required",
    }
);

export const createOrderSchema = z.object({
    items: z.array(orderItemSchema).min(1, "Order must have at least one item"),
    shippingAddress: shippingAddressSchema,
    couponCode: z.string().optional(),
    couponCodes: z.array(z.string()).optional(),
});

export const verifyPaymentSchema = z.object({
    razorpayOrderId: z.string().min(1, "Razorpay Order ID is required"),
    razorpayPaymentId: z.string().min(1, "Razorpay Payment ID is required"),
    razorpaySignature: z.string().min(1, "Razorpay Signature is required"),
});

export const adminOrderStatusSchema = z.object({
    status: z.nativeEnum(OrderStatus),
    cancellationReason: z.string().trim().max(500).optional(),
});

export const assignDeliverySchema = z.object({
    deliveryUserId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid delivery user id"),
    payoutAmount: z.coerce.number().min(0).optional(),
});

export const deliveryLocationSchema = z.object({
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
    heading: z.coerce.number().min(0).max(360).optional(),
});

export const updateDeliveryStatusSchema = z.object({
    action: z.enum([
        DeliveryStatus.ACCEPTED,
        DeliveryStatus.PICKED_UP,
        DeliveryStatus.OUT_FOR_DELIVERY,
        DeliveryStatus.DELIVERED,
    ]),
    otp: z.string().trim().min(4).max(8).optional(),
    note: z.string().trim().max(500).optional(),
    location: deliveryLocationSchema.optional(),
});
