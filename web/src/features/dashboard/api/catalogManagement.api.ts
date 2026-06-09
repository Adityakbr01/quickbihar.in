import axiosInstance from "@/lib/axios";

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
  };
  status: OrderStatus;
  cancellationReason?: string;
  paymentInfo?: {
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
  };
  couponCode?: string;
  createdAt?: string;
}

export type CouponDiscountType = "PERCENTAGE" | "FIXED";

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
  details?: {
    sku?: string;
    fit?: string;
    material?: string;
  };
  tags?: string[];
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
  isFeatured?: boolean;
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
  variants: ProductVariantPayload[];
  details?: {
    sku?: string;
  };
  tags?: string[];
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
  isFeatured?: boolean;
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
  appendOptional(formData, "variants", payload.variants);
  appendOptional(formData, "details", payload.details);
  appendOptional(formData, "tags", payload.tags);
  appendOptional(formData, "seo", payload.seo);
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

export const catalogManagementApi = {
  getOrders: async (params: QueryParams): Promise<PaginatedResult<AdminOrder>> => {
    const response = await axiosInstance.get("/orders/admin/all", { params });
    return normalizePaginated<AdminOrder>(response.data.data, params.page, params.limit);
  },

  updateOrderStatus: async ({ orderId, status, cancellationReason }: { orderId: string; status: OrderStatus; cancellationReason?: string }) => {
    const response = await axiosInstance.patch(`/orders/admin/status/${orderId}`, { status, cancellationReason });
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
};
