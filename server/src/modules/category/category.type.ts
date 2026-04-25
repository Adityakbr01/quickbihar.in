import { Document } from "mongoose";

export interface ICategory extends Document {
    title: string;
    slug: string;
    image: string;
    imagePublicId: string;
    priority: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
