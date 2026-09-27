export enum DiscountType {
    PERCENTAGE = "PERCENTAGE",
    FIXED = "FIXED",
}

export interface ICoupon {
    _id: string;
    code: string;
    description: string;
    discountType: DiscountType;
    discountValue: number;
    minOrderValue: number;
    maxDiscountAmount?: number;
    startDate: string;
    endDate: string;
    usageLimit: number;
    usedCount: number;
    usageLimitPerUser: number;
    isActive: boolean;
    isExpired?: boolean;
    scope?: "GLOBAL" | "SELLER";
    sellerId?: string;
    storeId?: string;
    appliesTo?: "ALL" | "SPECIFIC";
    productIds?: string[];
    showOnCart?: boolean;
    appliedDiscount?: number;
    createdAt: string;
    updatedAt: string;
}
