import { z } from "zod";

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
