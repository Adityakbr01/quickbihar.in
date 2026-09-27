export type JewelryType = "earring" | "ring" | "necklace" | "bracelet";

export type TryOnVariant = {
  id: string;
  label: string;
  modelUrl: string;
  metal?: string;
  stone?: string;
};

export type ProductTryOnConfig = {
  jewelryType: JewelryType;
  modelUrl: string;
  variants: TryOnVariant[];
};

export type TryOnConfig = ProductTryOnConfig & {
  productId: string;
  variantId?: string;
  productName?: string;
};

export type TryOnMessage =
  | { type: "READY" }
  | { type: "CAPTURED"; payload: { imageDataUrl: string; variantId?: string } }
  | { type: "VARIANT_CHANGED"; payload: { variantId: string } }
  | { type: "UNSUPPORTED"; payload: { reason: string } }
  | { type: "ERROR"; payload: { message: string } }
  | { type: "CLOSE" };

export function buildTryOnUrl(baseUrl: string, payload: TryOnConfig): string {
  const trimmed = baseUrl.trim();
  const data = encodeURIComponent(JSON.stringify(payload));
  const separator = trimmed.includes("?") ? "&" : "?";
  return `${trimmed}${separator}data=${data}`;
}

export function safeParseTryOnMessage(raw: string): TryOnMessage | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as TryOnMessage;
    if (!parsed || typeof parsed !== "object" || !("type" in parsed)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
