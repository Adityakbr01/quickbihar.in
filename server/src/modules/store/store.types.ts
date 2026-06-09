import { z } from "zod";
import { Document, Types } from "mongoose";
import {
    createStoreSchema,
    updateStoreSchema,
    searchNearbyStoresSchema,
    StoreType
} from "./store.schema";

export type CreateStoreInput = z.infer<typeof createStoreSchema>;
export type UpdateStoreInput = z.infer<typeof updateStoreSchema>;
export type SearchNearbyStoresInput = z.infer<typeof searchNearbyStoresSchema>;



export interface IStore extends Document {
    sellerId: Types.ObjectId;
    name: string;
    description?: string;
    logoUrl?: string;
    bannerUrl?: string;
    storeImages: string[];
    storeVideo?: string;
    type: StoreType;
    address: {
        line1: string;
        city: string;
        state: string;
        pincode: string;
        country?: string;
        postalCode?: string;
    };
    contact?: {
        email?: string;
        phone?: string;
    };
    categoryConfig?: {
        primaryCategory?: string;
        subcategories?: string[];
        assignedByAdmin?: boolean;
    };
    deliveryConfig?: {
        deliveryAreas?: string[];
        shippingFee?: number;
        freeShippingThreshold?: number;
    };
    seo?: {
        storeTitle?: string;
        metaTitle?: string;
        metaDescription?: string;
    };
    policies?: {
        returnPolicy?: string;
        refundPolicy?: string;
        shippingPolicy?: string;
        termsAndConditions?: string;
    };
    currentLocation: {
        type: "Point";
        coordinates: [number, number];
    };
    isOpen: boolean;
    isActive: boolean;
    isVerified: boolean;
    timings: {
        day: number;
        openTime: string;
        closeTime: string;
        isClosed?: boolean;
    }[];
    deliveryRadiusKm?: number;
    minOrderAmount?: number;
    deliveryFee?: number;
    isSetupComplete?: boolean;
    setupCompletedAt?: Date;
    setupMissingFields?: string[];
}

export interface IClothingStoreConfig extends Document {
    storeId: Types.ObjectId;
    availableBrands: string[];
    returnDays?: number;
    hasTrial?: boolean;
}
