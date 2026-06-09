import { z } from "zod";

const mongoIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

const optionalText = z.string().trim().optional();
const optionalUrl = z.string().trim().url().optional().or(z.literal(""));
const boolFromForm = z.preprocess((val) => val === "true" || val === true, z.boolean());

const parseJson = (value: unknown) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    try {
        return JSON.parse(trimmed);
    } catch {
        return value;
    }
};

const stringArraySchema = z.preprocess(
    (value) => {
        const parsed = parseJson(value);
        if (typeof parsed === "string") {
            return parsed.split(",").map((item) => item.trim()).filter(Boolean);
        }
        return parsed;
    },
    z.array(z.string().trim().min(1)).optional(),
);

const dateFromForm = z.preprocess((value) => {
    if (!value) return undefined;
    return new Date(String(value));
}, z.date().optional());

export const sellerListQuerySchema = z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    search: z.string().trim().optional(),
    status: z.string().trim().optional(),
    approvalStatus: z.enum(["DRAFT", "PENDING_REVIEW", "APPROVED", "REJECTED", "ALL"]).optional(),
    sortBy: z.string().trim().optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
    dateFrom: z.string().trim().optional(),
    dateTo: z.string().trim().optional(),
});

export const sellerStoreSchema = z.object({
    name: z.string().trim().min(2, "Store name is required").optional(),
    description: optionalText,
    logoUrl: optionalUrl,
    bannerUrl: optionalUrl,
    storeImages: stringArraySchema,
    storeVideo: optionalUrl,
    address: z.object({
        line1: optionalText,
        city: optionalText,
        state: optionalText,
        pincode: optionalText,
        country: optionalText,
        postalCode: optionalText,
    }).optional(),
    contact: z.object({
        email: z.string().trim().email().optional().or(z.literal("")),
        phone: optionalText,
    }).optional(),
    categoryConfig: z.object({
        primaryCategory: optionalText,
        subcategories: stringArraySchema,
    }).optional(),
    deliveryConfig: z.object({
        deliveryAreas: stringArraySchema,
        shippingFee: z.coerce.number().min(0).optional(),
        freeShippingThreshold: z.coerce.number().min(0).optional(),
    }).optional(),
    seo: z.object({
        storeTitle: optionalText,
        metaTitle: optionalText,
        metaDescription: optionalText,
    }).optional(),
    policies: z.object({
        returnPolicy: optionalText,
        refundPolicy: optionalText,
        shippingPolicy: optionalText,
        termsAndConditions: optionalText,
    }).optional(),
    timings: z.preprocess(parseJson, z.array(z.object({
        day: z.coerce.number().min(0).max(6),
        openTime: z.string(),
        closeTime: z.string(),
        isClosed: z.boolean().optional(),
    })).optional()),
    deliveryRadiusKm: z.coerce.number().min(0).optional(),
    minOrderAmount: z.coerce.number().min(0).optional(),
    deliveryFee: z.coerce.number().min(0).optional(),
});

export const sellerStoreToggleSchema = z.object({
    isOpen: boolFromForm,
});

export const sellerStockUpdateSchema = z.object({
    productId: mongoIdSchema,
    sku: z.string().trim().min(1),
    stock: z.coerce.number().int().min(0),
    reason: z.string().trim().max(300).optional(),
});

export const sellerOrderStatusSchema = z.object({
    status: z.enum(["CONFIRMED", "PROCESSING", "SHIPPED"]),
    note: z.string().trim().max(300).optional(),
});

export const sellerCouponSchema = z.object({
    code: z.string().trim().min(2).max(40),
    description: z.string().trim().min(1),
    discountType: z.enum(["PERCENTAGE", "FIXED"]),
    discountValue: z.coerce.number().positive(),
    minOrderValue: z.coerce.number().min(0).optional(),
    maxDiscountAmount: z.coerce.number().min(0).optional(),
    startDate: dateFromForm,
    endDate: dateFromForm,
    usageLimit: z.coerce.number().int().min(1).optional(),
    usageLimitPerUser: z.coerce.number().int().min(1).optional(),
    isActive: boolFromForm.optional(),
});

