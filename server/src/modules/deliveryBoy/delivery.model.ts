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


export const DeliveryBoy = mongoose.model("DeliveryBoy", DeliveryProfileSchema);
