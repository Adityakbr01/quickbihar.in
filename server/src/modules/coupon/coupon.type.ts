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
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
