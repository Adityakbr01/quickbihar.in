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
export const getAllCategoriesRequest = async (token: string): Promise<Category[]> => {
    const response = await axiosInstance.get("/categories", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return response.data.data;
};
