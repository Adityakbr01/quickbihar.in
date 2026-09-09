import { useQuery } from "@tanstack/react-query";
import { getCategoryBySlugRequest, getPublicCategoriesRequest } from "../api/category.api";
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

/**
 * Hook for a single ACTIVE category by slug (canonical SEO lookup, plan §26 A1).
 */
export const useCategoryBySlug = (slug: string) => {
  return useQuery<Category, Error>({
    queryKey: ["category", "slug", slug],
    queryFn: () => getCategoryBySlugRequest(slug),
    enabled: !!slug,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};
