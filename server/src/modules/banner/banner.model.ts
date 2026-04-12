import mongoose, { Schema } from "mongoose";
import type { IBanner } from "./banner.type";



const bannerSchema = new Schema<IBanner>(
    {
        title: {
            type: String,
            trim: true,
        },

        subtitle: {
            type: String,
            trim: true,
        },

        image: {
            type: String,
            required: true,
        },

        // 🔗 Where user will go
        redirectType: {
            type: String,
            enum: ["product", "category", "collection", "external"],
            required: true,
        },

        redirectId: {
            type: Schema.Types.ObjectId,
            refPath: "redirectType",
        },

        externalUrl: {
            type: String,
        },

        // 🎯 Banner placement
        placement: {
            type: String,
            enum: ["home_top", "home_middle", "category"],
            default: "home_top",
        },

        // 🔥 Priority (for ordering)
        priority: {
            type: Number,
            default: 0,
        },

        // ⏳ Schedule control
        startDate: {
            type: Date,
        },

        endDate: {
            type: Date,
        },

        // 👁️ Visibility
        isActive: {
            type: Boolean,
            default: true,
        },

        // 📊 Analytics
        clicks: {
            type: Number,
            default: 0,
        },

        impressions: {
            type: Number,
            default: 0,
        },
        isAds: {
            type: Boolean,
            default: false,
        }
    },
    { timestamps: true }
);

export const Banner = mongoose.model<IBanner>("Banner", bannerSchema);