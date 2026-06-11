import mongoose, { Schema } from "mongoose";
import type { IAppConfig } from "./appConfig.type";
import { ENV } from "../../config/env.config";

const appConfigSchema = new Schema<IAppConfig>(
    {
        store: {
            storeName: { type: String, default: "QuickBihar Fashion" },
            appTitle: { type: String, default: "QuickBihar" },
        },
        policies: {
            privacyPolicy: { type: String, default: "" },
            termsAndConditions: { type: String, default: "" },
            returnPolicy: { type: String, default: "" },
            shippingPolicy: { type: String, default: "" },
        },
        contact: {
            email: { type: String, default: "" },
            phone: { type: String, default: "" },
            whatsapp: { type: String, default: "" },
            address: { type: String, default: "" },
        },
        socialLinks: {
            facebook: { type: String, default: "" },
            instagram: { type: String, default: "" },
            twitter: { type: String, default: "" },
            youtube: { type: String, default: "" },
        },
        seo: {
            metaTitle: { type: String, default: "Quick Bihar" },
            metaDescription: { type: String, default: "" },
            keywords: { type: [String], default: [] },
        },
        appearance: {
            logoUrl: { type: String, default: "" },
            faviconUrl: { type: String, default: "" },
        },
        shipping: {
            freeShippingThreshold: { type: Number, default: 2000 },
            shippingFee: { type: Number, default: 99 },
        },
        tax: {
            enabled: { type: Boolean, default: false },
            rate: { type: Number, default: 0 },
            inclusive: { type: Boolean, default: true },
        },
        currency: {
            code: { type: String, default: "INR" },
            symbol: { type: String, default: "Rs." },
        },
        marketplace: {
            commissionPercent: { type: Number, default: ENV.MARKETPLACE_COMMISSION_PERCENT },
        },
        delivery: {
            defaultRadiusKm: { type: Number, default: 5 },
            minOrderAmount: { type: Number, default: 0 },
            estimatedMinutes: { type: Number, default: 45 },
            riderPayoutAmount: { type: Number, default: 40 },
            riderPayoutRules: {
                upto3Km: { type: Number, default: ENV.RIDER_PAYOUT_UPTO_3_KM },
                upto5Km: { type: Number, default: ENV.RIDER_PAYOUT_UPTO_5_KM },
                upto8Km: { type: Number, default: ENV.RIDER_PAYOUT_UPTO_8_KM },
                extraPerKmAfter8: { type: Number, default: ENV.RIDER_PAYOUT_EXTRA_PER_KM_AFTER_8 },
                rainBonus: { type: Number, default: ENV.RIDER_PAYOUT_RAIN_BONUS },
                peakBonus: { type: Number, default: ENV.RIDER_PAYOUT_PEAK_BONUS },
                festivalBonus: { type: Number, default: ENV.RIDER_PAYOUT_FESTIVAL_BONUS },
                nightBonus: { type: Number, default: ENV.RIDER_PAYOUT_NIGHT_BONUS },
            },
            bonusRules: {
                rainBonus: { type: Number, default: ENV.RIDER_PAYOUT_RAIN_BONUS },
                peakBonus: { type: Number, default: ENV.RIDER_PAYOUT_PEAK_BONUS },
                festivalBonus: { type: Number, default: ENV.RIDER_PAYOUT_FESTIVAL_BONUS },
                nightBonus: { type: Number, default: ENV.RIDER_PAYOUT_NIGHT_BONUS },
                rainMode: { type: String, enum: ["AUTO", "FORCE_ON", "FORCE_OFF"], default: "AUTO" },
                peakMode: { type: String, enum: ["AUTO", "FORCE_ON", "FORCE_OFF"], default: "AUTO" },
                festivalMode: { type: String, enum: ["AUTO", "FORCE_ON", "FORCE_OFF"], default: "AUTO" },
                nightMode: { type: String, enum: ["AUTO", "FORCE_ON", "FORCE_OFF"], default: "AUTO" },
                peakWindows: {
                    type: [{
                        start: { type: String, default: "18:00" },
                        end: { type: String, default: "21:00" },
                    }],
                    default: [{ start: "18:00", end: "21:00" }],
                },
                festivalWindows: {
                    type: [{
                        name: { type: String, default: "" },
                        startDate: { type: String, default: "" },
                        endDate: { type: String, default: "" },
                    }],
                    default: [],
                },
                nightStart: { type: String, default: "22:00" },
                nightEnd: { type: String, default: "06:00" },
            },
        },
        updatedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

// This ensures only one document can exist in the collection
// But for simplicity, we'll just handle it in the DAO/Service
export const AppConfig = mongoose.model<IAppConfig>("AppConfig", appConfigSchema);
