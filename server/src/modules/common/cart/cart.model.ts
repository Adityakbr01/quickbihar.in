import mongoose, { Schema, Document, Types } from "mongoose";

export interface ICartItem {
    productId: Types.ObjectId;
    sku: string; // SKU is important for variants (size/color)
    quantity: number;
}

export interface ICart extends Document {
    userId: Types.ObjectId;
    items: ICartItem[];
    updatedAt: Date;
    createdAt: Date;
}

const cartItemSchema = new Schema<ICartItem>(
    {
        productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        sku: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1, default: 1 },
    },
    { _id: false }
);

const cartSchema = new Schema<ICart>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true,
        },
        items: [cartItemSchema],
    },
    {
        timestamps: true,
    }
);

/**
 * Cart Expiry: 30 days of inactivity.
 * Mongoose TTL index on 'updatedAt' field.
 * 30 days = 30 * 24 * 60 * 60 = 2,592,000 seconds.
 */
cartSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 2592000 });

export const Cart = mongoose.model<ICart>("Cart", cartSchema);