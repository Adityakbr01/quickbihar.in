
import axiosInstance from "@/src/api/axiosInstance";
import { IProduct } from "../types/product.types";

/**
 * Fetch all products (Admin/Seller view)
 */
export const getAllProductsAdminRequest = async (): Promise<IProduct[]> => {
  const response = await axiosInstance.get("/products");
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
  const response = await axiosInstance.patch(`/products/${id}`, data);
  return response.data.data;
};

/**
 * Delete a product
 */
export const deleteProductRequest = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/products/${id}`);
};
