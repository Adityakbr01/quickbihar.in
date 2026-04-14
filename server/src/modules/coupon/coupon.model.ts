import mongoose, { Schema } from "mongoose";
import { DiscountType, type ICoupon } from "./coupon.type";

const couponSchema = new Schema<ICoupon>(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
        },
        discountType: {
            type: String,
            enum: Object.values(DiscountType),
            default: DiscountType.PERCENTAGE,
        },
        discountValue: {
            type: Number,
            required: true,
        },
        minOrderValue: {
            type: Number,
            default: 0,
        },
        maxDiscountAmount: {
            type: Number,
        },
        startDate: {
            type: Date,
            required: true,
            default: Date.now,
        },
        endDate: {
            type: Date,
            required: true,
        },
        usageLimit: {
            type: Number,
            default: 100,
        },
        usedCount: {
            type: Number,
            default: 0,
        },
        usageLimitPerUser: {
            type: Number,
            default: 1,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

// Virtual for checking if the coupon is expired
couponSchema.virtual("isExpired").get(function () {
    return Date.now() > this.endDate.getTime();
});

// Ensure virtuals are included in JSON
couponSchema.set("toJSON", { virtuals: true });
couponSchema.set("toObject", { virtuals: true });

export const Coupon = mongoose.model<ICoupon>("Coupon", couponSchema);
