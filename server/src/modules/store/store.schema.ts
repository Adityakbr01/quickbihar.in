// store.schema.ts
import { z } from "zod";

export enum StoreType {
    CLOTHING = "CLOTHING",
    JEWELRY = "JEWELRY",
    FOOD = "FOOD",
}

export const createStoreSchema = z.object({
    name: z.string(),
    type: z.nativeEnum(StoreType),

    address: z.object({
        line1: z.string(),
        city: z.string(),
        state: z.string(),
        pincode: z.string(),
    }),

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
