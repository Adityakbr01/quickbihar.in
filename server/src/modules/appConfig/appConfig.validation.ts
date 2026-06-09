import { z } from "zod";

export const updateAppConfigSchema = z.object({
    store: z.object({
        storeName: z.string().optional(),
        appTitle: z.string().optional(),
    }).optional(),
    policies: z.object({
        privacyPolicy: z.string().optional(),
        termsAndConditions: z.string().optional(),
        returnPolicy: z.string().optional(),
        shippingPolicy: z.string().optional(),
    }).optional(),
    contact: z.object({
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().optional(),
        whatsapp: z.string().optional(),
        address: z.string().optional(),
    }).optional(),
    socialLinks: z.object({
        facebook: z.string().url().optional().or(z.literal("")),
        instagram: z.string().url().optional().or(z.literal("")),
        twitter: z.string().url().optional().or(z.literal("")),
        youtube: z.string().url().optional().or(z.literal("")),
    }).optional(),
    seo: z.object({
        metaTitle: z.string().optional(),
        metaDescription: z.string().optional(),
        keywords: z.array(z.string()).optional(),
    }).optional(),
    appearance: z.object({
        logoUrl: z.string().url().optional().or(z.literal("")),
        faviconUrl: z.string().url().optional().or(z.literal("")),
    }).optional(),
    shipping: z.object({
        freeShippingThreshold: z.coerce.number().min(0).optional(),
        shippingFee: z.coerce.number().min(0).optional(),
    }).optional(),
    tax: z.object({
        enabled: z.boolean().optional(),
        rate: z.coerce.number().min(0).max(100).optional(),
        inclusive: z.boolean().optional(),
    }).optional(),
    currency: z.object({
        code: z.string().trim().min(3).max(3).optional(),
        symbol: z.string().trim().max(8).optional(),
    }).optional(),
    delivery: z.object({
        defaultRadiusKm: z.coerce.number().min(0).optional(),
        minOrderAmount: z.coerce.number().min(0).optional(),
        estimatedMinutes: z.coerce.number().min(1).optional(),
        riderPayoutAmount: z.coerce.number().min(0).optional(),
    }).optional(),
});

export type UpdateAppConfigBody = z.infer<typeof updateAppConfigSchema>;
