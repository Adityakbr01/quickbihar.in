import axiosInstance from "@/src/api/axiosInstance";
import { Category } from "../types/category.types";

/**
 * Fetch all active categories for the home screen
 */
export const getPublicCategoriesRequest = async (): Promise<Category[]> => {
    const response = await axiosInstance.get("/categories/public");
    return response.data.data.reverse();
};

/**
 * Fetch all categories for admin management
 */
export const getAllCategoriesAdminRequest = async (): Promise<Category[]> => {
    const response = await axiosInstance.get("/categories");
    return response.data.data;
};

/**
 * Create a new category
 */
export const createCategoryRequest = async (data: FormData): Promise<Category> => {
    const response = await axiosInstance.post("/categories", data, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    });
    return response.data.data;
};

/**
 * Update an existing category
 */
export const updateCategoryRequest = async ({ id, data }: { id: string, data: FormData }): Promise<Category> => {
    const response = await axiosInstance.patch(`/categories/${id}`, data, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    });
    return response.data.data;
};

/**
 * Delete a category
 */
export const deleteCategoryRequest = async (id: string): Promise<void> => {
    await axiosInstance.delete(`/categories/${id}`);
};