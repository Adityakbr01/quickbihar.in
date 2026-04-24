import mongoose, { Schema, Types } from "mongoose";
import { DomainEnum } from "../rbac/rbac.types";

const SellerProfileSchema = new Schema({
    userId: {
        type: Types.ObjectId,
        ref: "User",
        unique: true,
    },

    businessName: String,

    gstNumber: String,

    bankDetails: {
        accountNumber: String,
        ifsc: String,
        bankName: String,
        pan: String,
        upi: String,
        aadhar: String,
    },

    address: {
        address: String,
        city: String,
        state: String,
        pincode: String,
    },

    currentLocation: {
        type: {
            type: String,
            enum: ["Point"],
            default: "Point",
        },
        coordinates: {
            type: [Number],
            required: true,
            index: "2dsphere",
        },
    },

    sellerType: {
        type: String,
        enum: [DomainEnum.CLOTHING, DomainEnum.JEWELRY, DomainEnum.FOOD],
    },

    isVerified: { type: Boolean, default: false },

    status: {
        type: String,
        enum: ["PENDING", "APPROVED", "REJECTED"],
    },

}, { timestamps: true });


export const Seller = mongoose.model("Seller", SellerProfileSchema);