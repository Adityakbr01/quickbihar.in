import { z } from "zod";
import { DeliveryStatus } from "@/modules/common/order/order.type";
import { deliveryLocationSchema } from "@/modules/common/order/order.validator";
import { SubOrderStatus } from "@/modules/common/order/subOrder.model";

export const listRidersSchema = z.object({
    available: z.coerce.boolean().optional(),
    search: z.string().trim().optional(),
    latitude: z.coerce.number().min(-90).max(90).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),
});

export const updateAvailabilitySchema = z.object({
    isOnline: z.boolean(),
    location: deliveryLocationSchema.optional(),
});

const riderOrderStatusSchema = z.union([
    z.nativeEnum(DeliveryStatus),
    z.nativeEnum(SubOrderStatus),
]);

export const listDeliveryOrdersSchema = z.object({
    status: riderOrderStatusSchema.optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const deliveryHistorySchema = listDeliveryOrdersSchema.extend({
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
});

export const deliveryEarningsSchema = z.object({
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
});

const bankPayoutMethodSchema = z.object({
    type: z.literal("BANK"),
    label: z.string().trim().max(80).optional(),
    bank: z.object({
        accountHolderName: z.string().trim().min(2),
        accountNumber: z.string().trim().min(4),
        ifsc: z.string().trim().min(4),
        bankName: z.string().trim().min(2),
    }),
});

const upiPayoutMethodSchema = z.object({
    type: z.literal("UPI"),
    label: z.string().trim().max(80).optional(),
    upi: z.object({
        upiId: z.string().trim().min(4),
    }),
});

export const deliveryPayoutMethodSchema = z.discriminatedUnion("type", [
    bankPayoutMethodSchema,
    upiPayoutMethodSchema,
]);

export const deliveryPayoutRequestSchema = z.object({
    amount: z.coerce.number().positive("Payout amount must be greater than zero"),
    payoutMethodId: z.union([
        z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid payout method id"),
        z.enum(["PROFILE_UPI", "PROFILE_BANK"]),
    ]),
    note: z.string().trim().max(500).optional(),
});

/** Individually reviewable rider KYC document keys (mirrors the DeliveryBoy `documents` schema). */
export const RIDER_DOCUMENT_KEYS = [
    "drivingLicense",
    "aadharCard",
    "panCard",
    "vehicleRC",
    "profilePhoto",
] as const;

/**
 * Admin decision on a single rider document. A rejection must carry a reason so
 * the rider can be told what to fix before re-uploading.
 */
export const reviewRiderDocumentSchema = z
    .object({
        document: z.enum(RIDER_DOCUMENT_KEYS),
        status: z.enum(["APPROVED", "REJECTED"]),
        rejectionReason: z.string().trim().min(3).max(300).optional(),
    })
    .refine((data) => data.status !== "REJECTED" || !!data.rejectionReason, {
        message: "A rejection reason is required when rejecting a document",
        path: ["rejectionReason"],
    });

export const deliveryProfileUpdateSchema = z.object({
    phone: z.string().trim().max(20).optional(),
    vehicleType: z.string().trim().min(1).max(40).optional(),
    vehicleNumber: z.string().trim().min(1).max(40).optional(),
    licenseNumber: z.string().trim().min(1).max(80).optional(),
    address: z.object({
        address: z.string().trim().max(200).optional(),
        city: z.string().trim().max(80).optional(),
        state: z.string().trim().max(80).optional(),
        pincode: z.string().trim().max(12).optional(),
    }).optional(),
    bankDetails: z.object({
        accountNumber: z.string().trim().max(40).optional(),
        ifsc: z.string().trim().max(20).optional(),
        bankName: z.string().trim().max(80).optional(),
        pan: z.string().trim().max(20).optional(),
        upi: z.string().trim().max(80).optional(),
        aadhar: z.string().trim().max(20).optional(),
    }).optional(),
});
