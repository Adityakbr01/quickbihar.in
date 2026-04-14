import { z } from "zod";

export const addToCartSchema = z.object({
    productId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Product ID"),
    sku: z.string().min(1, "SKU is required"),
    quantity: z.number().int().positive().default(1),
});

export const updateQuantitySchema = z.object({
    sku: z.string().min(1, "SKU is required"),
    quantity: z.number().int().positive(),
});

