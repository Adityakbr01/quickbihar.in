import { z } from "zod";

export const createSizeChartSchema = z.object({
    name: z.string().trim().min(1, "Name is required"),
    category: z.string().trim().min(1, "Category is required"),
    unit: z.enum(["inches", "cm"]).default("inches"),
    fields: z.array(z.string().min(1)).min(1, "At least one field is required"),
    data: z.array(z.record(z.string(), z.union([z.string(), z.number()]))).min(1, "Chart data is required"),
    howToMeasure: z.array(z.string()).optional(),
});

export const updateSizeChartSchema = createSizeChartSchema.partial();

export type CreateSizeChartBody = z.infer<typeof createSizeChartSchema>;
export type UpdateSizeChartBody = z.infer<typeof updateSizeChartSchema>;
