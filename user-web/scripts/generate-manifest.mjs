/**
 * Pre-build manifest generator for user-web (Vite SSG).
 *
 * Fetches EVERY catalog vertical + malls from the live API and writes:
 *   src/data/products-static.json  keyed by slug  { [slug]: ProductEntry }
 *   src/data/malls-static.json      keyed by slug  { [slug]: MallEntry }
 *
 * `src/seo/prerender.tsx` statically imports these files, so every slug
 * present here gets a prerendered HTML page (with head + JSON-LD) at
 * `vite build` time — which is what Googlebot indexes.
 *
 * Why all verticals: the old mobile script fetched only CLOTHING, so the 12
 * JEWELERY products lived in the DB + sitemap but had no prerendered page.
 * Google crawled them as 404s (Expo era) / homepage-shell soft-404s.
 *
 * Loud-failure contract (same as mobile/scripts/generate-manifest.ts):
 * on API failure it reuses the existing JSON if non-empty (warns loudly),
 * otherwise exits 1 — a silent zero-count would delete all prerendered pages.
 *
 * Env:
 *   VITE_API_ORIGIN (or EXPO_PUBLIC_API_ORIGIN), default https://quickbihar.in
 *   CATALOG_VERTICALS, default "CLOTHING,JEWELERY"
 *
 * Zero dependencies — runs on plain Node 20+ (`node ./scripts/generate-manifest.mjs`).
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, "../src/data");

const ORIGIN = (
  process.env.VITE_API_ORIGIN ||
  process.env.EXPO_PUBLIC_API_ORIGIN ||
  "https://quickbihar.in"
).replace(/\/+$/, "");

const VERTICALS = (process.env.CATALOG_VERTICALS || "CLOTHING,JEWELERY")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

async function fetchJson(url, retries = 3) {
  let lastErr = null;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return await res.json();
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw lastErr;
}

/** Unwrap ApiResponse envelopes: {data:[...]} or {data:{data:[...],total}} etc. */
function unwrapList(body) {
  const d = body?.data ?? body;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.data)) return d.data;
  if (Array.isArray(d?.items)) return d.items;
  if (Array.isArray(d?.products)) return d.products;
  return [];
}

function reuseOrFail(filePath, label) {
  if (existsSync(filePath)) {
    try {
      const existing = JSON.parse(readFileSync(filePath, "utf-8"));
      if (existing && Object.keys(existing).length > 0) {
        console.warn(
          `[manifest] WARN: 0 ${label} fetched from API — reusing existing ${path.basename(filePath)} (${Object.keys(existing).length} slugs).`
        );
        return true;
      }
    } catch {
      // fall through to fatal
    }
  }
  console.error(
    `[manifest] ERROR: 0 ${label} from API and no usable ${path.basename(filePath)} — refusing to wipe prerendered pages.`
  );
  process.exit(1);
}

async function main() {
  console.log("─────────────────────────────────────────");
  console.log("QuickBihar user-web Manifest Generator");
  console.log("─────────────────────────────────────────");
  console.log(`Origin: ${ORIGIN}`);
  console.log(`Verticals: ${VERTICALS.join(", ")}`);

  mkdirSync(OUT_DIR, { recursive: true });

  // ── Products (all verticals, merged by slug) ──────────────────────────
  const productMap = {};
  for (const vertical of VERTICALS) {
    let items = [];
    try {
      const body = await fetchJson(
        `${ORIGIN}/api/v1/products/public?vertical=${encodeURIComponent(vertical)}&limit=500`
      );
      items = unwrapList(body);
    } catch (err) {
      console.warn(`[manifest] WARN: vertical ${vertical} failed: ${err?.message || err} — continuing with other verticals.`);
      continue;
    }
    console.log(`[manifest] Fetched ${items.length} products (vertical=${vertical}).`);
    for (const p of items) {
      const slug = String(p?.slug || "").trim();
      if (!slug) continue;
      productMap[slug] = {
        _id: p._id,
        slug,
        title: p.title,
        price: p.price,
        shortDescription: p.shortDescription,
        description: p.description,
        brand: p.brand,
        category: p.category,
        subCategory: p.subCategory,
        images: Array.isArray(p.images) ? p.images.slice(0, 1) : undefined,
        isActive: p.isActive,
      };
    }
  }

  const prodFilePath = path.join(OUT_DIR, "products-static.json");
  const slugs = Object.keys(productMap);
  if (slugs.length === 0) {
    reuseOrFail(prodFilePath, "products");
  } else {
    writeFileSync(prodFilePath, JSON.stringify(productMap, null, 2), "utf-8");
    console.log(`[manifest] Wrote products-static.json (${slugs.length} slugs)`);
  }

  // ── Malls ────────────────────────────────────────────────────────────
  let malls = [];
  try {
    malls = unwrapList(await fetchJson(`${ORIGIN}/api/v1/malls`));
  } catch (err) {
    console.warn(`[manifest] WARN: malls fetch failed: ${err?.message || err}.`);
  }
  console.log(`[manifest] Fetched ${malls.length} malls.`);

  const mallFilePath = path.join(OUT_DIR, "malls-static.json");
  if (malls.length === 0) {
    reuseOrFail(mallFilePath, "malls");
  } else {
    const mallMap = {};
    for (const m of malls) {
      const slug = String(m?.slug || m?._id || "").trim();
      if (!slug) continue;
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
    writeFileSync(mallFilePath, JSON.stringify(mallMap, null, 2), "utf-8");
    console.log(`[manifest] Wrote malls-static.json (${Object.keys(mallMap).length} slugs)`);
  }

  console.log("[manifest] Done. Ready for vite build (prerender).");
}

main().catch((err) => {
  console.error("[manifest] Unexpected error:", err);
  process.exit(1);
});
