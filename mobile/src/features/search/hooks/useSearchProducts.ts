import { useInfiniteQuery } from "@tanstack/react-query";
import { getPublicProductsRequest } from "../../product/api/product.api";

export interface SearchFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  sortBy?: string;
}

export const useSearchProducts = (query: string, filters: SearchFilters = {}) => {
  return useInfiniteQuery({
    queryKey: ["search-products", query, filters],
    queryFn: async ({ pageParam = 1 }) => {
      const result = await getPublicProductsRequest({
        page: pageParam,
        limit: 10,
        search: query || undefined,
        ...filters,
      });
      return result;
    },
    getNextPageParam: (lastPage, allPages) => {
      const loadedCount = allPages.length * 10;
      return loadedCount < lastPage.total ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: true, // Always enabled, search component handles empty query state
  });
};
