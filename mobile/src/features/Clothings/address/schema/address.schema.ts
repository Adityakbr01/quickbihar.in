import { z } from "zod";

export enum AddressType {
  HOME = "HOME",
  WORK = "WORK",
  OTHER = "OTHER",
}

export const addressSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number is too long"),
  street: z.string().min(5, "Street address is too short"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().length(6, "Pincode must be exactly 6 digits"),
  landmark: z.string().optional(),
  addressType: z.nativeEnum(AddressType),
  isDefault: z.boolean(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export type AddressFormValues = z.infer<typeof addressSchema>;

export interface IAddress extends AddressFormValues {
  _id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}
