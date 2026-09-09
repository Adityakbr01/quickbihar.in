/**
 * SEO Sitemap & Robots Service.
 *
 * Builds crawlable sitemap XML shards from live public catalog data plus an
 * environment-aware robots.txt (plan §17–§18). Single owner for storefront
 * discovery — the Expo static bundle never needs rebuilding for sitemap freshness.
 * All dynamic entries pass the same indexability gates as the mobile app
 * (`mobile/src/lib/seo.ts`): public + approved + content-complete + stable slug.
 */

import { Product } from "@/modules/clothing/products/product.model";
import { Category } from "@/modules/common/category/category.model";
import { Mall } from "@/modules/common/mall/mall.model";

/* ── Constants ── */

/** Canonical public host — sitemap URLs must be absolute on the apex domain. */
const SITE_BASE = "https://quickbihar.in";

/** Max URLs per shard (sitemap protocol allows 50k/50MB; 5k keeps responses fast). */
const SHARD_LIMIT = 5000;

/** Static hub paths included in every sitemap (always indexable, no DB needed). */
const STATIC_PATHS = ["/", "/clothing/home", "/clothing/search", "/top-selling", "/mall", "/instant-delivery"];

/* ── Internal helpers ── */

/** XML-escape a URL or date string for safe embedding in sitemap XML. */
function escapeXml(value: string): string {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

/** Format a lastmod value (Date|string) as YYYY-MM-DD; falls back to today. */
function toLastmod(value: unknown): string {
    const date = value instanceof Date ? value : new Date(String(value || ""));
    if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
    return date.toISOString().slice(0, 10);
}

/** Server-side mirror of mobile `isIndexableProduct` (public + content-complete). */
function isSitemapProduct(product: any): boolean {
    if (!product?.slug || !product?.title) return false;
    if (product.isActive === false || product.isDeleted) return false;
    if (product.approvalStatus && product.approvalStatus !== "APPROVED") return false;
    const images = Array.isArray(product.images) ? product.images : [];
    if (!images.length || !images[0]?.url) return false;
    const desc = String(product.shortDescription || product.description || "").trim();
    if (desc.length < 20) return false;
    return true;
}

/** Master list of Buxar district and block SEO slugs. */
const BUXAR_LOCATION_SLUGS = [
    "buxar",
    "buxar-city",
    "dumraon",
    "chausa",
    "itarhi",
    "rajpur",
    "nawanagar",
    "brahampur",
    "kesath",
    "chakki",
    "chaugain",
    "simri",
];

/* ── Exported service functions ── */

/** Sitemap index listing every shard ( Crawlers fetch this from /sitemap.xml ). */
export async function buildSitemapIndex(): Promise<string> {
    const shards = [
        "sitemap-static.xml",
        "sitemap-products.xml",
        "sitemap-taxonomy.xml",
        "sitemap-malls.xml",
        "sitemap-locations.xml",
    ];
    const urls = shards.map((shard) => `  <sitemap>\n    <loc>${SITE_BASE}/${shard}</loc>\n  </sitemap>`).join("\n");
    return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</sitemapindex>`;
}

/** Locations shard — Buxar district, subdivisions, and block landing pages. */
export async function buildLocationsSitemap(): Promise<string> {
    const today = new Date().toISOString().slice(0, 10);
    const urls = BUXAR_LOCATION_SLUGS.map((slug) => {
        const path = slug === "buxar" ? "/locations/bihar/buxar" : `/locations/bihar/buxar/${slug}`;
        const priority = slug === "buxar" || slug === "buxar-city" ? "0.9" : "0.8";
        return `  <url>\n    <loc>${SITE_BASE}${path}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
    }).join("\n");
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
}

/** Static hubs shard — always present even with an empty catalog. */
export async function buildStaticSitemap(): Promise<string> {
    const today = new Date().toISOString().slice(0, 10);
    const urls = STATIC_PATHS.map(
        (path) => `  <url>\n    <loc>${SITE_BASE}${path}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n  </url>`
    ).join("\n");
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
}

/** Product shard — gated indexable products only, newest first. */
export async function buildProductsSitemap(): Promise<string> {
    const products = await Product.find({
        isActive: true,
        isDeleted: false,
        $or: [{ approvalStatus: "APPROVED" }, { approvalStatus: { $exists: false } }],
    })
        .select("slug title images shortDescription description updatedAt")
        .sort({ updatedAt: -1 })
        .limit(SHARD_LIMIT)
        .lean();
    const urls = products
        .filter(isSitemapProduct)
        .map(
            (product: any) =>
                `  <url>\n    <loc>${escapeXml(`${SITE_BASE}/product/${product.slug}`)}</loc>\n    <lastmod>${toLastmod(product.updatedAt)}</lastmod>\n    <changefreq>weekly</changefreq>\n  </url>`
        )
        .join("\n");
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
}

/** Taxonomy shard — active categories with stable slugs. */
export async function buildTaxonomySitemap(): Promise<string> {
    const categories = await Category.find({ isActive: true, slug: { $exists: true, $ne: "" } })
        .select("slug updatedAt")
        .sort({ priority: -1, title: 1 })
        .limit(SHARD_LIMIT)
        .lean();
    const urls = categories
        .filter((category: any) => String(category?.slug || "").trim())
        .map(
            (category: any) =>
                `  <url>\n    <loc>${escapeXml(`${SITE_BASE}/category/${String(category.slug).toLowerCase().trim()}`)}</loc>\n    <lastmod>${toLastmod(category.updatedAt)}</lastmod>\n    <changefreq>weekly</changefreq>\n  </url>`
        )
        .join("\n");
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
}

/** Malls shard — active + approved malls with stable slugs (slugless malls skipped). */
export async function buildMallsSitemap(): Promise<string> {
    const malls = await Mall.find({
        isActive: true,
        $or: [{ status: "APPROVED" }, { status: { $exists: false } }],
        slug: { $exists: true, $ne: "" },
    })
        .select("slug updatedAt")
        .sort({ isFeatured: -1, updatedAt: -1 })
        .limit(SHARD_LIMIT)
        .lean();
    const urls = malls
        .filter((mall: any) => String(mall?.slug || "").trim())
        .map(
            (mall: any) =>
                `  <url>\n    <loc>${escapeXml(`${SITE_BASE}/mall/${String(mall.slug).toLowerCase().trim()}`)}</loc>\n    <lastmod>${toLastmod(mall.updatedAt)}</lastmod>\n    <changefreq>weekly</changefreq>\n  </url>`
        )
        .join("\n");
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
}

/**
 * Environment-aware robots.txt — production allows gated crawling with sitemap
 * reference; every other environment fully disallows (plan §34).
 */
export function buildRobotsTxt(nodeEnv: string | undefined): string {
    if (nodeEnv === "production") {
        return [
            "User-agent: *",
            "Allow: /",
            "Disallow: /auth/",
            "Disallow: /account/",
            "Disallow: /checkout",
            "Disallow: /order/",
            "Disallow: /track-order/",
            "Disallow: /rider",
            "Disallow: /*?*pincode*",
            "Disallow: /*?*lat*",
            "Sitemap: https://quickbihar.in/sitemap.xml",
            "",
        ].join("\n");
    }
    return ["User-agent: *", "Disallow: /", ""].join("\n");
}
