import mongoose, { Schema, Types } from "mongoose";
import { StoreType } from "../store/store.schema";

const SellerProfileSchema = new Schema({
    userId: {
        type: Types.ObjectId,
        ref: "User",
        unique: true,
    },

    businessName: String,

    mallId: {
        type: Types.ObjectId,
        ref: "Mall",
        index: true,
    },

    mallUnit: String,

    mallFloor: String,

    mallRequest: {
        mallId: {
            type: Types.ObjectId,
            ref: "Mall",
        },
        mallUnit: String,
        mallFloor: String,
        message: String,
        status: {
            type: String,
            enum: ["PENDING", "APPROVED", "REJECTED"],
        },
        requestedAt: Date,
        reviewedBy: {
            type: Types.ObjectId,
            ref: "User",
        },
        reviewedAt: Date,
        rejectionReason: String,
    },

    gstNumber: String,

    bankDetails: {
        accountNumber: String,
        ifsc: String,
        bankName: String,
        pan: String,
        upi: String,
        aadhar: String,
    },

    payoutMethods: [
        {
            type: {
                type: String,
                enum: ["BANK", "UPI", "PAYPAL", "STRIPE_CONNECT"],
                required: true,
            },
            label: String,
            status: {
                type: String,
                enum: ["PENDING_VERIFICATION", "VERIFIED", "REJECTED"],
                default: "PENDING_VERIFICATION",
                index: true,
            },
            isDefault: {
                type: Boolean,
                default: false,
            },
            bank: {
                accountHolderName: String,
                accountNumber: String,
                ifsc: String,
                bankName: String,
            },
            upi: {
                upiId: String,
            },
            paypal: {
                email: String,
            },
            stripeConnect: {
                accountId: String,
            },
            rejectionReason: String,
            verifiedBy: {
                type: Types.ObjectId,
                ref: "User",
            },
            verifiedAt: Date,
            createdAt: {
                type: Date,
                default: Date.now,
            },
        },
    ],

    wallet: {
        availableBalance: {
            type: Number,
            default: 0,
            min: 0,
        },
        pendingPayoutBalance: {
            type: Number,
            default: 0,
            min: 0,
        },
        lifetimeEarnings: {
            type: Number,
            default: 0,
            min: 0,
        },
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
            required: false,
            index: "2dsphere",
        },
    },

    sellerType: {
        type: String,
        enum: [StoreType.CLOTHING],
    },

    isVerified: { type: Boolean, default: false },

    status: {
        type: String,
        enum: ["PENDING", "APPROVED", "REJECTED"],
    },

}, { timestamps: true });

SellerProfileSchema.index({ currentLocation: "2dsphere" });


export const Seller = mongoose.model("Seller", SellerProfileSchema);
