import axiosInstance from "@/lib/axios";
import type { DeliveryLocation, DeliveryPartner, DeliveryStatus } from "@/features/delivery/api/delivery.api";

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  category?: string;
  brand?: string;
  discountType?: string;
  isActive?: string;
  deliveryStatus?: string;
}

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REJECTED"
  | "REFUNDED"
  | "FAILED";

export interface AdminOrder {
  _id: string;
  orderId: string;
  userId?: {
    _id: string;
    fullName?: string;
    email?: string;
    phone?: string;
  };
  items: Array<{
    productId: string;
    title: string;
    sku: string;
    size: string;
    color: string;
    quantity: number;
    price: number;
    pickupLocation?: string;
    warehouseName?: string;
  }>;
  totalAmount: number;
  discountAmount?: number;
  shippingFee?: number;
  totalTax?: number;
  payableAmount: number;
  shippingAddress: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
    latitude?: number;
    longitude?: number;
  };
  status: OrderStatus;
  delivery?: {
    status?: DeliveryStatus;
    partnerUserId?: DeliveryPartner | string;
    payoutAmount?: number;
    payoutCreditedAt?: string;
    assignedAt?: string;
    acceptedAt?: string;
    pickedUpAt?: string;
    outForDeliveryAt?: string;
    deliveredAt?: string;
    currentLocation?: DeliveryLocation;
    otp?: {
      code?: string;
      generatedAt?: string;
      verifiedAt?: string;
    };
  };
  deliveryPartner?: DeliveryPartner | null;
  deliveryPartnerLocation?: DeliveryLocation | null;
  deliveryOtp?: string | null;
  cancellationReason?: string;
  paymentInfo?: {
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
  };
  couponCode?: string;
  createdAt?: string;
}

export type CouponDiscountType = "PERCENTAGE" | "FIXED";

export interface DeliveryRiderQuery {
  available?: boolean;
  search?: string;
  latitude?: number;
  longitude?: number;
}

export interface AdminCoupon {
  _id: string;
  code: string;
  description: string;
  discountType: CouponDiscountType;
  discountValue: number;
  minOrderValue: number;
  maxDiscountAmount?: number;
  startDate: string;
  endDate: string;
  usageLimit: number;
  usedCount: number;
  usageLimitPerUser: number;
  isActive: boolean;
  createdAt?: string;
}

export interface CouponPayload {
  code: string;
  description: string;
  discountType: CouponDiscountType;
  discountValue: number;
  minOrderValue?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usageLimitPerUser?: number;
  startDate?: string;
  endDate: string;
  isActive?: boolean;
}

export interface ProductVariantPayload {
  size: string;
  color: string;
  price?: number;
  stock: number;
  sku?: string;
}

export interface AdminProduct {
  _id: string;
  id?: string;
  title: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  brand?: string;
  category: string;
  subCategory?: string;
  price: number;
  originalPrice?: number;
  images?: Array<{ url: string; fileId: string }>;
  sellerId?: string;
  storeId?: string;
  variants: ProductVariantPayload[];
  totalStock?: number;
  sizeChartId?: string | AdminSizeChart;
  isGstApplicable?: boolean;
  gstPercentage?: number;
  details?: {
    sku?: string;
    fit?: string;
    pattern?: string;
    material?: string;
    collar?: string;
    sleeve?: string;
    washCare?: string;
  };
  tags?: string[];
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
  isFeatured?: boolean;
  isTrending?: boolean;
  isNewArrival?: boolean;
  deliveryInfo?: {
    isExpressAvailable?: boolean;
    isCodAvailable?: boolean;
    estimatedDays?: number;
    returnPolicy?: string;
  };
  compliance?: {
    manufacturerDetail?: string;
    packerDetail?: string;
    countryOfOrigin?: string;
  };
  logistics?: {
    pickupLocation?: string;
    warehouseName?: string;
    latitude?: number;
    longitude?: number;
  };
  policies?: {
    returnPolicy?: string;
    refundPolicy?: string;
    shippingPolicy?: string;
  };
  policyRefs?: {
    returnPolicy?: string;
    refundPolicy?: string;
    shippingPolicy?: string;
    termsPolicy?: string;
  };
  refundPolicy?: string | AdminRefundPolicy;
  isActive?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
}

