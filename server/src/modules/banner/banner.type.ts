import mongoose, { Schema, Document } from "mongoose";


export interface IBanner extends Document {
    title?: string;
    subtitle?: string;
    image: string;
    imagePublicId: string;
    redirectType: "product" | "category" | "collection" | "external";
    redirectId?: mongoose.Types.ObjectId;
    externalUrl?: string;
    placement: "home_top" | "home_middle" | "category";
    priority: number;
    startDate?: Date;
    endDate?: Date;
    isActive: boolean;
    clicks: number;
    impressions: number;
    isAds: boolean;
    scope?: "GLOBAL" | "SELLER";
    sellerId?: mongoose.Types.ObjectId;
    storeId?: mongoose.Types.ObjectId;
    approvalStatus?: "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "REJECTED";
    reviewedBy?: mongoose.Types.ObjectId;
    reviewedAt?: Date;
    rejectionReason?: string;
}
