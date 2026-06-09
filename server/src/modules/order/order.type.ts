import { Document, Types } from "mongoose";

export enum OrderStatus {
    PENDING_PAYMENT = "PENDING_PAYMENT",
    PAID = "PAID",
    CONFIRMED = "CONFIRMED",
    PROCESSING = "PROCESSING",
    SHIPPED = "SHIPPED",
    DELIVERED = "DELIVERED",
    CANCELLED = "CANCELLED",
    REJECTED = "REJECTED",
    REFUNDED = "REFUNDED",
    FAILED = "FAILED",
}

export enum DeliveryStatus {
    UNASSIGNED = "UNASSIGNED",
    ASSIGNED = "ASSIGNED",
    ACCEPTED = "ACCEPTED",
    PICKED_UP = "PICKED_UP",
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY",
    DELIVERED = "DELIVERED",
    CANCELLED = "CANCELLED",
}

export interface IDeliveryLocation {
    latitude: number;
    longitude: number;
    heading?: number;
    updatedAt?: Date;
}

export interface IDeliveryEvent {
    status: DeliveryStatus;
    action: string;
    note?: string;
    actorId?: Types.ObjectId;
    at: Date;
    location?: IDeliveryLocation;
}

export interface IOrderDelivery {
    partnerUserId?: Types.ObjectId;
    partnerProfileId?: Types.ObjectId;
    status: DeliveryStatus;
    otp?: {
        code?: string;
        generatedAt?: Date;
        verifiedAt?: Date;
    };
    payoutAmount?: number;
    payoutCreditedAt?: Date;
    assignedAt?: Date;
    acceptedAt?: Date;
    pickedUpAt?: Date;
    outForDeliveryAt?: Date;
    deliveredAt?: Date;
    cancelledAt?: Date;
    currentLocation?: IDeliveryLocation;
    events?: IDeliveryEvent[];
}

export interface IOrderItem {
    productId: Types.ObjectId;
    title: string;
    sku: string;
    size: string;
    color: string;
    quantity: number;
    price: number; // Snapshot of price at purchase
    sellerId?: Types.ObjectId;
    storeId?: Types.ObjectId;
    sellerSubtotal?: number;
    settlementStatus?: "PENDING" | "AVAILABLE" | "PAID" | "REVERSED";
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
    latitude?: number;
    longitude?: number;
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
    delivery?: IOrderDelivery;
    cancellationReason?: string;
    rejectedAt?: Date;
    cancelledAt?: Date;
    refundedAt?: Date;
    paymentInfo: {
        razorpayOrderId: string;
        razorpayPaymentId?: string;
        razorpaySignature?: string;
    };
    couponCode?: string;
    createdAt: Date;
    updatedAt: Date;
}
