/**
 * Central catalog-vertical config shared by the admin + seller product forms.
 * One tab per vertical keeps each form tailored instead of one giant
 * conditional form. Server enum: CLOTHING | FOOD | JEWELERY (+ GLOBAL for
 * categories). Backend spelling is JEWELERY (not JEWELLERY) — keep in sync.
 */

export type CatalogVertical = "CLOTHING" | "FOOD" | "JEWELERY";

export const CATALOG_VERTICALS: Array<{ value: CatalogVertical; label: string; hint: string }> = [
  { value: "CLOTHING", label: "Clothing", hint: "Apparel, footwear, fashion" },
  { value: "JEWELERY", label: "Jewelry", hint: "Gold, diamond, BIS hallmarked" },
  { value: "FOOD", label: "Food", hint: "Grocery, snacks, beverages" },
];

export const JEWELERY_PURITIES = [
  "24K",
  "22K",
  "18K",
  "14K",
  "925 Silver",
  "Platinum",
  "Other",
] as const;

export const FOOD_TYPES = ["VEG", "NON_VEG", "EGG"] as const;

export interface JeweleryDetailsForm {
  metalType?: string;
  purity?: string;
  hallmark?: boolean;
  bisMark?: string;
  gemstone?: string;
  stoneWeightCt?: number;
  weightGrams?: number;
  makingCharge?: number;
  wastagePct?: number;
  certNo?: string;
  certUrl?: string;
}

export interface FoodDetailsForm {
  vegNonVeg?: string;
  shelfLife?: string;
  ingredients?: string[];
  servingSize?: string;
  calories?: number;
}

export function isCatalogVertical(value: unknown): value is CatalogVertical {
  return value === "CLOTHING" || value === "FOOD" || value === "JEWELERY";
}

export function toCatalogVertical(value: unknown, fallback: CatalogVertical = "CLOTHING"): CatalogVertical {
  return isCatalogVertical(value) ? value : fallback;
}
