import { z } from "zod";
import { RoleEnum } from "../rbac/rbac.types";

export const listPeopleSchema = z.object({
    role: z.nativeEnum(RoleEnum).optional(),
    search: z.string().trim().optional(),
    status: z.enum(["active", "blocked", "verified", "unverified"]).optional(),
});

export const blockUserSchema = z.object({
    isBlocked: z.boolean(),
    reason: z.string().trim().max(300).optional(),
});

export const partnerTypeSchema = z.enum(["SELLER", "DELIVERY"]);

export const updatePartnerStatusSchema = z.object({
    type: partnerTypeSchema,
    status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
    isVerified: z.boolean().optional(),
});

export const inviteUserSchema = z.object({
    email: z.string().email(),
    role: z.enum([RoleEnum.USER, RoleEnum.SELLER, RoleEnum.DELIVERY, RoleEnum.ADMIN]),
    fullName: z.string().trim().min(2).max(80).optional(),
    message: z.string().trim().max(500).optional(),
});

export const createPayoutSchema = z.object({
    partnerId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid partner id"),
    partnerType: partnerTypeSchema,
    amount: z.coerce.number().positive(),
    method: z.string().trim().max(80).optional(),
    referenceId: z.string().trim().max(120).optional(),
    note: z.string().trim().max(500).optional(),
    status: z.enum(["PENDING", "PROCESSING", "PAID", "FAILED"]).optional(),
});

export const updatePayoutStatusSchema = z.object({
    status: z.enum(["PENDING", "PROCESSING", "PAID", "FAILED"]),
    referenceId: z.string().trim().max(120).optional(),
    note: z.string().trim().max(500).optional(),
});

export const mallAddressSchema = z.object({
    line1: z.string().trim().optional(),
    city: z.string().trim().optional(),
    state: z.string().trim().optional(),
    pincode: z.string().trim().optional(),
});

export const mallContactSchema = z.object({
    managerName: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    email: z.string().email().optional().or(z.literal("")),
});

export const createMallSchema = z.object({
    name: z.string().trim().min(2),
    description: z.string().trim().max(800).optional(),
    address: mallAddressSchema.optional(),
    contact: mallContactSchema.optional(),
    logoUrl: z.string().url().optional().or(z.literal("")),
    coverImageUrl: z.string().url().optional().or(z.literal("")),
    totalStores: z.coerce.number().int().min(0).optional(),
    rating: z.coerce.number().min(0).max(5).optional(),
    isFeatured: z.boolean().optional(),
    featuredRank: z.coerce.number().int().min(1).max(10).optional(),
    isActive: z.boolean().optional(),
    status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
});

export const updateMallSchema = createMallSchema.partial();

export const assignSellerMallSchema = z.object({
    mallId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid mall id").nullable().optional(),
    mallUnit: z.string().trim().max(40).optional(),
    mallFloor: z.string().trim().max(40).optional(),
});

export const reviewMallRequestSchema = z.object({
    status: z.enum(["APPROVED", "REJECTED"]),
    reason: z.string().trim().max(300).optional(),
});

export const listPayoutMethodsSchema = z.object({
    status: z.enum(["PENDING_VERIFICATION", "VERIFIED", "REJECTED"]).optional(),
});

export const reviewPayoutMethodSchema = z.object({
    status: z.enum(["VERIFIED", "REJECTED"]),
    reason: z.string().trim().max(300).optional(),
});

export const reviewMallCreationSchema = z.object({
    status: z.enum(["APPROVED", "REJECTED"]),
    reason: z.string().trim().max(300).optional(),
});

export const sellerSubmissionTypeSchema = z.enum([
    "products",
    "coupons",
    "banners",
    "sizeCharts",
    "categoryRequests",
]);

export const listSellerSubmissionsSchema = z.object({
    type: sellerSubmissionTypeSchema.optional(),
    status: z.enum(["DRAFT", "PENDING_REVIEW", "APPROVED", "REJECTED", "PENDING", "ALL"]).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const reviewSellerSubmissionSchema = z.object({
    status: z.enum(["APPROVED", "REJECTED"]),
    reason: z.string().trim().max(300).optional(),
    placement: z.enum(["home_top", "home_middle", "category"]).optional(),
    priority: z.coerce.number().int().optional(),
    startDate: z.string().trim().optional(),
    endDate: z.string().trim().optional(),
});

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");
const optionalUrlSchema = z.string().url().optional().or(z.literal(""));

export const adminListQuerySchema = z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    search: z.string().trim().optional(),
    status: z.string().trim().optional(),
    sortBy: z.string().trim().optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
});

export const policyTypeSchema = z.enum(["RETURN", "REFUND", "SHIPPING", "TERMS", "GENERAL"]);

export const adminPolicySchema = z.object({
    name: z.string().trim().min(2),
    policyType: policyTypeSchema.default("GENERAL"),
    category: z.string().trim().optional(),
    description: z.string().trim().optional(),
    returnWindowDays: z.coerce.number().int().min(0).optional(),
    refundProcessingDays: z.coerce.number().int().min(0).optional(),
    conditions: z.array(z.string().trim()).optional(),
    refundType: z.string().trim().optional(),
    returnShipping: z.string().trim().optional(),
    isReturnable: z.boolean().optional(),
    isExchangeAvailable: z.boolean().optional(),
    isActive: z.boolean().optional(),
});

