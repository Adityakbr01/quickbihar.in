import axiosInstance from "@/lib/axios";
import type {
  SellerMallCreatePayload,
  SellerPayoutMethod,
  SellerPayoutMethodPayload,
  SellerSetupStatus,
} from "./sellerPanel.api";

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SellerQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  approvalStatus?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  dateFrom?: string;
  dateTo?: string;
}

export type ApprovalStatus = "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "REJECTED";
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

export interface SellerDashboard {
  setup: SellerSetupStatus;
  stats: {
    products: {
      total: number;
      active: number;
      byApproval: Record<ApprovalStatus, number>;
    };
    orders: Record<string, { count: number; revenue: number }>;
    lowStockCount: number;
    unreadNotifications: number;
    pendingPayouts: number;
    pendingReviews: number;
  };
  dailyRevenue?: Array<{
    _id: string;
    orders: number;
    revenue: number;
    sellerNet: number;
    platformCommission: number;
  }>;
  productPerformance?: Array<{
    _id: string;
    title?: string;
    sku?: string;
    quantity: number;
    revenue: number;
  }>;
  recentOrders: SellerOrder[];
  recentNotifications: SellerNotification[];
}

export interface SellerStorePayload {
  name?: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  address?: {
    line1?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
    postalCode?: string;
  };
  contact?: {
    email?: string;
    phone?: string;
  };
  categoryConfig?: {
    primaryCategory?: string;
    subcategories?: string[];
  };
  deliveryConfig?: {
    deliveryAreas?: string[];
    shippingFee?: number;
    freeShippingThreshold?: number;
  };
  seo?: {
    storeTitle?: string;
    metaTitle?: string;
    metaDescription?: string;
  };
  policyRefs?: {
    returnPolicy?: string;
    refundPolicy?: string;
    shippingPolicy?: string;
    termsPolicy?: string;
  };
  currentLocation?: {
    lat: number;
    lng: number;
  };
  deliveryRadiusKm?: number;
  minOrderAmount?: number;
  deliveryFee?: number;
}

export interface SellerStoreResponse {
  store: (SellerStorePayload & {
    _id: string;
    isOpen?: boolean;
    isActive?: boolean;
    isSetupComplete?: boolean;
    setupMissingFields?: string[];
    currentLocation?: {
      type: "Point";
      coordinates: [number, number];
    };
  }) | null;
  setup: {
    isComplete: boolean;
    missingFields: string[];
  };
}

export interface ProductVariantPayload {
  size: string;
  color: string;
  price?: number;
  stock: number;
  sku?: string;
}

export interface SellerProduct {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  brand?: string;
  category: string;
  subCategory?: string;
  gender?: string;
  price: number;
  originalPrice?: number;
  images?: Array<{ url: string; fileId: string }>;
  variants: ProductVariantPayload[];
  totalStock?: number;
  sizeChartId?: string | SellerSizeChart;
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
  policyRefs?: {
    returnPolicy?: string;
    refundPolicy?: string;
    shippingPolicy?: string;
    termsPolicy?: string;
  };
  refundPolicy?: string | SellerRefundPolicy;
  isActive?: boolean;
  approvalStatus?: ApprovalStatus;
  rejectionReason?: string;
  createdAt?: string;
}

export interface SellerProductPayload {
  title: string;
  description?: string;
  shortDescription?: string;
  brand?: string;
  category: string;
  subCategory?: string;
  gender?: string;
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
  policyRefs?: {
    returnPolicy?: string;
    refundPolicy?: string;
    shippingPolicy?: string;
    termsPolicy?: string;
  };
  refundPolicy?: string;
  existingImages?: Array<{ url: string; fileId: string }>;
  isActive?: boolean;
}

export interface SellerMarketplaceConfig {
  marketplace?: {
    commissionPercent?: number;
  };
  delivery?: {
    riderPayoutRules?: {
      upto3Km?: number;
      upto5Km?: number;
      upto8Km?: number;
      extraPerKmAfter8?: number;
    };
    bonusRules?: {
      rainBonus?: number;
      peakBonus?: number;
      festivalBonus?: number;
      nightBonus?: number;
    };
  };
}

