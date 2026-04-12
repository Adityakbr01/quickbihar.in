import { z } from "zod";

export const createBannerSchema = z.object({
  title: z.string().trim().optional(),
  subtitle: z.string().trim().optional(),
  image: z.string().url("Invalid image URL"),
  imagePublicId: z.string(),
  redirectType: z.enum(["product", "category", "collection", "external"]),
  redirectId: z.string().optional(), // Expecting MongoDB ID as string
  externalUrl: z.string().url("Invalid external URL").optional(),
  placement: z.enum(["home_top", "home_middle", "category"]).default("home_top"),
  priority: z.coerce.number().int().default(0),
  startDate: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
  endDate: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
  isActive: z.preprocess((val) => val === "true" || val === true, z.boolean()).default(true),
  isAds: z.preprocess((val) => val === "true" || val === true, z.boolean()).default(false),
});

export const updateBannerSchema = createBannerSchema.partial();

export type CreateBannerBody = z.infer<typeof createBannerSchema>;
export type UpdateBannerBody = z.infer<typeof updateBannerSchema>;
