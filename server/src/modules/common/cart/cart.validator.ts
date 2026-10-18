import { z } from "zod";

export const addToCartSchema = z.object({
    productId: z.string().min(1, "Product ID is required"),
    sku: z.string().min(1, "SKU is required"),
    quantity: z.number().int().positive().default(1),
});

export const updateQuantitySchema = z.object({
    sku: z.string().min(1, "SKU is required"),
    quantity: z.number().int().positive(),
});
export const syncCartSchema = z.object({
    items: z.array(z.object({
        productId: z.string().min(1, "Product ID is required"),
        sku: z.string().min(1, "SKU is required"),
        quantity: z.number().int().positive(),
    })),
});

export const clearCartQuerySchema = z.object({
    module: z.enum(["clothing", "jewelery"]).optional(),
});
