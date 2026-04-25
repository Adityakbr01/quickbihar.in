import { z } from "zod";

export const createCategorySchema = z.object({
    title: z.string().trim().min(1, "Title is required"),
    image: z.string().url("Invalid image URL"),
    imagePublicId: z.string().min(1, "Public ID is required"),
    priority: z.coerce.number().int().default(0),
    isActive: z.preprocess((val) => val === "true" || val === true, z.boolean()).default(true),
    parentId: z.string().optional().nullable(),
    parentModel: z.enum(["Category", "SubCategory"]).optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryBody = z.infer<typeof createCategorySchema>;
export type UpdateCategoryBody = z.infer<typeof updateCategorySchema>;
