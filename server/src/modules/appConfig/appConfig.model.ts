import mongoose, { Schema } from "mongoose";
import type { IAppConfig } from "./appConfig.type";

const appConfigSchema = new Schema<IAppConfig>(
    {
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
