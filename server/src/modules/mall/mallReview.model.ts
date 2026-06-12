import mongoose, { Schema } from "mongoose";

const MallReviewSchema = new Schema(
    {
        mallId: {
            type: Schema.Types.ObjectId,
            ref: "Mall",
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
        comment: {
            type: String,
            trim: true,
            maxlength: 500,
        },
    },
    { timestamps: true, versionKey: false }
);

// Enforce one review per user per mall
MallReviewSchema.index({ mallId: 1, userId: 1 }, { unique: true });

export const MallReview = mongoose.model("MallReview", MallReviewSchema);
