import { Document, Types } from "mongoose";

export enum OrderStatus {
    PENDING_PAYMENT = "PENDING_PAYMENT",
    PAID = "PAID",
    CONFIRMED = "CONFIRMED",
    SHIPPED = "SHIPPED",
    DELIVERED = "DELIVERED",
    CANCELLED = "CANCELLED",
    REJECTED = "REJECTED",
    FAILED = "FAILED",
}

export interface IOrderItem {
    productId: Types.ObjectId;
    title: string;
    sku: string;
    size: string;
    color: string;
    quantity: number;
    price: number; // Snapshot of price at purchase
    pickupLocation?: string; 
    warehouseName?: string;
    latitude?: number;
    longitude?: number;
}

export interface IShippingAddress {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
}

export interface IOrder extends Document {
    orderId: string; // User-facing readable ID
    userId: Types.ObjectId;
    items: IOrderItem[];
    totalAmount: number; // Subtotal after product discount
    mrpTotal: number;    // Gross total before any discount 
    productDiscount: number; // Total savings from product price drops
    discountAmount: number;  // Savings from Coupon
    shippingFee: number;
    totalTax: number;        // Total GST amount
    payableAmount: number;   // Final amount paid
    shippingAddress: IShippingAddress;
    status: OrderStatus;
    cancellationReason?: string;
    rejectedAt?: Date;
    cancelledAt?: Date;
    paymentInfo: {
        razorpayOrderId: string;
        razorpayPaymentId?: string;
        razorpaySignature?: string;
    };
    couponCode?: string;
    createdAt: Date;
    updatedAt: Date;
}
