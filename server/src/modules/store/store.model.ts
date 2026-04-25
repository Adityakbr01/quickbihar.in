// store.model.ts
import { Schema, Types, model, type SchemaOptions } from "mongoose";
import {
    type IStore,
    type IFoodStoreConfig,
    type IClothingStoreConfig,
    type IJewelryStoreConfig
} from "./store.types";
import { StoreType } from "./store.schema";

const baseOptions: SchemaOptions = { timestamps: true, versionKey: false };

// 🔹 BASE STORE
const StoreSchema = new Schema<IStore>({
    sellerId: { type: Types.ObjectId, ref: "User", required: true, index: true },

    name: { type: String, required: true },
    description: String,
    storeImages: [String],
    storeVideo: String,

    type: {
        type: String,
        enum: Object.values(StoreType),
        required: true,
        index: true,
    },

    address: {
        line1: String,
        city: String,
        state: String,
        pincode: String,
    },

    // 🔥 GEOJSON
    currentLocation: {
        type: {
            type: String,
            enum: ["Point"],
            default: "Point",
        },
        coordinates: {
            type: [Number],
            required: false,
            index: "2dsphere",
        },
    },

    isOpen: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },

    timings: [
        {
            day: Number,
            openTime: String,
            closeTime: String,
            isClosed: Boolean,
        },
    ],

    deliveryRadiusKm: Number,
    minOrderAmount: Number,
    deliveryFee: Number,
}, baseOptions);

StoreSchema.index({ currentLocation: "2dsphere" });


// 🔹 FOOD CONFIG
const FoodStoreConfigSchema = new Schema<IFoodStoreConfig>({
    storeId: { type: Types.ObjectId, ref: "Store", unique: true },
    avgPreparationTime: Number,
    isBusy: Boolean,
    cuisines: [String],
    isPureVeg: Boolean,
}, baseOptions);


// 🔹 CLOTHING CONFIG
const ClothingStoreConfigSchema = new Schema<IClothingStoreConfig>({
    storeId: { type: Types.ObjectId, ref: "Store", unique: true },
    availableBrands: [String],
    returnDays: Number,
    hasTrial: Boolean,
}, baseOptions);


// 🔹 JEWELRY CONFIG
const JewelryStoreConfigSchema = new Schema<IJewelryStoreConfig>({
    storeId: { type: Types.ObjectId, ref: "Store", unique: true },
    certifications: [String],
    hasGold: Boolean,
    hasDiamond: Boolean,
    makingChargeType: String,
}, baseOptions);

export const Store = model<IStore>("Store", StoreSchema);
export const FoodStoreConfig = model<IFoodStoreConfig>("FoodStoreConfig", FoodStoreConfigSchema);
export const ClothingStoreConfig = model<IClothingStoreConfig>("ClothingStoreConfig", ClothingStoreConfigSchema);
export const JewelryStoreConfig = model<IJewelryStoreConfig>("JewelryStoreConfig", JewelryStoreConfigSchema);