import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  getJeweleryCategories,
  getJeweleryNewArrivals,
  getJeweleryProductById,
  getJeweleryProducts,
  getJeweleryTrending,
  getSimilarJewelery,
  toJeweleryProduct,
  toJeweleryProducts,
  type JeweleryListParams,
} from "../api/jewelery.api";

/** Paginated jewelry catalog (mirrors clothing useSearchProducts). */
export function useJeweleryProducts(params: JeweleryListParams = {}, enabled = true) {
  const { page: _p, limit: _l, ...filters } = params;
  return useInfiniteQuery({
    queryKey: ["jewelery-products", filters],
    queryFn: async ({ pageParam = 1 }) => {
      const result = await getJeweleryProducts({ page: pageParam, limit: 10, ...filters });
      return { ...result, data: toJeweleryProducts(result.data) };
    },
    getNextPageParam: (lastPage, allPages) => {
      const loadedCount = allPages.length * 10;
      return loadedCount < lastPage.total ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
    enabled,
  });
}

/** Live search over the server catalog (replaces mock useJewelerySearch). */
export function useJewelerySearch(query: string) {
  return useJeweleryProducts({ search: query.trim() || undefined, limit: 20 }, true);
}

export function useJeweleryBestsellers(limit = 8) {
  return useQuery({
    queryKey: ["jewelery-bestsellers", limit],
    queryFn: async () => toJeweleryProducts((await getJeweleryTrending(limit)).data),
  });
}

export function useJeweleryNewArrivals(limit = 8) {
  return useQuery({
    queryKey: ["jewelery-new-arrivals", limit],
    queryFn: async () => toJeweleryProducts((await getJeweleryNewArrivals(limit)).data),
  });
}

export function useJeweleryProduct(id: string | undefined) {
  return useQuery({
    queryKey: ["jewelery-product", id],
    queryFn: async () => toJeweleryProduct(await getJeweleryProductById(id!)),
    enabled: !!id,
  });
}

export function useSimilarJewelery(id: string | undefined, limit = 4) {
  return useQuery({
    queryKey: ["jewelery-similar", id],
    queryFn: async () => toJeweleryProducts(await getSimilarJewelery(id!, limit)),
    enabled: !!id,
  });
}

export function useJeweleryCategories() {
  return useQuery({
    queryKey: ["jewelery-categories"],
    queryFn: getJeweleryCategories,
    staleTime: 60 * 60 * 1000,
  });
}
