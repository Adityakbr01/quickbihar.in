import { z } from "zod";
import { AddressType } from "./savedAddresses.model";

const addressBaseSchema = z.object({
    fullName: z.string().min(2, "Full name is required"),
    phone: z.string().min(10, "Valid phone number required").max(15),
    street: z.string().min(5, "Street address is required"),
    city: z.string().min(2, "City is required"),
    state: z.string().min(2, "State is required"),
    pincode: z.string().min(6, "Pincode must be 6 digits").max(6),
    landmark: z.string().optional(),
    addressType: z.nativeEnum(AddressType).default(AddressType.HOME),
    isDefault: z.boolean().default(false),
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
});

export const addressSchema = addressBaseSchema.refine(
    (address) => !(address.latitude === 0 && address.longitude === 0),
    {
        path: ["latitude"],
        message: "Address location pin is required",
    }
);

export const updateAddressSchema = addressBaseSchema.partial().refine(
    (address) => {
        if (address.latitude === undefined && address.longitude === undefined) return true;
        return address.latitude !== undefined
            && address.longitude !== undefined
            && !(address.latitude === 0 && address.longitude === 0);
    },
    {
        path: ["latitude"],
        message: "Address location pin is required",
    }
);
