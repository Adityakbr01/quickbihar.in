import { z } from "zod";

export const createCategorySchema = z.object({
    title: z.string().trim().min(1, "Title is required"),
    image: z.string().url("Invalid image URL"),
    imagePublicId: z.string().min(1, "Public ID is required"),
    banner: z.string().url("Invalid banner URL").optional().or(z.literal("")),
    bannerPublicId: z.string().optional(),
    description: z.string().optional(),
    priority: z.coerce.number().int().default(0),
    sortOrder: z.coerce.number().int().optional(),
    isActive: z.preprocess((val) => val === "true" || val === true, z.boolean()).default(true),
    parentId: z.string().optional().nullable(),
    parentModel: z.enum(["Category", "SubCategory"]).optional(),
    seo: z.preprocess(
        (val) => typeof val === "string" ? JSON.parse(val) : val,
        z.object({
            metaTitle: z.string().optional(),
            metaDescription: z.string().optional(),
            keywords: z.array(z.string()).optional(),
        }),
    ).optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryBody = z.infer<typeof createCategorySchema>;
export type UpdateCategoryBody = z.infer<typeof updateCategorySchema>;
