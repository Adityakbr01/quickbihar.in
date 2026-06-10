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
    appliesTo: z.enum(["ALL", "SPECIFIC"]).optional().default("ALL"),
    productIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Product ID")).optional(),
});

export const updateCouponSchema = couponSchema.partial();

export const validateCouponSchema = z.object({
    code: z.string(),
    orderAmount: z.number().positive().optional(),
    items: z.array(z.object({
        productId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Product ID"),
        sku: z.string().min(1, "SKU is required"),
        quantity: z.number().int().min(1),
    })).optional(),
});
