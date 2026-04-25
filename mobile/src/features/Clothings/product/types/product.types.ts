export interface IVariant {
  size: string;
  color: string;
  stock: number;
  sku: string;
}

export interface IProductImage {
  url: string;
  fileId: string;
}

export interface IRefundPolicy {
  _id: string;
  name: string;
  category: string;
  description: string;
  returnWindowDays: number;
  refundProcessingDays: number;
  conditions: string[];
  refundType: string;
  returnShipping: string;
  isReturnable: boolean;
  isExchangeAvailable: boolean;
  isActive: boolean;
}
 
 export interface ISizeChart {
   _id: string;
   name: string;
   category: string;
   unit: "inches" | "cm";
   fields: string[];
   data: Record<string, any>[];
   howToMeasure: string[];
 }
 
 export interface IProduct {
  _id: string;
  title: string;
  slug: string;
  description: string;
  brand: string;
  category: string;
  subCategory?: string;
  price: number;
  originalPrice: number;
  discountPercentage: number;
  discountLabel?: string;
  currency: string;
 
   isGstApplicable: boolean;
   gstPercentage: number;
 
   images: IProductImage[];
  sellerId: string;
  variants: IVariant[];
  totalStock: number;
  ratings?: {
    average: number;
     count: number;
   };
   sizeChartId?: string | ISizeChart;
   details?: {
    fit?: string;
    pattern?: string;
    material?: string;
    collar?: string;
    sleeve?: string;
    washCare?: string;
    sku?: string;
  };
  tags: string[];
  isFeatured: boolean;
  isTrending: boolean;
  isNewArrival: boolean;
  deliveryInfo?: {
    isExpressAvailable: boolean;
    isCodAvailable: boolean;
    estimatedDays: number;
    returnPolicy?: string;
  };
  compliance?: {
    manufacturerDetail?: string;
    packerDetail?: string;
    countryOfOrigin: string;
  };
  logistics?: {
    pickupLocation?: string;
    warehouseName?: string;
    latitude?: number;
    longitude?: number;
  };
  refundPolicy?: string | IRefundPolicy;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CreateProductDto = Omit<IProduct, "_id" | "slug" | "sellerId" | "totalStock" | "ratings" | "createdAt" | "updatedAt" | "isDeleted">;
export type UpdateProductDto = Partial<CreateProductDto>;
