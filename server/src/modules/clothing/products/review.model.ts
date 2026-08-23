import mongoose, { Document, Schema, Types } from "mongoose";

export interface IReviewImage {
    url: string;
    fileId?: string;
}

export interface IReview extends Document {
    productId: Types.ObjectId;
    userId: Types.ObjectId;
    rating: number;
    title?: string;
    comment: string;
    images?: IReviewImage[];
    isVerifiedBuyer: boolean;
    helpfulVotes: Types.ObjectId[];
    status: "APPROVED" | "PENDING" | "REJECTED";
    createdAt: Date;
    updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
    {
        productId: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true,
            index: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        title: {
            type: String,
            trim: true,
            maxlength: 120,
        },
        comment: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000,
        },
        images: [
            {
                url: { type: String, required: true },
                fileId: { type: String },
            },
        ],
        isVerifiedBuyer: {
            type: Boolean,
            default: false,
        },
        helpfulVotes: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        status: {
            type: String,
            enum: ["APPROVED", "PENDING", "REJECTED"],
            default: "APPROVED",
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

reviewSchema.index({ productId: 1, createdAt: -1 });
reviewSchema.index({ productId: 1, userId: 1 });

export const Review = mongoose.model<IReview>("Review", reviewSchema);
