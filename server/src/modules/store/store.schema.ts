// store.schema.ts
import { z } from "zod";

export enum StoreType {
    CLOTHING = "CLOTHING",
}

const optionalText = z.string().trim().optional();
const optionalUrl = z.string().trim().url().optional().or(z.literal(""));

const contactSchema = z.object({
    email: z.string().trim().email().optional().or(z.literal("")),
    phone: optionalText,
});

const categoryConfigSchema = z.object({
    primaryCategory: z.string().trim().min(1).optional(),
    subcategories: z.array(z.string().trim().min(1)).optional(),
    assignedByAdmin: z.boolean().optional(),
});

const deliveryConfigSchema = z.object({
    deliveryAreas: z.array(z.string().trim().min(1)).optional(),
    shippingFee: z.coerce.number().min(0).optional(),
    freeShippingThreshold: z.coerce.number().min(0).optional(),
});

const seoSchema = z.object({
    storeTitle: optionalText,
    metaTitle: optionalText,
    metaDescription: optionalText,
});

const policiesSchema = z.object({
    returnPolicy: optionalText,
    refundPolicy: optionalText,
    shippingPolicy: optionalText,
    termsAndConditions: optionalText,
});

export const createStoreSchema = z.object({
    name: z.string().trim().min(2, "Store name is required"),
    description: optionalText,
    logoUrl: optionalUrl,
    bannerUrl: optionalUrl,
    storeImages: z.array(z.string().trim()).optional(),
    storeVideo: optionalUrl,
    type: z.nativeEnum(StoreType),

    address: z.object({
        line1: z.string().trim().min(1),
        city: z.string().trim().min(1),
        state: z.string().trim().min(1),
        pincode: z.string().trim().min(1),
        country: z.string().trim().optional().default("India"),
        postalCode: z.string().trim().optional(),
    }),

    contact: contactSchema.optional(),
    categoryConfig: categoryConfigSchema.optional(),
    deliveryConfig: deliveryConfigSchema.optional(),
    seo: seoSchema.optional(),
    policies: policiesSchema.optional(),

    currentLocation: z.object({
        lng: z.number(),
        lat: z.number(),
    }),

    timings: z.array(
        z.object({
            day: z.number().min(0).max(6),
            openTime: z.string(),
            closeTime: z.string(),
            isClosed: z.boolean().optional(),
        })
    ),

    deliveryRadiusKm: z.number(),
    minOrderAmount: z.number(),
    deliveryFee: z.number(),

    config: z.any().optional(), // domain specific
});

export const updateStoreSchema = createStoreSchema.partial();

export const searchNearbyStoresSchema = z.object({
    lng: z.coerce.number({ message: "Longitude (lng) is required and must be a valid number" }),
    lat: z.coerce.number({ message: "Latitude (lat) is required and must be a valid number" }),
    radius: z.coerce.number().optional().default(5), // default 5km
    type: z.nativeEnum(StoreType).optional().default(StoreType.CLOTHING),
    isOpen: z.string().optional().default("true").transform((val) => val !== "false"),
});

export const toggleStoreStatusSchema = z.object({
    isOpen: z.boolean(),
});

export const verifyStoreSchema = z.object({
    isVerified: z.boolean(),
});
