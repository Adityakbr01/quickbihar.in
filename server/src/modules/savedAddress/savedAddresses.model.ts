import mongoose, { Schema, Document, Types } from "mongoose";

export enum AddressType {
    HOME = "HOME",
    WORK = "WORK",
    OTHER = "OTHER",
}

export interface ISavedAddress extends Document {
    userId: Types.ObjectId;
    fullName: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
    addressType: AddressType;
    isDefault: boolean;
}

const savedAddressSchema = new Schema<ISavedAddress>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        fullName: { type: String, required: true, trim: true },
        phone: { type: String, required: true, trim: true },
        street: { type: String, required: true, trim: true },
        city: { type: String, required: true, trim: true },
        state: { type: String, required: true, trim: true },
        pincode: { type: String, required: true, trim: true },
        landmark: { type: String, trim: true },
        addressType: {
            type: String,
            enum: Object.values(AddressType),
            default: AddressType.HOME,
        },
        isDefault: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Ensure only one default address per user
savedAddressSchema.pre("save", async function () {
    if (this.isDefault) {
        await mongoose.model("SavedAddress").updateMany(
            { userId: this.userId, _id: { $ne: this._id } },
            { isDefault: false }
        );
    }
});

export const SavedAddress = mongoose.model<ISavedAddress>("SavedAddress", savedAddressSchema);
