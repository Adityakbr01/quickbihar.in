/**
 * Shared fetch utilities used by both `scripts/generate-manifest.ts` (Node,
 * pre-build) and route-level `generateStaticParams` (Expo Router SSG).
 *
 * Pure TypeScript — no React, no DOM — safe to import from any context.
 */

/**
 * Unwrap a list payload from the backend ApiResponse envelope.
 *
 * Shapes seen in the wild:
 *   { statusCode, data: [...] }              (categories, malls)
 *   { statusCode, data: { data: [...] } }    (paginated products)
 *   { statusCode, data: { products: [...] } }
 *   { statusCode, data: { items: [...] } }
 *   [...]                                    (bare array)
 */
export function unwrapList(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  const data = payload?.data;
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    if (Array.isArray((data as any).data)) return (data as any).data;
    if (Array.isArray((data as any).products)) return (data as any).products;
    if (Array.isArray((data as any).items)) return (data as any).items;
    if (Array.isArray((data as any).results)) return (data as any).results;
  }
  if (Array.isArray(payload?.products)) return payload.products;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

/** Fetch JSON with a 6-second timeout; returns null on any error. */
export async function safeFetchJson<T>(url: string): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch (err: any) {
    console.warn(`[fetchUtils] Fetch failed for ${url}: ${err?.message || err}`);
    return null;
  }
}
