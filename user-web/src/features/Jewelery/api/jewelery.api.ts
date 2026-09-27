import {
  getProductByIdRequest,
  getPublicProductsRequest,
  getSimilarProductsRequest,
  getTrendingProductsRequest,
} from "@/src/features/clothing/product/api/product.api";
import { getPublicCategoriesRequest } from "@/src/features/common/category/api/category.api";
import type { IProduct } from "@/src/features/clothing/product/types/product.types";
import type { Product } from "../data/products";

/**
 * Jewelery catalog API — thin layer over the shared commerce APIs with
 * vertical=JEWELERY baked in (same backend, same auth/orders/wishlist rules
 * as clothing; see server modules/clothing/products + modules/common/*).
 */
export const JEWELERY_VERTICAL = "JEWELERY";

export interface JeweleryListParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  subCategory?: string;
  categoryId?: string;
  categoryName?: string;
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  sortBy?: string;
  isTrending?: boolean;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  minRating?: number;
}

export async function getJeweleryProducts(params: JeweleryListParams = {}) {
  return getPublicProductsRequest({ ...params, vertical: JEWELERY_VERTICAL });
}

export async function getJeweleryTrending(limit = 8) {
  return getTrendingProductsRequest({ vertical: JEWELERY_VERTICAL, limit });
}

export async function getJeweleryNewArrivals(limit = 8) {
  return getPublicProductsRequest({ vertical: JEWELERY_VERTICAL, isNewArrival: true, limit });
}

export async function getJeweleryProductById(id: string): Promise<IProduct> {
  return getProductByIdRequest(id);
}

export async function getSimilarJewelery(id: string, limit = 4): Promise<IProduct[]> {
  return getSimilarProductsRequest(id, limit);
}

export async function getJeweleryCategories() {
  return getPublicCategoriesRequest({ vertical: JEWELERY_VERTICAL });
}

/**
 * Adapt a server IProduct to the Jewelery UI Product shape so existing
 * screens/components keep working while the data source becomes real.
 * tryOn stays undefined until the backend serves try-on models.
 */
export function toJeweleryProduct(p: IProduct): Product {
  const jd = p.jeweleryDetails ?? {};
  const metal = jd.metalType ?? "";
  const purityLabel = jd.purity
    ? jd.hallmark
      ? `${jd.purity} BIS Hallmarked`
      : jd.purity
    : undefined;
  const firstImage = p.images?.[0]?.url;
  return {
    id: p._id,
    name: p.title,
    subtitle: [jd.purity, metal].filter(Boolean).join(" ") || p.brand || p.category,
    price: p.price,
    originalPrice: p.originalPrice && p.originalPrice > p.price ? p.originalPrice : undefined,
    rating: p.ratings?.average ?? 0,
    reviewCount: p.ratings?.count ?? 0,
    badge: p.isNewArrival ? "New" : p.isTrending ? "Bestseller" : undefined,
    collection: p.subCategory || p.category,
    metal,
    stone: jd.gemstone,
    weight: jd.weightGrams != null ? `${jd.weightGrams}g` : undefined,
    purity: purityLabel,
    occasions: p.tags ?? [],
    description: p.description || "",
    craftDetail: p.compliance?.manufacturerDetail || "",
    image: firstImage ? { uri: firstImage } : null,
    images: (p.images ?? []).map((img) => ({ uri: img.url })),
    inStock: p.totalStock ?? 0,
    tryOn: undefined,
    hallmarked: Boolean(jd.hallmark || (jd as any).bisMark || (jd as any).huid),
    _raw: p,
  };
}

export function toJeweleryProducts(list: IProduct[]): Product[] {
  return (list ?? []).map(toJeweleryProduct);
}
