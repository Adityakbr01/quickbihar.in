
import axiosInstance from "@/src/api/axiosInstance";
import { IProduct } from "../types/product.types";

/**
 * Fetch all products (Admin/Seller view)
 */
export const getAllProductsAdminRequest = async (): Promise<{ data: IProduct[]; total: number }> => {
  const response = await axiosInstance.get("/products");
  return response.data.data;
};

/**
 * Fetch public products with pagination and filters
 */
export const getPublicProductsRequest = async (params: {
  vertical?: string;
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  subCategory?: string;
  gender?: string;
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  sortBy?: string;
  isTrending?: boolean;
  isFeatured?: boolean;
  isNewArrival?: boolean;
}): Promise<{ data: IProduct[]; total: number }> => {
  const response = await axiosInstance.get("/products/public", {
    params: { vertical: "CLOTHING", ...params },
  });
  return response.data.data;
};

/**
 * Fetch trending products (Top Selling)
 */
export const getTrendingProductsRequest = async (params?: {
  vertical?: string;
  category?: string;
  limit?: number;
}): Promise<{ data: IProduct[]; total: number }> => {
  const response = await axiosInstance.get("/products/trending", {
    params: { vertical: "CLOTHING", ...params },
  });
  return response.data.data;
};

/**
 * Create a new product (Multipart for images)
 */
export const createProductRequest = async (formData: FormData): Promise<IProduct> => {
  const response = await axiosInstance.post("/products", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data.data;
};

/**
 * Update an existing product
 */
export const updateProductRequest = async ({ id, data }: { id: string; data: any }): Promise<IProduct> => {
  const isFormData = data instanceof FormData;
  const response = await axiosInstance.patch(`/products/${id}`, data, {
    headers: isFormData ? { "Content-Type": "multipart/form-data" } : {},
  });
  return response.data.data;
};

/**
 * Delete a product
 */
export const deleteProductRequest = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/products/${id}`);
};

/**
 * Fetch a single product by ID
 */
export const getProductByIdRequest = async (id: string): Promise<IProduct> => {
  const response = await axiosInstance.get(`/products/${id}`);
  return response.data.data;
};

/**
 * Fetch similar products by product ID (uses tags, category, brand matching)
 */
export const getSimilarProductsRequest = async (id: string, limit = 10): Promise<IProduct[]> => {
  const response = await axiosInstance.get(`/products/${id}/similar`, { params: { limit } });
  return response.data.data;
};

/**
 * Fetch real product reviews and rating distribution stats
 */
export const getProductReviewsRequest = async (
  id: string,
  params?: { page?: number; limit?: number }
): Promise<{
  reviews: any[];
  stats: {
    averageRating: number;
    totalReviews: number;
    distribution: { [key: number]: number };
    positivePercentage: number;
  };
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}> => {
  const response = await axiosInstance.get(`/products/${id}/reviews`, { params });
  return response.data.data;
};

/**
 * Submit a customer rating and review
 */
export const createProductReviewRequest = async (
  id: string,
  data: { rating: number; title?: string; comment: string; images?: { url: string; fileId?: string }[] }
): Promise<any> => {
  const response = await axiosInstance.post(`/products/${id}/reviews`, data);
  return response.data.data;
};

/**
 * Vote a review as helpful (toggle)
 */
export const voteHelpfulReviewRequest = async (
  productId: string,
  reviewId: string
): Promise<{ helpfulCount: number; hasVoted: boolean }> => {
  const response = await axiosInstance.post(`/products/${productId}/reviews/${reviewId}/helpful`);
  return response.data.data;
};


