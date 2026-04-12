import mongoose, { Schema } from "mongoose";
import type { ICategory } from "./category.type";

const categorySchema = new Schema<ICategory>(
    {
        title: {
            type: String,
            required: [true, "Category title is required"],
            trim: true,
            unique: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        image: {
            type: String,
            required: [true, "Category image is required"],
        },
        imagePublicId: {
            type: String,
            required: [true, "Image public ID is required"],
        },
        priority: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

export const Category = mongoose.model<ICategory>("Category", categorySchema);
