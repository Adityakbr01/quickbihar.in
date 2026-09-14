/**
 * Pre-build manifest generator — runs BEFORE `expo export --platform web`.
 *
 * Writes:
 *   src/data/products-static.json  keyed by slug  { [slug]: ProductMeta }
 *   src/data/malls-static.json     keyed by slug  { [slug]: MallMeta }
 *
 * Both manifests are read synchronously by route-level generateStaticParams
 * so Expo Router can emit one static HTML file per product/mall slug, with
 * real SEO meta baked in at build time.
 *
 * Loud-failure contract: exits 1 if 0 products or 0 malls are returned.
 * A silent zero-count would generate zero pages with no error — the exact
 * production bug this migration is designed to fix.
 */

import fs from "fs";
import path from "path";
/// <reference types="node" />
import { unwrapList, safeFetchJson } from "../src/lib/fetchUtils";

const OUT_DIR = path.resolve(__dirname, "../src/data");

const ORIGIN = (process.env.EXPO_PUBLIC_API_ORIGIN || "https://quickbihar.in").replace(/\/+$/, "");

/** Minimal shape written per product — only what the route's SeoHead needs. */
interface ProductManifestEntry {
  _id: string;
  slug: string;
  title: string;
  price?: number;
  shortDescription?: string;
  description?: string;
  category?: string | { title?: string };
  subCategory?: string;
  images?: Array<{ url: string }>;
  isActive?: boolean;
  isVerified?: boolean;
}

/** Minimal shape written per mall. */
interface MallManifestEntry {
  _id: string;
  slug?: string;
  name: string;
  description?: string;
  coverImageUrl?: string;
  logoUrl?: string;
  images?: Array<{ url: string }>;
  address?: { city?: string };
  location?: string;
  isActive?: boolean;
}

async function main() {
  console.log("─────────────────────────────────────────");
  console.log("QuickBihar Pre-Build Manifest Generator");
  console.log("─────────────────────────────────────────");
  console.log(`Origin: ${ORIGIN}`);

  fs.mkdirSync(OUT_DIR, { recursive: true });

  // ── Products ──────────────────────────────────────────────────────────────
  const prodRes = await safeFetchJson<any>(
    `${ORIGIN}/api/v1/products/public?vertical=CLOTHING&limit=500`,
    { retries: 3 }
  );
  const products: ProductManifestEntry[] = unwrapList(prodRes);
  console.log(`[manifest] Fetched ${products.length} products.`);

  if (products.length === 0) {
    console.error(
      "[manifest] ERROR: 0 products returned from API. " +
      "Refusing to write an empty manifest — this would generate zero product pages. " +
      "Check /api/v1/products/public response shape and try again."
    );
    process.exit(1);
  }

  // Key by slug; skip products without a slug (can't generate a canonical URL).
  const productMap: Record<string, ProductManifestEntry> = {};
  let skipped = 0;
  for (const p of products) {
    const slug = String(p?.slug || "").trim();
    if (!slug) { skipped++; continue; }
    productMap[slug] = {
      _id: p._id,
      slug,
      title: p.title,
      price: p.price,
      shortDescription: p.shortDescription,
      description: p.description,
      category: p.category,
      subCategory: p.subCategory,
      images: Array.isArray(p.images) ? p.images.slice(0, 1) : undefined,
      isActive: p.isActive,
      isVerified: p.isVerified,
    };
  }
  if (skipped > 0) {
    console.warn(`[manifest] ${skipped} products skipped (no slug) — they will not get a static page.`);
  }

  fs.writeFileSync(
    path.join(OUT_DIR, "products-static.json"),
    JSON.stringify(productMap, null, 2),
    "utf-8"
  );
  console.log(`[manifest] ✓ Wrote products-static.json (${Object.keys(productMap).length} slugs)`);

  // ── Malls ─────────────────────────────────────────────────────────────────
  const mallRes = await safeFetchJson<any>(`${ORIGIN}/api/v1/malls`, { retries: 3 });
  const malls: MallManifestEntry[] = unwrapList(mallRes);
  console.log(`[manifest] Fetched ${malls.length} malls.`);

  if (malls.length === 0) {
    console.error(
      "[manifest] ERROR: 0 malls returned from API. " +
      "Refusing to write an empty manifest — this would generate zero mall pages. " +
      "Check /api/v1/malls response shape and try again."
    );
    process.exit(1);
  }

  const mallMap: Record<string, MallManifestEntry> = {};
  let mallSkipped = 0;
  for (const m of malls) {
    const slug = String(m?.slug || m?._id || "").trim();
    if (!slug) { mallSkipped++; continue; }
    mallMap[slug] = {
      _id: m._id,
      slug: m.slug,
      name: m.name,
      description: m.description,
      coverImageUrl: m.coverImageUrl,
      logoUrl: m.logoUrl,
      images: Array.isArray(m.images) ? m.images.slice(0, 1) : undefined,
      address: m.address,
      location: m.location,
      isActive: m.isActive,
    };
  }
  if (mallSkipped > 0) {
    console.warn(`[manifest] ${mallSkipped} malls skipped (no slug or _id).`);
  }

  fs.writeFileSync(
    path.join(OUT_DIR, "malls-static.json"),
    JSON.stringify(mallMap, null, 2),
    "utf-8"
  );
  console.log(`[manifest] ✓ Wrote malls-static.json (${Object.keys(mallMap).length} slugs)`);

  console.log("[manifest] Done. Ready for expo export --platform web.");
}

main().catch((err) => {
  console.error("[manifest] Unexpected error:", err);
  process.exit(1);
});
