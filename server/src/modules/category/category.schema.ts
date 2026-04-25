// category.schema.ts
import { z } from "zod";

export const createCategorySchema = z.object({
    name: z.string(),
    slug: z.string(),
    parentId: z.string().optional(),
    level: z.coerce.number().optional(),
});

export const createAttributeSchema = z.object({
    categoryId: z.string(),
    name: z.string(),

    type: z.enum(["text", "number", "select", "boolean"]),

    required: z.boolean().optional(),

    options: z.array(z.string()).optional(),

    isFilterable: z.boolean().optional(),

    isVariant: z.boolean().optional(),

    // 🔥 ADVANCED FIELDS
    group: z.enum(["BASIC", "ADVANCED"]).optional(),
    showInList: z.boolean().optional(),
    searchable: z.boolean().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();
export const updateAttributeSchema = createAttributeSchema.partial();