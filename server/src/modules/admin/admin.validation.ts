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
});