export interface ProductPayload {
  sellerId?: string;
  title: string;
  description?: string;
  shortDescription?: string;
  brand?: string;
  category: string;
  subCategory?: string;
  price: number;
  originalPrice?: number;
  sizeChartId?: string;
  isGstApplicable?: boolean;
  gstPercentage?: number;
  variants: ProductVariantPayload[];
  details?: {
    sku?: string;
    fit?: string;
    pattern?: string;
    material?: string;
    collar?: string;
    sleeve?: string;
    washCare?: string;
  };
  tags?: string[];
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
  deliveryInfo?: {
    isExpressAvailable?: boolean;
    isCodAvailable?: boolean;
    estimatedDays?: number;
    returnPolicy?: string;
  };
  compliance?: {
    manufacturerDetail?: string;
    packerDetail?: string;
    countryOfOrigin?: string;
  };
  logistics?: {
    pickupLocation?: string;
    warehouseName?: string;
    latitude?: number;
    longitude?: number;
  };
  policies?: {
    returnPolicy?: string;
    refundPolicy?: string;
    shippingPolicy?: string;
  };
  policyRefs?: {
    returnPolicy?: string;
    refundPolicy?: string;
    shippingPolicy?: string;
    termsPolicy?: string;
  };
  refundPolicy?: string;
  existingImages?: Array<{ url: string; fileId: string }>;
  isFeatured?: boolean;
  isActive?: boolean;
}

export interface AdminBanner {
  _id: string;
  title?: string;
  subtitle?: string;
  image: string;
  imagePublicId?: string;
  redirectType: "product" | "category" | "collection" | "external";
  redirectId?: string;
  externalUrl?: string;
  placement: "home_top" | "home_middle" | "category";
  priority: number;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  isAds?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BannerPayload {
  title?: string;
  subtitle?: string;
  image?: string;
  imagePublicId?: string;
  redirectType?: "product" | "category" | "collection" | "external";
  redirectId?: string;
  externalUrl?: string;
  placement?: "home_top" | "home_middle" | "category";
  priority?: number;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  isAds?: boolean;
}

export interface AdminSizeChart {
  _id: string;
  name: string;
  category: string;
  unit: "inches" | "cm";
  fields: string[];
  data: Array<Record<string, string | number>>;
  howToMeasure?: string[];
}

export interface AdminRefundPolicy {
  _id: string;
  name: string;
  category?: string;
  description?: string;
  returnWindowDays?: number;
  refundProcessingDays?: number;
  conditions?: string[];
  refundType?: string;
  returnShipping?: string;
  isReturnable?: boolean;
  isExchangeAvailable?: boolean;
  isActive?: boolean;
}

export interface ProductWarehouse {
  _id: string;
  name: string;
  code: string;
  address?: {
    line1?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  contact?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  serviceAreas?: string[];
  capacity?: number;
  isActive?: boolean;
}

export interface AdminCategory {
  _id: string;
  title: string;
  slug: string;
  image: string;
  imagePublicId?: string;
  banner?: string;
  description?: string;
  parentId?: string | { _id: string; title: string; slug: string };
  priority?: number;
  sortOrder?: number;
  isActive?: boolean;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
  createdAt?: string;
}

export interface CategoryPayload {
  title: string;
  description?: string;
  parentId?: string;
  priority?: number;
  sortOrder?: number;
  isActive?: boolean;
  banner?: string;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
}

const normalizePaginated = <T>(payload: T[] | PaginatedResult<T>, page = 1, limit = 20): PaginatedResult<T> => {
  if (Array.isArray(payload)) {
    return {
      data: payload,
      total: payload.length,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(payload.length / limit)),
    };
  }

