import { z } from "zod";

export const createProductSchema = z.object({
    title: z.string().trim().min(1, "Title is required"),
    description: z.string().optional(),
    brand: z.string().optional(),
    category: z.string().trim().min(1, "Category is required"),
    subCategory: z.string().optional(),
    price: z.coerce.number().min(0, "Price must be positive"),
    originalPrice: z.coerce.number().optional(),
    discountPercentage: z.coerce.number().optional(),
    currency: z.string().default("INR"),
 
     isGstApplicable: z.preprocess((val) => val === "true" || val === true, z.boolean()).default(false),
     gstPercentage: z.coerce.number().default(0),
     
     // Support for both JSON string (multipart) and object
    variants: z.preprocess(
        (val) => typeof val === "string" ? JSON.parse(val) : val,
        z.array(z.object({
            size: z.string().min(1, "Size is required"),
            color: z.string().min(1, "Color is required"),
            stock: z.coerce.number().int().min(0, "Stock cannot be negative"),
            sku: z.string().optional()
        })).min(1, "At least one variant is required")
    ),

    sizeChartId: z.string().optional(),

    details: z.preprocess(
        (val) => typeof val === "string" ? JSON.parse(val) : val,
        z.object({
             fit: z.string().optional(),
             pattern: z.string().optional(),
             material: z.string().optional(),
             collar: z.string().optional(),
             sleeve: z.string().optional(),
             washCare: z.string().optional(),
             sku: z.string().optional(),
         })
     ).optional(),
 
     tags: z.preprocess(
         (val) => typeof val === "string" ? JSON.parse(val) : val,
         z.array(z.string())
     ).optional(),
 
     isFeatured: z.preprocess((val) => val === "true" || val === true, z.boolean()).default(false),
     isTrending: z.preprocess((val) => val === "true" || val === true, z.boolean()).default(false),
     isNewArrival: z.preprocess((val) => val === "true" || val === true, z.boolean()).default(false),
 
     deliveryInfo: z.preprocess(
         (val) => typeof val === "string" ? JSON.parse(val) : val,
         z.object({
             isExpressAvailable: z.preprocess((val) => val === "true" || val === true, z.boolean()).default(false),
             isCodAvailable: z.preprocess((val) => val === "true" || val === true, z.boolean()).default(true),
             estimatedDays: z.coerce.number().default(3),
             returnPolicy: z.string().optional().default("7 days easy return"),
         })
     ).optional(),
 
     compliance: z.preprocess(
         (val) => typeof val === "string" ? JSON.parse(val) : val,
         z.object({
             manufacturerDetail: z.string().optional(),
             packerDetail: z.string().optional(),
             countryOfOrigin: z.string().default("India"),
         })
     ).optional(),
 
     logistics: z.preprocess(
         (val) => typeof val === "string" ? JSON.parse(val) : val,
         z.object({
             pickupLocation: z.string().optional(),
             warehouseName: z.string().optional(),
             latitude: z.coerce.number().optional(),
             longitude: z.coerce.number().optional(),
         })
     ).optional(),
 
     isActive: z.preprocess((val) => val === "true" || val === true, z.boolean()).default(true),
 
     refundPolicy: z.string().optional(),
 });

export const updateProductSchema = createProductSchema.partial();

export type CreateProductBody = z.infer<typeof createProductSchema>;
export type UpdateProductBody = z.infer<typeof updateProductSchema>;