export interface SellerOrder {
  _id: string;
  orderId: string;
  customer?: {
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
    sellerSubtotal?: number;
  }>;
  sellerSubtotal: number;
  payableAmount: number;
  status: OrderStatus;
  shippingAddress?: {
    fullName?: string;
    phone?: string;
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  paymentInfo?: {
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
  };
  createdAt?: string;
}

export interface SellerSubOrder {
  _id: string;
  subOrderId: string;
  parentOrderId?: {
    _id: string;
    orderId: string;
    userId?: {
      _id: string;
      fullName?: string;
      email?: string;
      phone?: string;
    };
    shippingAddress?: {
      fullName?: string;
      phone?: string;
      street?: string;
      city?: string;
      state?: string;
      pincode?: string;
    };
  };
  items: Array<{
    productId: string;
    title: string;
    sku: string;
    size: string;
    color: string;
    quantity: number;
    price: number;
    sellerSubtotal?: number;
  }>;
  subtotal: number;
  payableAmount: number;
  status: string;
  packageDetails?: {
    weight?: number;
    packageCount?: number;
    isFragile?: boolean;
    isCod?: boolean;
    pickupNotes?: string;
    dimensions?: {
      length: number;
      width: number;
      height: number;
    };
  };
  delivery?: {
    status?: string;
    pickupOtp?: string;
    deliveryOtp?: string;
    payoutAmount?: number;
    pickupPhoto?: string;
    deliveryPhoto?: string;
  };
  createdAt?: string;
}

export interface SellerCoupon {
  _id: string;
  code: string;
  description: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minOrderValue: number;
  maxDiscountAmount?: number;
  usageLimit: number;
  usedCount: number;
  usageLimitPerUser: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  approvalStatus?: ApprovalStatus;
  rejectionReason?: string;
  appliesTo?: "ALL" | "SPECIFIC";
  productIds?: string[];
}

export interface SellerCouponPayload {
  code: string;
  description: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minOrderValue?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usageLimitPerUser?: number;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  appliesTo?: "ALL" | "SPECIFIC";
  productIds?: string[];
}

export interface SellerBanner {
  _id: string;
  title?: string;
  subtitle?: string;
  image: string;
  imagePublicId: string;
  redirectType: "product" | "category" | "collection" | "external";
  externalUrl?: string;
  placement: "home_top" | "home_middle" | "category";
  priority?: number;
  isActive: boolean;
  approvalStatus?: ApprovalStatus;
  rejectionReason?: string;
}

export interface SellerBannerPayload {
  title?: string;
  subtitle?: string;
  redirectType: "product" | "category" | "collection" | "external";
  externalUrl?: string;
  placement?: "home_top" | "home_middle" | "category";
  priority?: number;
  isActive?: boolean;
}

export interface SellerSizeChart {
  _id: string;
  name: string;
  description?: string;
  category: string;
  unit: "inches" | "cm";
  fields: string[];
  data: Array<Record<string, string | number>>;
  howToMeasure?: string[];
  productIds?: string[];
  scope?: "GLOBAL" | "SELLER";
  isActive?: boolean;
  approvalStatus?: ApprovalStatus;
  rejectionReason?: string;
}

export interface SellerSizeChartPayload {
  name: string;
  description?: string;
  category: string;
  unit: "inches" | "cm";
  fields: string[];
  data: Array<Record<string, string | number>>;
  howToMeasure?: string[];
  productIds?: string[];
  isActive?: boolean;
}

export interface SellerRefundPolicy {
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

export interface SellerPolicy {
  _id: string;
  name: string;
  policyType: "RETURN" | "REFUND" | "SHIPPING" | "TERMS" | "GENERAL";
  category?: string;
  description?: string;
  returnWindowDays?: number;
  refundProcessingDays?: number;
  conditions?: string[];
  refundType?: string;
  returnShipping?: string;
  isReturnable?: boolean;
  isExchangeAvailable?: boolean;
  isActive: boolean;
}

export interface SellerWarehouse {
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

export interface SellerInventoryProduct {
  _id: string;
  title: string;
  sku?: string;
  brand?: string;
  category?: string;
  subCategory?: string;
  price?: number;
  originalPrice?: number;
  images?: Array<{ url: string; fileId: string }>;
  totalStock?: number;
  variants: ProductVariantPayload[];
  approvalStatus?: ApprovalStatus;
  isActive?: boolean;
  lowStock?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SellerInventoryMovement {
  _id: string;
  productId: string | { _id: string; title?: string };
  sku: string;
  variantLabel?: string;
  movementType: "IN" | "OUT" | "ADJUSTMENT" | "ORDER" | "RETURN";
  quantity: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  createdAt?: string;
}

export interface SellerCustomer {
  _id: string;
  fullName?: string;
  email?: string;
  phone?: string;
  orderCount: number;
  revenue: number;
  lastOrderAt?: string;
}

export interface SellerNotification {
  _id: string;
  type: string;
  title: string;
  message: string;
  severity: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  isRead: boolean;
  createdAt?: string;
}

export interface SellerReports {
  summary: {
    orders: number;
    unitsSold: number;
    grossRevenue: number;
    deliveredRevenue: number;
    customers: number;
  };
  productPerformance: Array<{
    productId: string;
    title: string;
    sku: string;
    quantity: number;
    revenue: number;
  }>;
  inventory: {
    totalProducts: number;
    activeProducts: number;
    lowStockProducts: number;
    totalStock: number;
  };
}

export interface SellerCategoriesResponse {
  assigned: {
    primaryCategory?: string;
    subcategories?: string[];
    assignedByAdmin?: boolean;
  } | null;
  available: Array<{ _id: string; title: string; slug: string; isActive?: boolean }>;
  requests: Array<{
    _id: string;
    requestedPrimaryCategory: string;
    requestedSubcategories?: string[];
    status: "PENDING" | "APPROVED" | "REJECTED";
    rejectionReason?: string;
  }>;
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

const productFormData = (payload: Partial<SellerProductPayload>, images?: File[]) => {
  const formData = new FormData();
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
  appendOptional(formData, "gender", payload.gender);
  appendOptional(formData, "policyRefs", payload.policyRefs);
  appendOptional(formData, "refundPolicy", payload.refundPolicy);
  appendOptional(formData, "existingImages", payload.existingImages);
  appendOptional(formData, "isActive", payload.isActive);
  images?.forEach((image) => formData.append("images", image));
  return formData;
};

const bannerFormData = (payload: Partial<SellerBannerPayload>, image?: File) => {
  const formData = new FormData();
  appendOptional(formData, "title", payload.title);
  appendOptional(formData, "subtitle", payload.subtitle);
  appendOptional(formData, "redirectType", payload.redirectType);
  appendOptional(formData, "externalUrl", payload.externalUrl);
  appendOptional(formData, "placement", payload.placement);
  appendOptional(formData, "priority", payload.priority);
  appendOptional(formData, "isActive", payload.isActive);
  if (image) formData.append("image", image);
  return formData;
};

export const sellerManagementApi = {
  getDashboard: async (): Promise<SellerDashboard> => {
    const response = await axiosInstance.get("/sellers/dashboard");
    return response.data.data;
  },

  getSetupStatus: async (): Promise<SellerSetupStatus> => {
    const response = await axiosInstance.get("/sellers/setup-status");
    return response.data.data;
  },

  getStore: async (): Promise<SellerStoreResponse> => {
    const response = await axiosInstance.get("/sellers/store");
    return response.data.data;
  },

  getAppConfig: async (): Promise<SellerMarketplaceConfig> => {
    const response = await axiosInstance.get("/app-config");
    return response.data.data;
  },

  saveStore: async (payload: SellerStorePayload): Promise<SellerStoreResponse> => {
    const response = await axiosInstance.put("/sellers/store", payload);
    return response.data.data;
  },

  toggleStoreOpen: async (isOpen: boolean) => {
    const response = await axiosInstance.patch("/sellers/store/open", { isOpen });
    return response.data.data;
  },

  getProducts: async (params: SellerQueryParams): Promise<PaginatedResult<SellerProduct>> => {
    const response = await axiosInstance.get("/sellers/products", { params });
    return normalizePaginated(response.data.data, params.page, params.limit);
  },

  createProduct: async ({ payload, images }: { payload: SellerProductPayload; images: File[] }): Promise<SellerProduct> => {
    const response = await axiosInstance.post("/sellers/products", productFormData(payload, images), {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data;
  },

  updateProduct: async ({ productId, payload, images }: { productId: string; payload: Partial<SellerProductPayload>; images?: File[] }): Promise<SellerProduct> => {
    const response = await axiosInstance.patch(`/sellers/products/${productId}`, productFormData(payload, images), {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data;
  },

  deleteProduct: async (productId: string) => {
    const response = await axiosInstance.delete(`/sellers/products/${productId}`);
    return response.data.data;
  },

  submitProduct: async (productId: string): Promise<SellerProduct> => {
    const response = await axiosInstance.patch(`/sellers/products/${productId}/submit`, {});
    return response.data.data;
  },

  getCategories: async (): Promise<SellerCategoriesResponse> => {
    const response = await axiosInstance.get("/sellers/categories");
    return response.data.data;
  },

  getRefundPolicies: async (): Promise<SellerRefundPolicy[]> => {
    const response = await axiosInstance.get("/sellers/refund-policies");
    return response.data.data;
  },

  getPolicies: async (type?: string): Promise<SellerPolicy[]> => {
    const response = await axiosInstance.get("/sellers/policies", { params: { type } });
    return response.data.data;
  },

  getWarehouses: async (): Promise<SellerWarehouse[]> => {
    const response = await axiosInstance.get("/sellers/warehouses");
    return response.data.data;
  },

  requestCategoryChange: async (payload: { requestedPrimaryCategory: string; requestedSubcategories?: string[]; message?: string }) => {
    const response = await axiosInstance.post("/sellers/category-requests", payload);
    return response.data.data;
  },

  getInventory: async (params: SellerQueryParams): Promise<PaginatedResult<SellerInventoryProduct>> => {
    const response = await axiosInstance.get("/sellers/inventory", { params });
    return normalizePaginated(response.data.data, params.page, params.limit);
  },

  getInventoryMovements: async (params: SellerQueryParams): Promise<PaginatedResult<SellerInventoryMovement>> => {
    const response = await axiosInstance.get("/sellers/inventory/movements", { params });
    return normalizePaginated(response.data.data, params.page, params.limit);
  },

  updateStock: async (payload: { productId: string; sku: string; stock: number; reason?: string }) => {
    const response = await axiosInstance.patch("/sellers/inventory/stock", payload);
    return response.data.data;
  },

  getOrders: async (params: SellerQueryParams): Promise<PaginatedResult<SellerOrder>> => {
    const response = await axiosInstance.get("/sellers/orders", { params });
    return normalizePaginated(response.data.data, params.page, params.limit);
  },

  updateOrderStatus: async ({ orderId, status }: { orderId: string; status: "CONFIRMED" | "PROCESSING" | "SHIPPED" }) => {
    const response = await axiosInstance.patch(`/sellers/orders/${orderId}/status`, { status });
    return response.data.data;
  },

  getSubOrders: async (params: SellerQueryParams): Promise<PaginatedResult<SellerSubOrder>> => {
    const response = await axiosInstance.get("/sellers/sub-orders", { params });
    return normalizePaginated(response.data.data, params.page, params.limit);
  },

  getSubOrder: async (id: string): Promise<SellerSubOrder> => {
    const response = await axiosInstance.get(`/sellers/sub-orders/${id}`);
    return response.data.data;
  },

  updateSubOrderStatus: async ({
    subOrderId,
    status,
    packageDetails,
  }: {
    subOrderId: string;
    status: string;
    packageDetails?: Record<string, unknown>;
  }) => {
    const response = await axiosInstance.patch(`/sellers/sub-orders/${subOrderId}/status`, { status, packageDetails });
    return response.data.data;
  },

  approveSubOrderCancellation: async ({ subOrderId, approve }: { subOrderId: string; approve: boolean }) => {
    const response = await axiosInstance.post(`/sellers/sub-orders/${subOrderId}/cancellation-approval`, { approve });
    return response.data.data;
  },

  getCoupons: async (params: SellerQueryParams): Promise<PaginatedResult<SellerCoupon>> => {
    const response = await axiosInstance.get("/sellers/coupons", { params });
    return normalizePaginated(response.data.data, params.page, params.limit);
  },

  createCoupon: async (payload: SellerCouponPayload): Promise<SellerCoupon> => {
    const response = await axiosInstance.post("/sellers/coupons", payload);
    return response.data.data;
  },

  updateCoupon: async ({ couponId, payload }: { couponId: string; payload: Partial<SellerCouponPayload> }): Promise<SellerCoupon> => {
    const response = await axiosInstance.patch(`/sellers/coupons/${couponId}`, payload);
    return response.data.data;
  },

  deleteCoupon: async (couponId: string) => {
    const response = await axiosInstance.delete(`/sellers/coupons/${couponId}`);
    return response.data.data;
  },

  submitCoupon: async (couponId: string): Promise<SellerCoupon> => {
    const response = await axiosInstance.patch(`/sellers/coupons/${couponId}/submit`, {});
    return response.data.data;
  },

  getCustomers: async (params: SellerQueryParams): Promise<PaginatedResult<SellerCustomer>> => {
    const response = await axiosInstance.get("/sellers/customers", { params });
    return normalizePaginated(response.data.data, params.page, params.limit);
  },

  getBanners: async (params: SellerQueryParams): Promise<PaginatedResult<SellerBanner>> => {
    const response = await axiosInstance.get("/sellers/banners", { params });
    return normalizePaginated(response.data.data, params.page, params.limit);
  },

  createBanner: async ({ payload, image }: { payload: SellerBannerPayload; image?: File }): Promise<SellerBanner> => {
    const response = await axiosInstance.post("/sellers/banners", bannerFormData(payload, image), {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data;
  },

  updateBanner: async ({ bannerId, payload, image }: { bannerId: string; payload: Partial<SellerBannerPayload>; image?: File }): Promise<SellerBanner> => {
    const response = await axiosInstance.patch(`/sellers/banners/${bannerId}`, bannerFormData(payload, image), {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data;
  },

  deleteBanner: async (bannerId: string) => {
    const response = await axiosInstance.delete(`/sellers/banners/${bannerId}`);
    return response.data.data;
  },

  submitBanner: async (bannerId: string): Promise<SellerBanner> => {
    const response = await axiosInstance.patch(`/sellers/banners/${bannerId}/submit`, {});
    return response.data.data;
  },

  getSizeCharts: async (params: SellerQueryParams): Promise<PaginatedResult<SellerSizeChart>> => {
    const response = await axiosInstance.get("/sellers/size-charts", { params });
    return normalizePaginated(response.data.data, params.page, params.limit);
  },

  createSizeChart: async (payload: SellerSizeChartPayload): Promise<SellerSizeChart> => {
    const response = await axiosInstance.post("/sellers/size-charts", payload);
    return response.data.data;
  },

  updateSizeChart: async ({ chartId, payload }: { chartId: string; payload: Partial<SellerSizeChartPayload> }): Promise<SellerSizeChart> => {
    const response = await axiosInstance.patch(`/sellers/size-charts/${chartId}`, payload);
    return response.data.data;
  },

  deleteSizeChart: async (chartId: string) => {
    const response = await axiosInstance.delete(`/sellers/size-charts/${chartId}`);
    return response.data.data;
  },

  submitSizeChart: async (chartId: string): Promise<SellerSizeChart> => {
    const response = await axiosInstance.patch(`/sellers/size-charts/${chartId}/submit`, {});
    return response.data.data;
  },

  assignSizeChartProducts: async ({ chartId, productIds }: { chartId: string; productIds: string[] }) => {
    const response = await axiosInstance.patch(`/sellers/size-charts/${chartId}/assign-products`, { productIds });
    return response.data.data;
  },

  getPayouts: async () => {
    const response = await axiosInstance.get("/sellers/payouts");
    return response.data.data as { payouts: unknown[]; earnings: unknown[] };
  },

  addPayoutMethod: async (payload: SellerPayoutMethodPayload): Promise<SellerPayoutMethod> => {
    const response = await axiosInstance.post("/sellers/payout-methods", payload);
    return response.data.data;
  },

  setDefaultPayoutMethod: async (methodId: string): Promise<SellerPayoutMethod[]> => {
    const response = await axiosInstance.patch(`/sellers/payout-methods/${methodId}/default`);
    return response.data.data;
  },

  requestPayout: async (payload: { amount: number; payoutMethodId: string; note?: string }) => {
    const response = await axiosInstance.post("/sellers/payout-requests", payload);
    return response.data.data;
  },

  getReports: async (params: SellerQueryParams): Promise<SellerReports> => {
    const response = await axiosInstance.get("/sellers/reports", { params });
    return response.data.data;
  },

  getNotifications: async (params: SellerQueryParams): Promise<PaginatedResult<SellerNotification>> => {
    const response = await axiosInstance.get("/sellers/notifications", { params });
    return normalizePaginated(response.data.data, params.page, params.limit);
  },

  markNotificationRead: async (notificationId: string): Promise<SellerNotification> => {
    const response = await axiosInstance.patch(`/sellers/notifications/${notificationId}/read`);
    return response.data.data;
  },

  requestMallConnection: async (payload: {
    mallId: string;
    mallUnit?: string;
    mallFloor?: string;
    message?: string;
  }) => {
    const response = await axiosInstance.post("/sellers/mall-request", payload);
    return response.data.data;
  },

  requestMallCreation: async (payload: SellerMallCreatePayload) => {
    const response = await axiosInstance.post("/sellers/malls", payload);
    return response.data.data;
  },
};
