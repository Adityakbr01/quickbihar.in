import mongoose, { Schema, Types } from "mongoose";

/** Per-document verification lifecycle used across all rider KYC documents. */
export const DOCUMENT_STATUS = ["PENDING", "APPROVED", "REJECTED"] as const;

/** Reusable schema fragment for an individually reviewable document status. */
const documentStatusField = () => ({
    type: String,
    enum: DOCUMENT_STATUS,
    default: "PENDING",
});

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

    /**
     * KYC / onboarding documents. Each document carries its own review status so
     * an admin can approve or reject them independently and the rider can be asked
     * to re-upload only the specific document that was rejected.
     */
    documents: {
        drivingLicense: {
            number: String,
            frontUrl: String,
            backUrl: String,
            expiryDate: Date,
            status: documentStatusField(),
            rejectionReason: String,
        },
        aadharCard: {
            number: String,
            frontUrl: String,
            backUrl: String,
            status: documentStatusField(),
            rejectionReason: String,
        },
        panCard: {
            number: String,
            imageUrl: String,
            status: documentStatusField(),
            rejectionReason: String,
        },
        vehicleRC: {
            number: String,
            imageUrl: String,
            status: documentStatusField(),
            rejectionReason: String,
        },
        profilePhoto: {
            imageUrl: String,
            status: documentStatusField(),
        },
    },

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
        collectedCodLiability: {
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
