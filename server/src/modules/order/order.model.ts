import mongoose, { Schema } from "mongoose";
import { DeliveryStatus, type IOrder, OrderStatus } from "./order.type";

const orderItemSchema = new Schema(
    {
        productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        title: { type: String, required: true },
        sku: { type: String, required: true },
        size: { type: String, required: true },
        color: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true },
        sellerId: { type: Schema.Types.ObjectId, ref: "User", index: true },
        storeId: { type: Schema.Types.ObjectId, ref: "Store", index: true },
        sellerSubtotal: { type: Number, default: 0 },
        settlementStatus: {
            type: String,
            enum: ["PENDING", "AVAILABLE", "PAID", "REVERSED"],
            default: "PENDING",
        },
        pickupLocation: { type: String },
        warehouseName: { type: String },
        latitude: { type: Number },
        longitude: { type: Number },
    },
    { _id: false }
);

const shippingAddressSchema = new Schema(
    {
        fullName: { type: String, required: true },
        phone: { type: String, required: true },
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        pincode: { type: String, required: true },
        landmark: { type: String },
        latitude: { type: Number },
        longitude: { type: Number },
    },
    { _id: false }
);

const deliveryLocationSchema = new Schema(
    {
        latitude: { type: Number },
        longitude: { type: Number },
        heading: { type: Number, default: 0 },
        updatedAt: { type: Date },
    },
    { _id: false }
);

const deliveryEventSchema = new Schema(
    {
        status: {
            type: String,
            enum: Object.values(DeliveryStatus),
            required: true,
        },
        action: { type: String, required: true },
        note: { type: String },
        actorId: { type: Schema.Types.ObjectId, ref: "User" },
        at: { type: Date, default: Date.now },
        location: deliveryLocationSchema,
    },
    { _id: false }
);

const orderSchema = new Schema<IOrder>(
    {
        orderId: {
            type: String,
            required: true,
            unique: true,
            index: true,
            uppercase: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        items: {
            type: [orderItemSchema],
            required: true,
        },
        totalAmount: { type: Number, required: true },
        mrpTotal: { type: Number, required: true },
        productDiscount: { type: Number, default: 0 },
        discountAmount: { type: Number, default: 0 },
        shippingFee: { type: Number, default: 0, required: false },
        totalTax: { type: Number, default: 0 },
        payableAmount: { type: Number, required: true },
        shippingAddress: {
            type: shippingAddressSchema,
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(OrderStatus),
            default: OrderStatus.PENDING_PAYMENT,
        },
        delivery: {
            partnerUserId: {
                type: Schema.Types.ObjectId,
                ref: "User",
                index: true,
            },
            partnerProfileId: {
                type: Schema.Types.ObjectId,
                ref: "DeliveryBoy",
                index: true,
            },
            status: {
                type: String,
                enum: Object.values(DeliveryStatus),
                default: DeliveryStatus.UNASSIGNED,
                index: true,
            },
            otp: {
                code: String,
                generatedAt: Date,
                verifiedAt: Date,
            },
            payoutAmount: { type: Number, default: 0, min: 0 },
            payoutCreditedAt: Date,
            assignedAt: Date,
            acceptedAt: Date,
            pickedUpAt: Date,
            outForDeliveryAt: Date,
            deliveredAt: Date,
            cancelledAt: Date,
            currentLocation: deliveryLocationSchema,
            events: {
                type: [deliveryEventSchema],
                default: [],
            },
        },
        cancellationReason: { type: String },
        rejectedAt: { type: Date },
        cancelledAt: { type: Date },
        refundedAt: { type: Date },
        paymentInfo: {
            razorpayOrderId: { type: String, required: true },
            razorpayPaymentId: { type: String },
            razorpaySignature: { type: String },
        },
        couponCode: { type: String },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Pre-save hook to generate user-friendly Order ID (QB-XXXXX)
orderSchema.pre("validate", async function () {
    if (!this.orderId) {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(1000 + Math.random() * 9000);
        this.orderId = `QB-${timestamp}${random}`;
    }
});

orderSchema.virtual("deliveryPartner").get(function () {
    return this.delivery?.partnerUserId || null;
});

orderSchema.virtual("deliveryPartnerLocation").get(function () {
    return this.delivery?.currentLocation || null;
});

orderSchema.virtual("deliveryOtp").get(function () {
    return this.delivery?.otp?.code || null;
});

orderSchema.index({ "delivery.partnerUserId": 1, createdAt: -1 });
orderSchema.index({ "delivery.status": 1, createdAt: -1 });

export const Order = mongoose.model<IOrder>("Order", orderSchema);
