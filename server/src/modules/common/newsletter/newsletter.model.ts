import mongoose, { Schema, Document } from "mongoose";

export interface INewsletterSubscriber extends Document {
    email: string;
    vertical: string;
    source: string;
    createdAt: Date;
    updatedAt: Date;
}

const newsletterSubscriberSchema = new Schema<INewsletterSubscriber>(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        vertical: {
            type: String,
            enum: ["CLOTHING", "FOOD", "JEWELERY"],
            default: "JEWELERY",
        },
        source: { type: String, default: "home-newsletter" },
    },
    {
        timestamps: true,
    }
);

export const NewsletterSubscriber = mongoose.model<INewsletterSubscriber>(
    "NewsletterSubscriber",
    newsletterSubscriberSchema
);