export const updateAdminPolicySchema = adminPolicySchema.partial();

const policyRefsSchema = z.object({
    returnPolicy: objectIdSchema.optional().or(z.literal("")),
    refundPolicy: objectIdSchema.optional().or(z.literal("")),
    shippingPolicy: objectIdSchema.optional().or(z.literal("")),
    termsPolicy: objectIdSchema.optional().or(z.literal("")),
}).optional();

export const adminSellerSchema = z.object({
    fullName: z.string().trim().min(2),
    email: z.string().trim().email(),
    username: z.string().trim().min(2).optional(),
    phone: z.string().trim().optional(),
    password: z.string().min(6).optional(),
    isVerified: z.boolean().optional(),
    isBlocked: z.boolean().optional(),
    seller: z.object({
        businessName: z.string().trim().optional(),
        sellerType: z.string().trim().optional(),
        gstNumber: z.string().trim().optional(),
        status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
        isVerified: z.boolean().optional(),
        mallId: objectIdSchema.optional().or(z.literal("")),
        mallUnit: z.string().trim().optional(),
        mallFloor: z.string().trim().optional(),
        address: z.object({
            address: z.string().trim().optional(),
            city: z.string().trim().optional(),
            state: z.string().trim().optional(),
            pincode: z.string().trim().optional(),
        }).optional(),
    }).optional(),
    store: z.object({
        name: z.string().trim().optional(),
        description: z.string().trim().optional(),
        logoUrl: z.string().trim().optional(),
        bannerUrl: z.string().trim().optional(),
        isActive: z.boolean().optional(),
        isVerified: z.boolean().optional(),
        address: z.object({
            line1: z.string().trim().optional(),
            city: z.string().trim().optional(),
            state: z.string().trim().optional(),
            pincode: z.string().trim().optional(),
            country: z.string().trim().optional(),
            postalCode: z.string().trim().optional(),
        }).optional(),
        contact: z.object({
            email: z.string().trim().email().optional().or(z.literal("")),
            phone: z.string().trim().optional(),
        }).optional(),
        categoryConfig: z.object({
            primaryCategory: z.string().trim().optional(),
            subcategories: z.array(z.string().trim()).optional(),
            assignedByAdmin: z.boolean().optional(),
        }).optional(),
        policyRefs: policyRefsSchema,
    }).optional(),
});

export const updateAdminSellerSchema = adminSellerSchema.partial();

export const adminSizeChartSchema = z.object({
    name: z.string().trim().min(1),
    description: z.string().trim().optional(),
    category: z.string().trim().min(1),
    unit: z.enum(["inches", "cm"]).default("inches"),
    fields: z.array(z.string().trim().min(1)).min(1),
    data: z.array(z.record(z.string(), z.union([z.string(), z.number()]))).min(1),
    howToMeasure: z.array(z.string().trim()).optional(),
    isActive: z.boolean().optional(),
    approvalStatus: z.enum(["DRAFT", "PENDING_REVIEW", "APPROVED", "REJECTED"]).optional(),
});

export const updateAdminSizeChartSchema = adminSizeChartSchema.partial();

const seoSchema = z.object({
    metaTitle: z.string().trim().max(120).optional(),
    metaDescription: z.string().trim().max(300).optional(),
    keywords: z.array(z.string().trim()).optional(),
});

const publishStatusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

export const cmsPageSchema = z.object({
    title: z.string().trim().min(2).max(160),
    slug: z.string().trim().max(180).optional(),
    excerpt: z.string().trim().max(500).optional(),
    content: z.string().trim().min(1),
    status: publishStatusSchema.optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.coerce.number().int().optional(),
    seo: seoSchema.optional(),
});

export const updateCmsPageSchema = cmsPageSchema.partial();

export const faqSchema = z.object({
    question: z.string().trim().min(2).max(240),
    answer: z.string().trim().min(1),
    category: z.string().trim().max(80).optional(),
    sortOrder: z.coerce.number().int().optional(),
    status: publishStatusSchema.optional(),
    isActive: z.boolean().optional(),
});

export const updateFaqSchema = faqSchema.partial();

export const blogPostSchema = z.object({
    title: z.string().trim().min(2).max(180),
    slug: z.string().trim().max(200).optional(),
    excerpt: z.string().trim().max(700).optional(),
    content: z.string().trim().min(1),
    coverImageUrl: optionalUrlSchema,
    tags: z.array(z.string().trim()).optional(),
    status: publishStatusSchema.optional(),
    isActive: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    seo: seoSchema.optional(),
});

export const updateBlogPostSchema = blogPostSchema.partial();

