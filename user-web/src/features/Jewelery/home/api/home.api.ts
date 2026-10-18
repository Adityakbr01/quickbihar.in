import {
  getJeweleryCategories,
  getJeweleryNewArrivals,
  getJeweleryTrending,
  toJeweleryProducts,
} from "@/src/features/Jewelery/api/jewelery.api";

export async function getHomeBestsellers(limit = 6) {
  const res = await getJeweleryTrending(limit);
  return toJeweleryProducts(res.data);
}

export async function getHomeNewArrivals(limit = 8) {
  const res = await getJeweleryNewArrivals(limit);
  return toJeweleryProducts(res.data);
}

export async function getHomeCategories() {
  return getJeweleryCategories();
}
