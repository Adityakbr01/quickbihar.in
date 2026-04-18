import mongoose, { Schema } from "mongoose";
import { type IOrder, OrderStatus } from "./order.type";

const orderItemSchema = new Schema(
    {
        productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        title: { type: String, required: true },
        sku: { type: String, required: true },
        size: { type: String, required: true },
        color: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true },
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
        paymentInfo: {
            razorpayOrderId: { type: String, required: true },
            razorpayPaymentId: { type: String },
            razorpaySignature: { type: String },
        },
        couponCode: { type: String },
    },
    {
        timestamps: true,
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

export const Order = mongoose.model<IOrder>("Order", orderSchema);
