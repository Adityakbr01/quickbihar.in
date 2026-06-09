import { z } from "zod";
import { DeliveryStatus } from "../order/order.type";
import { deliveryLocationSchema } from "../order/order.validator";

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

export const listDeliveryOrdersSchema = z.object({
    status: z.nativeEnum(DeliveryStatus).optional(),
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
    payoutMethodId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid payout method id"),
    note: z.string().trim().max(500).optional(),
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
