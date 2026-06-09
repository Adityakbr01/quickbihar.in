import { Schema, Types, model, type SchemaOptions } from "mongoose";
import {
    type IStore,
    type IClothingStoreConfig
} from "./store.types";
import { StoreType } from "./store.schema";

const baseOptions: SchemaOptions = { timestamps: true, versionKey: false };

const StoreSchema = new Schema<IStore>({
    sellerId: { type: Types.ObjectId, ref: "User", required: true, index: true },

    name: { type: String, required: true },
    description: String,
    logoUrl: String,
    bannerUrl: String,
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
        country: { type: String, default: "India" },
        postalCode: String,
    },

    contact: {
        email: String,
        phone: String,
    },

    categoryConfig: {
        primaryCategory: String,
        subcategories: [String],
        assignedByAdmin: {
            type: Boolean,
            default: false,
        },
    },

    deliveryConfig: {
        deliveryAreas: [String],
        shippingFee: Number,
        freeShippingThreshold: Number,
    },

    seo: {
        storeTitle: String,
        metaTitle: String,
        metaDescription: String,
    },

    policies: {
        returnPolicy: String,
        refundPolicy: String,
        shippingPolicy: String,
        termsAndConditions: String,
    },

    policyRefs: {
        returnPolicy: { type: Types.ObjectId, ref: "RefundPolicy" },
        refundPolicy: { type: Types.ObjectId, ref: "RefundPolicy" },
        shippingPolicy: { type: Types.ObjectId, ref: "RefundPolicy" },
        termsPolicy: { type: Types.ObjectId, ref: "RefundPolicy" },
    },

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

    isSetupComplete: { type: Boolean, default: false, index: true },
    setupCompletedAt: Date,
    setupMissingFields: [String],
}, baseOptions);

StoreSchema.index({ currentLocation: "2dsphere" });

const ClothingStoreConfigSchema = new Schema<IClothingStoreConfig>({
    storeId: { type: Types.ObjectId, ref: "Store", unique: true },
    availableBrands: [String],
    returnDays: Number,
    hasTrial: Boolean,
}, baseOptions);

export const Store = model<IStore>("Store", StoreSchema);
export const ClothingStoreConfig = model<IClothingStoreConfig>("ClothingStoreConfig", ClothingStoreConfigSchema);
