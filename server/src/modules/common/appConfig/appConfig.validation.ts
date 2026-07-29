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
    marketplace: z.object({
        commissionPercent: z.coerce.number().min(0).max(100).optional(),
    }).optional(),
    delivery: z.object({
        defaultRadiusKm: z.coerce.number().min(0).optional(),
        minOrderAmount: z.coerce.number().min(0).optional(),
        estimatedMinutes: z.coerce.number().min(1).optional(),
        riderPayoutAmount: z.coerce.number().min(0).optional(),
        riderPayoutRules: z.object({
            upto3Km: z.coerce.number().min(0).optional(),
            upto5Km: z.coerce.number().min(0).optional(),
            upto8Km: z.coerce.number().min(0).optional(),
            extraPerKmAfter8: z.coerce.number().min(0).optional(),
            rainBonus: z.coerce.number().min(0).optional(),
            peakBonus: z.coerce.number().min(0).optional(),
            festivalBonus: z.coerce.number().min(0).optional(),
            nightBonus: z.coerce.number().min(0).optional(),
        }).optional(),
        bonusRules: z.object({
            rainBonus: z.coerce.number().min(0).optional(),
            peakBonus: z.coerce.number().min(0).optional(),
            festivalBonus: z.coerce.number().min(0).optional(),
            nightBonus: z.coerce.number().min(0).optional(),
            rainMode: z.enum(["AUTO", "FORCE_ON", "FORCE_OFF"]).optional(),
            peakMode: z.enum(["AUTO", "FORCE_ON", "FORCE_OFF"]).optional(),
            festivalMode: z.enum(["AUTO", "FORCE_ON", "FORCE_OFF"]).optional(),
            nightMode: z.enum(["AUTO", "FORCE_ON", "FORCE_OFF"]).optional(),
            peakWindows: z.array(z.object({
                start: z.string().regex(/^\d{2}:\d{2}$/),
                end: z.string().regex(/^\d{2}:\d{2}$/),
            })).optional(),
            festivalWindows: z.array(z.object({
                name: z.string().trim().optional(),
                startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
                endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            })).optional(),
            nightStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
            nightEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
        }).optional(),
    }).optional(),
});

export type UpdateAppConfigBody = z.infer<typeof updateAppConfigSchema>;
