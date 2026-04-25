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
    storeImages: string[];
    storeVideo?: string;
    type: StoreType;
    address: {
        line1: string;
        city: string;
        state: string;
        pincode: string;
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
}

export interface IFoodStoreConfig extends Document {
    storeId: Types.ObjectId;
    avgPreparationTime?: number;
    isBusy?: boolean;
    cuisines: string[];
    isPureVeg?: boolean;
}

export interface IClothingStoreConfig extends Document {
    storeId: Types.ObjectId;
    availableBrands: string[];
    returnDays?: number;
    hasTrial?: boolean;
}

export interface IJewelryStoreConfig extends Document {
    storeId: Types.ObjectId;
    certifications: string[];
    hasGold?: boolean;
    hasDiamond?: boolean;
    makingChargeType?: string;
}
