import { useQuery } from "@tanstack/react-query";
import { getPublicCategoriesRequest } from "../api/category.api";
import { Category } from "../types/category.types";

/**
 * Hook for public categories (home screen)
 */
export const useCategories = (params?: { vertical?: string }) => {
  return useQuery<Category[], Error>({
    queryKey: ["categories", "public", params?.vertical || "all"],
    queryFn: () => getPublicCategoriesRequest(params),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};
