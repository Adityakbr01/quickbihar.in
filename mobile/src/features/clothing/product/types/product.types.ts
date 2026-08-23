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
  policyType?: string;
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

export interface IReview {
  _id: string;
  id?: string;
  productId: string;
  rating: number;
  title?: string;
  comment: string;
  images?: { url: string; fileId?: string }[];
  isVerifiedBuyer: boolean;
  user: {
    _id?: string;
    fullName?: string;
  };
  helpfulCount: number;
  hasVotedHelpful?: boolean;
  createdAt: string;
}

export interface IReviewStats {
  averageRating: number;
  totalReviews: number;
  distribution: { [stars: number]: number };
  positivePercentage: number;
}

export interface IReviewsResponse {
  reviews: IReview[];
  stats: IReviewStats;
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

export interface IProduct {
  _id: string;
  title: string;
  slug: string;
  description: string;
  brand: string;
  category: string;
  subCategory?: string;
  gender?: string;
  price: number;
  originalPrice: number;
  discountPercentage: number;
  discountLabel?: string;
  currency: string;

  isGstApplicable: boolean;
  gstPercentage: number;

  images: IProductImage[];
  sellerId: string | { _id: string; fullName?: string; email?: string; phone?: string; businessName?: string };
  storeId?: string | {
    _id: string;
    name: string;
    address?: string;
    city?: string;
    state?: string;
    contactNumber?: string;
    rating?: number;
    logo?: { url: string };
  };
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
    occasion?: string;
    fabricCare?: string;
  };
  foodDetails?: {
    vegNonVeg?: "VEG" | "NON_VEG" | "EGG";
    shelfLife?: string;
    ingredients?: string[];
    servingSize?: string;
    calories?: number;
  };
  jeweleryDetails?: {
    metalType?: string;
    purity?: string;
    hallmark?: boolean;
    gemstone?: string;
    weightGrams?: number;
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
    importerDetail?: string;
    countryOfOrigin: string;
    genericName?: string;
  };
  logistics?: {
    pickupLocation?: string;
    warehouseName?: string;
    latitude?: number;
    longitude?: number;
  };
  policyRefs?: {
    returnPolicy?: IRefundPolicy;
    refundPolicy?: IRefundPolicy;
    shippingPolicy?: IRefundPolicy;
    termsPolicy?: IRefundPolicy;
  };
  refundPolicy?: string | IRefundPolicy;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CreateProductDto = Omit<IProduct, "_id" | "slug" | "sellerId" | "totalStock" | "ratings" | "createdAt" | "updatedAt" | "isDeleted">;
export type UpdateProductDto = Partial<CreateProductDto>;
