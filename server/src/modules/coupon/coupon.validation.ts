import { z } from "zod";
import { DiscountType } from "./coupon.type";

export const couponSchema = z.object({
    code: z.string().min(3).max(20).toUpperCase(),
    description: z.string().min(5),
    discountType: z.nativeEnum(DiscountType),
    discountValue: z.number().positive(),
    minOrderValue: z.number().nonnegative().optional(),
    maxDiscountAmount: z.number().positive().optional(),
    startDate: z.string().optional(),
    endDate: z.string(),
    usageLimit: z.number().int().positive().optional(),
    usageLimitPerUser: z.number().int().positive().optional(),
    isActive: z.boolean().optional(),
});

export const updateCouponSchema = couponSchema.partial();

export const validateCouponSchema = z.object({
    code: z.string(),
    orderAmount: z.number().positive(),
});
