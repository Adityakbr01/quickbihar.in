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
  images: IProductImage[];
  sellerId: string;
  variants: IVariant[];
  totalStock: number;
  ratings?: {
    average: number;
    count: number;
  };
  sizeChartId?: string;
  details?: {
    fit?: string;
    pattern?: string;
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
    estimatedDays: number;
  };
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CreateProductDto = Omit<IProduct, "_id" | "slug" | "sellerId" | "totalStock" | "ratings" | "createdAt" | "updatedAt" | "isDeleted">;
export type UpdateProductDto = Partial<CreateProductDto>;
