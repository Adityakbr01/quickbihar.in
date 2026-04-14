import mongoose, { Schema, Document, Types } from "mongoose";

export enum PaymentProvider {
    RAZORPAY = "RAZORPAY",
    PAYPAL = "PAYPAL",
    STRIPE = "STRIPE",
    OTHER = "OTHER",
}

export interface IPaymentMethod extends Document {
    userId: Types.ObjectId;
    provider: PaymentProvider;
    methodType: string; // e.g., "card", "upi", "wallet"
    last4?: string;     // Last 4 digits of card or VPA identifier
    brand?: string;     // e.g., "visa", "mastercard"
    isDefault: boolean;
    providerToken?: string; // Token from gateway for recurring/saved payments
}

const paymentMethodSchema = new Schema<IPaymentMethod>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        provider: {
            type: String,
            enum: Object.values(PaymentProvider),
            default: PaymentProvider.RAZORPAY,
        },
        methodType: { type: String, required: true },
        last4: { type: String },
        brand: { type: String },
        isDefault: {
            type: Boolean,
            default: false,
        },
        providerToken: { type: String },
    },
    {
        timestamps: true,
    }
);

// Ensure only one default payment method per user
paymentMethodSchema.pre("save", async function () {
    if (this.isDefault) {
        await mongoose.model("PaymentMethod").updateMany(
            { userId: this.userId, _id: { $ne: this._id } },
            { isDefault: false }
        );
    }
});

export const PaymentMethod = mongoose.model<IPaymentMethod>("PaymentMethod", paymentMethodSchema);
