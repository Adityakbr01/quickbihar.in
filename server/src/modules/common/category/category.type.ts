import { Document } from "mongoose";

export interface ICategory extends Document {
    title: string;
    slug: string;
    image: string;
    imagePublicId: string;
    banner?: string;
    bannerPublicId?: string;
    description?: string;
    parentId?: string;
    priority: number;
    sortOrder?: number;
    isActive: boolean;
    isFeatured: boolean;
    seo?: {
        metaTitle?: string;
        metaDescription?: string;
        keywords?: string[];
    };
    createdAt: Date;
    updatedAt: Date;
}