export const sellerBannerSchema = z.object({
    title: z.string().trim().max(120).optional(),
    subtitle: z.string().trim().max(240).optional(),
    image: optionalUrl,
    imagePublicId: z.string().trim().optional(),
    redirectType: z.enum(["product", "category", "collection", "external"]).default("external"),
    redirectId: mongoIdSchema.optional(),
    externalUrl: z.string().trim().url().optional().or(z.literal("")),
    placement: z.enum(["home_top", "home_middle", "category"]).default("home_top"),
    priority: z.coerce.number().int().optional(),
    startDate: dateFromForm,
    endDate: dateFromForm,
    isActive: boolFromForm.optional(),
    isAds: boolFromForm.optional(),
});

export const sellerSizeChartSchema = z.object({
    name: z.string().trim().min(1, "Name is required"),
    category: z.string().trim().min(1, "Category is required"),
    unit: z.enum(["inches", "cm"]).default("inches"),
    fields: z.preprocess(parseJson, z.array(z.string().trim().min(1)).min(1)),
    data: z.preprocess(parseJson, z.array(z.record(z.string(), z.union([z.string(), z.number()]))).min(1)),
    howToMeasure: z.preprocess(parseJson, z.array(z.string()).optional()),
    productIds: z.preprocess(parseJson, z.array(mongoIdSchema).optional()),
    isActive: boolFromForm.optional(),
});

export const sellerSizeChartAssignSchema = z.object({
    productIds: z.array(mongoIdSchema).default([]),
});

export const sellerCategoryRequestSchema = z.object({
    requestedPrimaryCategory: z.string().trim().min(1),
    requestedSubcategories: z.array(z.string().trim().min(1)).optional(),
    message: z.string().trim().max(500).optional(),
});

export const sellerSubmitReviewSchema = z.object({
    note: z.string().trim().max(300).optional(),
});

export const requestMallSchema = z.object({
    mallId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid mall id"),
    mallUnit: z.string().trim().max(40).optional(),
    mallFloor: z.string().trim().max(40).optional(),
    message: z.string().trim().max(500).optional(),
});

export const createMallRequestSchema = z.object({
    name: z.string().trim().min(2, "Mall name is required"),
    description: z.string().trim().max(800).optional(),
    address: z.object({
        line1: z.string().trim().optional(),
        city: z.string().trim().optional(),
        state: z.string().trim().optional(),
        pincode: z.string().trim().optional(),
    }).optional(),
    contact: z.object({
        managerName: z.string().trim().optional(),
        phone: z.string().trim().optional(),
        email: z.string().email().optional().or(z.literal("")),
    }).optional(),
    mallUnit: z.string().trim().max(40).optional(),
    mallFloor: z.string().trim().max(40).optional(),
    message: z.string().trim().max(500).optional(),
});

const bankPayoutSchema = z.object({
    type: z.literal("BANK"),
    label: z.string().trim().max(80).optional(),
    bank: z.object({
        accountHolderName: z.string().trim().min(2),
        accountNumber: z.string().trim().min(4),
        ifsc: z.string().trim().min(4),
        bankName: z.string().trim().min(2),
    }),
});

const upiPayoutSchema = z.object({
    type: z.literal("UPI"),
    label: z.string().trim().max(80).optional(),
    upi: z.object({
        upiId: z.string().trim().min(4),
    }),
});

const paypalPayoutSchema = z.object({
    type: z.literal("PAYPAL"),
    label: z.string().trim().max(80).optional(),
    paypal: z.object({
        email: z.string().email(),
    }),
});

const stripeConnectPayoutSchema = z.object({
    type: z.literal("STRIPE_CONNECT"),
    label: z.string().trim().max(80).optional(),
    stripeConnect: z.object({
        accountId: z.string().trim().min(4),
    }),
});

export const payoutMethodSchema = z.discriminatedUnion("type", [
    bankPayoutSchema,
    upiPayoutSchema,
    paypalPayoutSchema,
    stripeConnectPayoutSchema,
]);

export const payoutRequestSchema = z.object({
    amount: z.coerce.number().positive("Payout amount must be greater than zero"),
    payoutMethodId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid payout method id"),
    note: z.string().trim().max(500).optional(),
});
