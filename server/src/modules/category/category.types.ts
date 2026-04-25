// category.types.ts
import { z } from "zod";
import { createCategorySchema, createAttributeSchema, updateCategorySchema, updateAttributeSchema } from "./category.schema";

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type CreateAttributeInput = z.infer<typeof createAttributeSchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type UpdateAttributeInput = z.infer<typeof updateAttributeSchema>;