  return payload;
};

const appendOptional = (formData: FormData, key: string, value: unknown) => {
  if (value === undefined || value === null || value === "") return;
  if (typeof value === "object" && !(value instanceof File)) {
    formData.append(key, JSON.stringify(value));
    return;
  }
  formData.append(key, String(value));
};

const productFormData = (payload: ProductPayload, images?: File[]) => {
  const formData = new FormData();
  appendOptional(formData, "sellerId", payload.sellerId);
  appendOptional(formData, "title", payload.title);
  appendOptional(formData, "description", payload.description);
  appendOptional(formData, "shortDescription", payload.shortDescription);
  appendOptional(formData, "brand", payload.brand);
  appendOptional(formData, "category", payload.category);
  appendOptional(formData, "subCategory", payload.subCategory);
  appendOptional(formData, "price", payload.price);
  appendOptional(formData, "originalPrice", payload.originalPrice);
  appendOptional(formData, "sizeChartId", payload.sizeChartId);
  appendOptional(formData, "isGstApplicable", payload.isGstApplicable);
  appendOptional(formData, "gstPercentage", payload.gstPercentage);
  appendOptional(formData, "variants", payload.variants);
  appendOptional(formData, "details", payload.details);
  appendOptional(formData, "tags", payload.tags);
  appendOptional(formData, "seo", payload.seo);
  appendOptional(formData, "deliveryInfo", payload.deliveryInfo);
  appendOptional(formData, "compliance", payload.compliance);
  appendOptional(formData, "logistics", payload.logistics);
  appendOptional(formData, "policies", payload.policies);
  appendOptional(formData, "refundPolicy", payload.refundPolicy);
  appendOptional(formData, "existingImages", payload.existingImages);
  appendOptional(formData, "isFeatured", payload.isFeatured);
  appendOptional(formData, "isActive", payload.isActive);
  images?.forEach((image) => formData.append("images", image));
  return formData;
};

const categoryFormData = (payload: CategoryPayload, image?: File) => {
  const formData = new FormData();
  appendOptional(formData, "title", payload.title);
  appendOptional(formData, "description", payload.description);
  appendOptional(formData, "parentId", payload.parentId);
  appendOptional(formData, "priority", payload.priority);
  appendOptional(formData, "sortOrder", payload.sortOrder);
  appendOptional(formData, "isActive", payload.isActive);
  appendOptional(formData, "banner", payload.banner);
  appendOptional(formData, "seo", payload.seo);
  if (image) formData.append("image", image);
  return formData;
};

const bannerFormData = (payload: BannerPayload, image?: File) => {
  const formData = new FormData();
  appendOptional(formData, "title", payload.title);
  appendOptional(formData, "subtitle", payload.subtitle);
  appendOptional(formData, "redirectType", payload.redirectType);
  appendOptional(formData, "redirectId", payload.redirectId);
  appendOptional(formData, "externalUrl", payload.externalUrl);
  appendOptional(formData, "placement", payload.placement);
  appendOptional(formData, "priority", payload.priority);
  appendOptional(formData, "startDate", payload.startDate);
  appendOptional(formData, "endDate", payload.endDate);
  appendOptional(formData, "isActive", payload.isActive);
  appendOptional(formData, "isAds", payload.isAds);
  if (image) formData.append("image", image);
  return formData;
};

export const catalogManagementApi = {
  getOrders: async (params: QueryParams): Promise<PaginatedResult<AdminOrder>> => {
    const response = await axiosInstance.get("/orders/admin/all", { params });
    return normalizePaginated<AdminOrder>(response.data.data, params.page, params.limit);
  },

  updateOrderStatus: async ({ orderId, status, cancellationReason }: { orderId: string; status: OrderStatus; cancellationReason?: string }) => {
    const response = await axiosInstance.patch(`/orders/admin/status/${orderId}`, { status, cancellationReason });
    return response.data.data;
  },

  getDeliveryRiders: async (params: DeliveryRiderQuery = {}): Promise<DeliveryPartner[]> => {
    const response = await axiosInstance.get("/delivery/admin/riders", { params });
    return response.data.data;
  },

  assignDeliveryPartner: async (payload: { orderId: string; deliveryUserId: string; payoutAmount?: number }): Promise<AdminOrder> => {
    const { orderId, ...body } = payload;
    const response = await axiosInstance.patch(`/orders/admin/${orderId}/delivery-assignment`, body);
    return response.data.data;
  },

  unassignDeliveryPartner: async (orderId: string): Promise<AdminOrder> => {
    const response = await axiosInstance.delete(`/orders/admin/${orderId}/delivery-assignment`);
    return response.data.data;
  },

  getCoupons: async (params: QueryParams): Promise<PaginatedResult<AdminCoupon>> => {
    const response = await axiosInstance.get("/coupons", { params });
    return normalizePaginated<AdminCoupon>(response.data.data, params.page, params.limit);
  },

  createCoupon: async (payload: CouponPayload): Promise<AdminCoupon> => {
    const response = await axiosInstance.post("/coupons", payload);
    return response.data.data;
  },

  updateCoupon: async ({ couponId, payload }: { couponId: string; payload: Partial<CouponPayload> }): Promise<AdminCoupon> => {
    const response = await axiosInstance.patch(`/coupons/${couponId}`, payload);
    return response.data.data;
  },

  deleteCoupon: async (couponId: string) => {
    const response = await axiosInstance.delete(`/coupons/${couponId}`);
    return response.data.data;
  },

  getProducts: async (params: QueryParams): Promise<PaginatedResult<AdminProduct>> => {
    const response = await axiosInstance.get("/products", { params });
    return normalizePaginated<AdminProduct>(response.data.data, params.page, params.limit);
  },

  createProduct: async ({ payload, images }: { payload: ProductPayload; images: File[] }): Promise<AdminProduct> => {
    const response = await axiosInstance.post("/products", productFormData(payload, images), {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data;
  },

  updateProduct: async ({ productId, payload, images }: { productId: string; payload: Partial<ProductPayload>; images?: File[] }): Promise<AdminProduct> => {
    const response = await axiosInstance.patch(`/products/${productId}`, productFormData(payload as ProductPayload, images), {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data;
  },

  deleteProduct: async (productId: string) => {
    const response = await axiosInstance.delete(`/products/${productId}`);
    return response.data.data;
  },

  getSellerSizeCharts: async (sellerId: string): Promise<AdminSizeChart[]> => {
    if (!sellerId) return [];
    const response = await axiosInstance.get(`/admin/sellers/${sellerId}/size-charts`);
    return response.data.data;
  },

  getRefundPolicies: async (): Promise<AdminRefundPolicy[]> => {
    const response = await axiosInstance.get("/refund-policies/all");
    return response.data.data;
  },

  getWarehouses: async (): Promise<ProductWarehouse[]> => {
    const response = await axiosInstance.get("/admin/warehouses", { params: { page: 1, limit: 100, status: "active" } });
    return normalizePaginated<ProductWarehouse>(response.data.data, 1, 100).data;
  },

  getCategories: async (params: QueryParams): Promise<PaginatedResult<AdminCategory>> => {
    const response = await axiosInstance.get("/categories", { params });
    return normalizePaginated<AdminCategory>(response.data.data, params.page, params.limit);
  },

  createCategory: async ({ payload, image }: { payload: CategoryPayload; image: File }): Promise<AdminCategory> => {
    const response = await axiosInstance.post("/categories", categoryFormData(payload, image), {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data;
  },

  updateCategory: async ({ categoryId, payload, image }: { categoryId: string; payload: Partial<CategoryPayload>; image?: File }): Promise<AdminCategory> => {
    const response = await axiosInstance.patch(`/categories/${categoryId}`, categoryFormData(payload as CategoryPayload, image), {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data;
  },

  deleteCategory: async (categoryId: string) => {
    const response = await axiosInstance.delete(`/categories/${categoryId}`);
    return response.data.data;
  },

  getSizeCharts: async (): Promise<AdminSizeChart[]> => {
    const response = await axiosInstance.get("/size-charts/my");
    return response.data.data;
  },

  createSizeChart: async (payload: Omit<AdminSizeChart, "_id">): Promise<AdminSizeChart> => {
    const response = await axiosInstance.post("/size-charts", payload);
    return response.data.data;
  },

  updateSizeChart: async ({ id, payload }: { id: string; payload: Partial<Omit<AdminSizeChart, "_id">> }): Promise<AdminSizeChart> => {
    const response = await axiosInstance.patch(`/size-charts/${id}`, payload);
    return response.data.data;
  },

  deleteSizeChart: async (id: string) => {
    const response = await axiosInstance.delete(`/size-charts/${id}`);
    return response.data.data;
  },

  getAdminBanners: async (): Promise<AdminBanner[]> => {
    const response = await axiosInstance.get("/banners/all");
    return response.data.data;
  },

  createAdminBanner: async ({ payload, image }: { payload: BannerPayload; image?: File }): Promise<AdminBanner> => {
    const response = await axiosInstance.post("/banners", bannerFormData(payload, image), {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data;
  },

  updateAdminBanner: async ({ id, payload, image }: { id: string; payload: Partial<BannerPayload>; image?: File }): Promise<AdminBanner> => {
    const response = await axiosInstance.patch(`/banners/${id}`, bannerFormData(payload as BannerPayload, image), {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data;
  },

  deleteAdminBanner: async (id: string) => {
    const response = await axiosInstance.delete(`/banners/${id}`);
    return response.data.data;
  },
};
