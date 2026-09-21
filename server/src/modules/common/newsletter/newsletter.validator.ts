import { z } from "zod";

export const subscribeSchema = z.object({
    email: z.string().trim().toLowerCase().email("Enter a valid email address"),
    vertical: z.enum(["CLOTHING", "FOOD", "JEWELERY"]).optional().default("JEWELERY"),
    source: z.string().max(80).optional().default("home-newsletter"),
});
