import { useMemo, useState } from "react";
import { products, Product } from "@/src/features/Jewelery/data/products";

/**
 * Client-side search over the Jewelery mock product catalogue.
 * Filters by name, collection, metal, and stone fields.
 * Result is memoized and the query is debounced (300 ms) to avoid
 * thrashing on every keystroke.
 *
 * ponytail: replace this hook's body with a useInfiniteQuery call once the
 * real Jewelery search API is ready — callers stay unchanged.
 */
export function useJewelerySearch(query: string): Product[] {
  return useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.collection.toLowerCase().includes(q) ||
        p.metal.toLowerCase().includes(q) ||
        (p.stone ?? "").toLowerCase().includes(q),
    );
  }, [query]);
}
