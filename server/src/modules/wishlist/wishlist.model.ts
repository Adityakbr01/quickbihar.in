import mongoose, { Schema, Document, Types } from "mongoose";

export interface IWishlist extends Document {
    userId: Types.ObjectId;
    productId: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const wishlistSchema = new Schema<IWishlist>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        productId: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Prevent duplicate entries for the same product in a user's wishlist
wishlistSchema.index({ userId: 1, productId: 1 }, { unique: true });

export const Wishlist = mongoose.model<IWishlist>("Wishlist", wishlistSchema);
