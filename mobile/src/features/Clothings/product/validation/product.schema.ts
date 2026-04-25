import { z } from "zod";

export const variantSchema = z.object({
  size: z.string().trim().min(1, "Size is required"),
  color: z.string().trim().min(1, "Color is required"),
  stock: z.number().int().min(0, "Stock cannot be negative"),
  sku: z.string().optional(),
});

export const productSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters"),
  description: z.string().trim().min(10, "Description must be at least 10 characters"),
  brand: z.string().trim().min(1, "Brand is required"),
  category: z.string().trim().min(1, "Category is required"),
  price: z.number().positive("Price must be greater than 0"),
  isGstApplicable: z.boolean().default(false),
  gstPercentage: z.number().min(0).max(100).default(0),
  originalPrice: z.number().positive("Original price must be greater than 0").optional(),
  tags: z.array(z.string()).min(1, "At least one tag is required"),
  variants: z.array(variantSchema).min(1, "At least one variant is required"),
  sizeChartId: z.string().optional(),
  details: z.object({
    fit: z.string().optional(),
    pattern: z.string().optional(),
    material: z.string().optional(),
    sleeve: z.string().optional(),
    washCare: z.string().optional(),
  }).optional(),
  deliveryInfo: z.object({
    isExpressAvailable: z.boolean().default(false),
    isCodAvailable: z.boolean().default(true),
    estimatedDays: z.number().int().min(1, "Min 1 day delivery"),
    returnPolicy: z.string().optional(),
  }).optional(),
  compliance: z.object({
    manufacturerDetail: z.string().optional(),
    packerDetail: z.string().optional(),
    countryOfOrigin: z.string().default("India"),
  }).optional(),
  logistics: z.object({
    pickupLocation: z.string().optional(),
    warehouseName: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }).optional(),
  refundPolicy: z.string().optional(),
  images: z.array(z.any()).min(1, "At least one image is required"),
});

export type ProductSchemaData = z.infer<typeof productSchema>;
