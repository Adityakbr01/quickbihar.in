import { z } from "zod";
import { ApplicationType, ApplicationStatus } from "./onboarding.model";
import { DomainEnum } from "../rbac/rbac.types";

const documentSchema = z.object({
    name: z.string().min(1, "Document name is required"),
    url: z.string().url("Invalid document URL"),
    fileId: z.string().min(1, "File ID is required"),
});

const locationSchema = z.object({
    lat: z.number().min(-90).max(90, "Invalid latitude"),
    lng: z.number().min(-180).max(180, "Invalid longitude"),
});

const bankDetailsSchema = z.object({
    accountNumber: z.string().min(1, "Account number is required"),
    ifsc: z.string().min(1, "IFSC code is required"),
    bankName: z.string().min(1, "Bank name is required"),
    pan: z.string().min(1, "PAN is required"),
    upi: z.string().optional(),
    aadhar: z.string().min(1, "Aadhar is required"),
});

const addressSchema = z.object({
    address: z.string().min(1, "Address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    pincode: z.string().min(6, "Invalid pincode").max(6),
});

export const applyOnboardingSchema = z.object({
    body: z.discriminatedUnion("type", [
        z.object({
            type: z.literal(ApplicationType.SELLER),
            documents: z.array(documentSchema).min(1, "At least one document is required"),
            details: z.object({
                businessName: z.string().min(1, "Business name is required"),
                sellerType: z.nativeEnum(DomainEnum, {
                    message: "Invalid seller type (must be CLOTHING, JEWELRY, or FOOD)",
                }),
                gstNumber: z.string().optional(),
                bankDetails: bankDetailsSchema.optional(),
                address: addressSchema.optional(),
                location: locationSchema.optional(),
            }),
        }),
        z.object({
            type: z.literal(ApplicationType.RIDER),
            documents: z.array(documentSchema).min(1, "At least one document is required"),
            details: z.object({
                vehicleType: z.string().min(1, "Vehicle type is required"),
                vehicleNumber: z.string().min(1, "Vehicle number is required"),
                licenseNumber: z.string().min(1, "License number is required"),
                bankDetails: bankDetailsSchema.optional(),
                address: addressSchema.optional(),
                location: locationSchema.optional(),
            }),
        }),
    ]),
});

export const reviewApplicationSchema = z.object({
    params: z.object({
        applicationId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Application ID"),
    }),
    body: z.object({
        status: z.enum([ApplicationStatus.APPROVED, ApplicationStatus.REJECTED], {
            message: "Invalid status for review",
        }),
        reason: z.string().optional(),
    }),
});
