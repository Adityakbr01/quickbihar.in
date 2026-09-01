import axiosInstance from "@/src/api/axiosInstance";
import { Category } from "../types/category.types";

/**
 * Fetch all active categories for the home screen
 */
export const getPublicCategoriesRequest = async (params?: { vertical?: string }): Promise<Category[]> => {
    const response = await axiosInstance.get("/categories/public", { params });
    return response.data.data.reverse();
};
