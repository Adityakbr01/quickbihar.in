import mongoose, { Schema, Types } from "mongoose";

const AdminPayoutSchema = new Schema(
    {
        partnerId: {
            type: Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        partnerType: {
            type: String,
            enum: ["SELLER", "DELIVERY"],
            required: true,
            index: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        status: {
            type: String,
            enum: ["PENDING", "PROCESSING", "PAID", "FAILED"],
            default: "PENDING",
            index: true,
        },
        method: String,
        payoutMethodId: {
            type: Types.ObjectId,
        },
        referenceId: String,
        note: String,
        requestedBy: {
            type: Types.ObjectId,
            ref: "User",
            required: true,
        },
        processedBy: {
            type: Types.ObjectId,
            ref: "User",
        },
        processedAt: Date,
    },
    { timestamps: true, versionKey: false },
);

AdminPayoutSchema.index({ partnerId: 1, createdAt: -1 });

export const AdminPayout = mongoose.model("AdminPayout", AdminPayoutSchema);
