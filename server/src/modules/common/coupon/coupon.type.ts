export enum DiscountType {
    PERCENTAGE = "PERCENTAGE",
    FIXED = "FIXED",
}

export enum CouponStatus {
    ACTIVE = "ACTIVE",
    EXPIRED = "EXPIRED",
    INACTIVE = "INACTIVE",
}

export interface ICoupon {
    _id: string;
    code: string;
    description: string;
    discountType: DiscountType;
    discountValue: number;
    minOrderValue: number;
    maxDiscountAmount?: number;
    startDate: Date;
    endDate: Date;
    usageLimit: number;
    usedCount: number;
    usageLimitPerUser: number;
    scope?: "GLOBAL" | "SELLER";
    sellerId?: string;
    storeId?: string;
    approvalStatus?: "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "REJECTED";
    reviewedBy?: string;
    reviewedAt?: Date;
    rejectionReason?: string;
    appliesTo?: "ALL" | "SPECIFIC";
    productIds?: string[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
