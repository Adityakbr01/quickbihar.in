import axiosInstance from "@/src/api/axiosInstance";
import { Category } from "../types/category.types";

/**
 * Fetch all active categories for the home screen
 */
export const getPublicCategoriesRequest = async (params?: { vertical?: string }): Promise<Category[]> => {
    const response = await axiosInstance.get("/categories/public", { params });
    return response.data.data.reverse();
};

/**
 * Fetch a single ACTIVE category by slug (canonical SEO lookup, plan §26 A1).
 */
export const getCategoryBySlugRequest = async (slug: string): Promise<Category> => {
    const response = await axiosInstance.get(`/categories/slug/${encodeURIComponent(slug)}`);
    return response.data.data;
};
