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
    ASSIGNMENT_OPEN = "ASSIGNMENT_OPEN",
    ASSIGNED = "ASSIGNED",
    ACCEPTED = "ACCEPTED",
    RIDER_REJECTED = "RIDER_REJECTED",
    ARRIVING_AT_STORE = "ARRIVING_AT_STORE",
    REACHED_STORE = "REACHED_STORE",
    PICKUP_VERIFICATION_PENDING = "PICKUP_VERIFICATION_PENDING",
    PICKED_UP = "PICKED_UP",
    IN_TRANSIT = "IN_TRANSIT",
    NEAR_CUSTOMER = "NEAR_CUSTOMER",
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY",
    DELIVERED = "DELIVERED",
    DELIVERY_CONFIRMED = "DELIVERY_CONFIRMED",
    CANCELLED = "CANCELLED",
    FAILED = "FAILED",
    RETURNING = "RETURNING",
    RETURNED = "RETURNED",
}

export interface IDeliveryLocation {
    latitude?: number;
    longitude?: number;
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
    taxAmount?: number;
    basePrice?: number;
}

export interface IShippingAddress {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
    latitude: number;
    longitude: number;
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
    couponCodes?: string[];
    couponDiscounts?: Array<{ code: string; sellerId: any; discountAmount: number }>;
    createdAt: Date;
    updatedAt: Date;
}
