import {
  useJeweleryBestsellers,
  useJeweleryCategories,
  useJeweleryNewArrivals,
} from "@/src/features/Jewelery/hooks/useJeweleryCatalog";

export function useJeweleryHomeData() {
  const heroQuery = useJeweleryBestsellers(4);
  const bestsellersQuery = useJeweleryBestsellers(6);
  const newArrivalsQuery = useJeweleryNewArrivals(8);
  const categoriesQuery = useJeweleryCategories();

  return {
    heroItems: heroQuery.data ?? [],
    heroLoading: heroQuery.isLoading,
    bestsellers: bestsellersQuery.data ?? [],
    bestsellersLoading: bestsellersQuery.isLoading,
    newArrivals: newArrivalsQuery.data ?? [],
    newArrivalsLoading: newArrivalsQuery.isLoading,
    categories: categoriesQuery.data ?? [],
    categoriesLoading: categoriesQuery.isLoading,
  };
}

export { useJeweleryBestsellers, useJeweleryNewArrivals, useJeweleryCategories };
