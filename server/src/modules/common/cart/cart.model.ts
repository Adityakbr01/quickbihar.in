import mongoose, { Schema, Document, Types } from "mongoose";

/** Storefront cart modules. One user cart holds lines for every module; each line is tagged so clothing and jewelery bags stay separate. */
export const CART_MODULES = ["clothing", "jewelery"] as const;
export type CartModule = (typeof CART_MODULES)[number];

export interface ICartItem {
    productId: Types.ObjectId;
    sku: string; // SKU is important for variants (size/color)
    quantity: number;
    /**
     * Module that owns this line. Optional so pre-module legacy lines keep
     * working — the service derives it from the product vertical on read and
     * backfills it on write.
     */
    module?: CartModule;
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
        module: { type: String, enum: CART_MODULES, required: false },
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