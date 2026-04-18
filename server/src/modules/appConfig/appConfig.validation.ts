import { z } from "zod";

export const updateAppConfigSchema = z.object({
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
});

export type UpdateAppConfigBody = z.infer<typeof updateAppConfigSchema>;
