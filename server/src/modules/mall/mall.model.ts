import mongoose, { Schema, Types } from "mongoose";

const MallSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        description: String,
        address: {
            line1: String,
            city: String,
            state: String,
            pincode: String,
        },
        contact: {
            managerName: String,
            phone: String,
            email: String,
        },
        logoUrl: String,
        coverImageUrl: String,
        totalStores: {
            type: Number,
            default: 0,
            min: 0,
        },
        rating: {
            type: Number,
            default: 4.5,
            min: 0,
            max: 5,
        },
        isFeatured: {
            type: Boolean,
            default: false,
            index: true,
        },
        featuredRank: {
            type: Number,
            min: 1,
            max: 10,
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
        status: {
            type: String,
            enum: ["PENDING", "APPROVED", "REJECTED"],
            default: "APPROVED",
            index: true,
        },
        requestedBy: {
            type: Types.ObjectId,
            ref: "User",
        },
        reviewedBy: {
            type: Types.ObjectId,
            ref: "User",
        },
        reviewedAt: Date,
        rejectionReason: String,
        request: {
            mallUnit: String,
            mallFloor: String,
            message: String,
        },
    },
    { timestamps: true, versionKey: false },
);

MallSchema.index({ "address.city": 1, isActive: 1 });
MallSchema.index({ isActive: 1, isFeatured: 1, featuredRank: 1 });

export const Mall = mongoose.model("Mall", MallSchema);
