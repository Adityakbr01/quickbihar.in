import { z } from "zod";

export const profileSchema = z.object({
    fullName: z.string().min(2, "Name must be at least 2 characters"),
    phone: z.string().min(10, "Phone number must be at least 10 digits").max(15, "Phone number is too long"),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