export const announcementSchema = z.object({
    title: z.string().trim().min(2).max(160),
    message: z.string().trim().min(1).max(2000),
    channel: z.enum(["IN_APP", "PUSH", "EMAIL", "SMS"]).optional(),
    audience: z.enum(["ALL", "USERS", "SELLERS", "DELIVERY"]).optional(),
    status: z.enum(["DRAFT", "SCHEDULED", "SENT", "ARCHIVED"]).optional(),
    startsAt: z.coerce.date().optional(),
    endsAt: z.coerce.date().optional(),
    isActive: z.boolean().optional(),
});

export const updateAnnouncementSchema = announcementSchema.partial();

const flashSaleBaseSchema = z.object({
    name: z.string().trim().min(2).max(160),
    slug: z.string().trim().max(180).optional(),
    description: z.string().trim().max(1000).optional(),
    productIds: z.array(objectIdSchema).optional(),
    discountType: z.enum(["PERCENTAGE", "FIXED"]).optional(),
    discountValue: z.coerce.number().min(0),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    status: z.enum(["DRAFT", "SCHEDULED", "ACTIVE", "ENDED", "ARCHIVED"]).optional(),
    isActive: z.boolean().optional(),
});

export const flashSaleSchema = flashSaleBaseSchema.refine((data) => data.endsAt > data.startsAt, {
    message: "End date must be after start date",
    path: ["endsAt"],
});

export const updateFlashSaleSchema = flashSaleBaseSchema.partial().refine((data) => {
    if (!data.startsAt || !data.endsAt) return true;
    return data.endsAt > data.startsAt;
}, {
    message: "End date must be after start date",
    path: ["endsAt"],
});

export const featureProductSchema = z.object({
    isFeatured: z.boolean().optional(),
    isTrending: z.boolean().optional(),
    isNewArrival: z.boolean().optional(),
});

const addressSchema = z.object({
    line1: z.string().trim().optional(),
    line2: z.string().trim().optional(),
    city: z.string().trim().optional(),
    state: z.string().trim().optional(),
    pincode: z.string().trim().optional(),
    country: z.string().trim().optional(),
});

const warehouseContactSchema = z.object({
    name: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    email: z.string().email().optional().or(z.literal("")),
});

export const warehouseSchema = z.object({
    name: z.string().trim().min(2).max(120),
    code: z.string().trim().min(2).max(40),
    address: addressSchema.optional(),
    contact: warehouseContactSchema.optional(),
    serviceAreas: z.array(z.string().trim()).optional(),
    capacity: z.coerce.number().min(0).optional(),
    isActive: z.boolean().optional(),
});

export const updateWarehouseSchema = warehouseSchema.partial();

export const shippingProviderSchema = z.object({
    name: z.string().trim().min(2).max(120),
    code: z.string().trim().min(2).max(40),
    type: z.enum(["MANUAL", "COURIER", "HYPERLOCAL", "AGGREGATOR"]).optional(),
    serviceAreas: z.array(z.string().trim()).optional(),
    config: z.record(z.string(), z.unknown()).optional(),
    isActive: z.boolean().optional(),
});

export const updateShippingProviderSchema = shippingProviderSchema.partial();

export const updateInventorySchema = z.object({
    productId: objectIdSchema,
    sku: z.string().trim().min(1),
    stock: z.coerce.number().int().min(0),
    reason: z.string().trim().max(300).optional(),
});

export const systemConfigSchema = z.object({
    api: z.object({
        enabled: z.boolean().optional(),
        baseUrl: z.string().url().optional().or(z.literal("")),
        keys: z.array(z.object({
            label: z.string().trim().min(1).max(80),
            key: z.string().trim().optional(),
            secret: z.string().trim().optional(),
            enabled: z.boolean().optional(),
        })).optional(),
        webhooks: z.array(z.object({
            label: z.string().trim().min(1).max(80),
            url: z.string().url(),
            secret: z.string().trim().optional(),
            enabled: z.boolean().optional(),
        })).optional(),
    }).optional(),
    payment: z.object({
        provider: z.string().trim().max(80).optional(),
        mode: z.enum(["TEST", "LIVE"]).optional(),
        enabled: z.boolean().optional(),
        publicKey: z.string().trim().optional(),
        secretKey: z.string().trim().optional(),
        webhookSecret: z.string().trim().optional(),
    }).optional(),
    smtp: z.object({
        host: z.string().trim().max(160).optional(),
        port: z.coerce.number().int().min(1).max(65535).optional(),
        secure: z.boolean().optional(),
        username: z.string().trim().optional(),
        password: z.string().trim().optional(),
        fromEmail: z.string().email().optional().or(z.literal("")),
        fromName: z.string().trim().max(120).optional(),
    }).optional(),
    backup: z.object({
        autoBackupEnabled: z.boolean().optional(),
        frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY"]).optional(),
        retentionDays: z.coerce.number().int().min(1).max(365).optional(),
    }).optional(),
});

export const backupCreateSchema = z.object({
    name: z.string().trim().min(2).max(120).optional(),
    collections: z.array(z.string().trim()).optional(),
});

export const backupRestoreSchema = z.object({
    confirm: z.literal("RESTORE"),
});
