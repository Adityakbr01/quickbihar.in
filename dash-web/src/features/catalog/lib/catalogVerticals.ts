/**
 * Central catalog-vertical config shared by the admin + seller product forms.
 * One tab per vertical keeps each form tailored instead of one giant
 * conditional form. Server enum: CLOTHING | JEWELERY (+ GLOBAL for
 * categories). Backend spelling is JEWELERY (not JEWELLERY) — keep in sync.
 */

export type CatalogVertical = "CLOTHING" | "JEWELERY";

export const CATALOG_VERTICALS: Array<{ value: CatalogVertical; label: string; hint: string }> = [
  { value: "CLOTHING", label: "Clothing", hint: "Apparel, footwear, fashion" },
  { value: "JEWELERY", label: "Jewelry", hint: "Gold, diamond, BIS hallmarked" },
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

export function isCatalogVertical(value: unknown): value is CatalogVertical {
  return value === "CLOTHING" || value === "JEWELERY";
}

export function toCatalogVertical(value: unknown, fallback: CatalogVertical = "CLOTHING"): CatalogVertical {
  return isCatalogVertical(value) ? value : fallback;
}
