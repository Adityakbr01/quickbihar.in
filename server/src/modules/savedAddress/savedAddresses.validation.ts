import { z } from "zod";
import { AddressType } from "./savedAddresses.model";

export const addressSchema = z.object({
    fullName: z.string().min(2, "Full name is required"),
    phone: z.string().min(10, "Valid phone number required").max(15),
    street: z.string().min(5, "Street address is required"),
    city: z.string().min(2, "City is required"),
    state: z.string().min(2, "State is required"),
    pincode: z.string().min(6, "Pincode must be 6 digits").max(6),
    landmark: z.string().optional(),
    addressType: z.nativeEnum(AddressType).default(AddressType.HOME),
    isDefault: z.boolean().default(false),
});

export const updateAddressSchema = addressSchema.partial();
