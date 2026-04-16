
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
  page?: number; 
  limit?: number; 
  search?: string; 
  category?: string;
}): Promise<{ data: IProduct[]; total: number }> => {
  const response = await axiosInstance.get("/products/public", { params });
  return response.data.data;
};

/**
 * Fetch trending products (Top Selling)
 */
export const getTrendingProductsRequest = async (): Promise<{ data: IProduct[]; total: number }> => {
  const response = await axiosInstance.get("/products/trending");
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


