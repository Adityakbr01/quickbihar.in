import { z } from "zod";

export const profileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number is too long")
    .optional()
    .or(z.literal("")),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

export interface IProfile {
  _id: string;
  username: string;
  email: string;
  fullName: string;
  phone?: string;
  avatar?: {
    url: string;
    fileId: string;
  };
  role: "admin" | "user" | "seller";
  createdAt: string;
  updatedAt: string;
}
