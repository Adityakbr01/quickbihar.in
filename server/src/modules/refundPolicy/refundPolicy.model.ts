import mongoose, { Schema } from "mongoose";
import type { IRefundPolicy } from "./refundPolicy.type";

const refundPolicySchema = new Schema<IRefundPolicy>(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
        },
        category: String,
        description: String,
        returnWindowDays: { type: Number, default: 0 },
        refundProcessingDays: { type: Number, default: 0 },
        conditions: [String],
        refundType: String,
        returnShipping: String,
        isReturnable: { type: Boolean, default: true },
        isExchangeAvailable: { type: Boolean, default: true },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export const RefundPolicy = mongoose.model<IRefundPolicy>("RefundPolicy", refundPolicySchema);
