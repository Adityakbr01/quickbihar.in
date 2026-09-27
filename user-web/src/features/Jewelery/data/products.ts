import type { IProduct } from "@/src/features/clothing/product/types/product.types";
import { ProductTryOnConfig } from "@/src/features/Jewelery/utils/tryOn";

/**
 * Jewelery UI product shape. Data comes from the server catalog
 * (see api/jewelery.api.ts `toJeweleryProduct`) — no mock items here.
 */
export interface Product {
  id: string;
  name: string;
  subtitle: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  badge?: "New" | "Bestseller" | "Limited";
  collection: string;
  metal: string;
  stone?: string;
  weight?: string;
  purity?: string;
  /** True when the server piece carries a hallmark/BIS mark. */
  hallmarked?: boolean;
  occasions: string[];
  description: string;
  craftDetail: string;
  image: any;
  images: any[];
  inStock: number;
  tryOn?: ProductTryOnConfig;
  /** Server IProduct behind this UI item (set by toJeweleryProduct). Enables real cart/wishlist/checkout. */
  _raw?: IProduct;
}
