import mongoose, { Schema, Types } from "mongoose";

const DeliveryProfileSchema = new Schema({
    userId: {
        type: Types.ObjectId,
        ref: "User",
        unique: true,
    },

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
                enum: ["BANK", "UPI"],
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

    address: {
        address: String,
        city: String,
        state: String,
        pincode: String,
    },

    vehicleType: String,
    vehicleNumber: String,

    licenseNumber: String,

    isVerified: { type: Boolean, default: false },

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

    status: {
        type: String,
        enum: ["PENDING", "APPROVED", "REJECTED"],
        default: "PENDING",
    },

    isOnline: { type: Boolean, default: false },

    currentLocation: {
        type: {
            type: String,
            enum: ["Point"],
            default: "Point",
        },
        coordinates: {
            type: [Number],
            index: "2dsphere",
        },
    }
}, { timestamps: true });

DeliveryProfileSchema.index({ currentLocation: "2dsphere" });


export const DeliveryBoy = mongoose.model("DeliveryBoy", DeliveryProfileSchema);
