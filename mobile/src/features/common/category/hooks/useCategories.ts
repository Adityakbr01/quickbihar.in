import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getPublicCategoriesRequest,
    getAllCategoriesAdminRequest,
    createCategoryRequest,
    updateCategoryRequest,
    deleteCategoryRequest
} from "../api/category.api";
import { Category } from "../types/category.types";

/**
 * Hook for public categories (home screen)
 */
export const useCategories = () => {
    return useQuery<Category[], Error>({
        queryKey: ["categories", "public"],
        queryFn: getPublicCategoriesRequest,
        staleTime: 1000 * 60 * 60, // 1 hour
    });
};

/**
 * Hook for admin categories (management)
 */
export const useAdminCategories = () => {
    return useQuery<Category[], Error>({
        queryKey: ["categories", "admin"],
        queryFn: getAllCategoriesAdminRequest,
    });
};

/**
 * Mutation for creating a category
 */
export const useCreateCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createCategoryRequest,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] });
        },
    });
};

/**
 * Mutation for updating a category
 */
export const useUpdateCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateCategoryRequest,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] });
        },
    });
};

/**
 * Mutation for deleting a category
 */
export const useDeleteCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteCategoryRequest,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] });
        },
    });
};