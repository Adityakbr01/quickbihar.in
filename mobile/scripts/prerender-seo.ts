import fs from "fs";
import path from "path";
import {
  getSiteBase,
  canonicalUrl,
  productMeta,
  productJsonLd,
  categoryMeta,
  mallMeta,
  staticPageMeta,
  itemListJsonLd,
  mallJsonLd,
  breadcrumbJsonLd,
  type PageMeta,
} from "../src/lib/seo";

const DIST_DIR = path.resolve(__dirname, "../dist");
const INDEX_HTML_PATH = path.resolve(DIST_DIR, "index.html");

function escapeHtml(str: string | undefined | null): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function cleanBaseHtml(html: string): string {
  return html
    .replace(/<meta name="(title|description|robots|twitter:[^"]+)"[^>]*>\s*/gi, "")
    .replace(/<meta property="(og:[^"]+)"[^>]*>\s*/gi, "")
    .replace(/<link rel="canonical"[^>]*>\s*/gi, "")
    .replace(/<!-- (Primary Meta Tags|Open Graph \/ Facebook|Twitter|JSON-LD Structured Data) -->\s*/gi, "")
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/gi, "");
}

function injectMetadata(
  templateHtml: string,
  meta: PageMeta,
  schemas: Record<string, any>[] = []
): string {
  let html = cleanBaseHtml(templateHtml);

  // 1. Replace or insert <title>
  const titleTag = `<title>${escapeHtml(meta.title)}</title>`;
  if (html.includes("<title>")) {
    html = html.replace(/<title>[\s\S]*?<\/title>/i, titleTag);
  } else {
    html = html.replace("</head>", `  ${titleTag}\n</head>`);
  }

  // 2. Build meta and link tags
  const tags: string[] = [
    `<!-- Primary Meta Tags -->`,
    `<meta name="title" content="${escapeHtml(meta.title)}" />`,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`,
    `<meta name="robots" content="${meta.robots}" />`,
    `<link rel="canonical" href="${escapeHtml(meta.canonical)}" />`,
    ``,
    `<!-- Open Graph / Facebook -->`,
    `<meta property="og:type" content="${escapeHtml(meta.type || "website")}" />`,
    `<meta property="og:url" content="${escapeHtml(meta.canonical)}" />`,
    `<meta property="og:title" content="${escapeHtml(meta.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
    `<meta property="og:site_name" content="QuickBihar" />`,
  ];

  if (meta.image) {
    tags.push(`<meta property="og:image" content="${escapeHtml(meta.image)}" />`);
  }

  tags.push(
    ``,
    `<!-- Twitter -->`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:url" content="${escapeHtml(meta.canonical)}" />`,
    `<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`
  );

  if (meta.image) {
    tags.push(`<meta name="twitter:image" content="${escapeHtml(meta.image)}" />`);
  }

  // 3. Build JSON-LD structured data
  if (schemas.length > 0) {
    tags.push(``, `<!-- JSON-LD Structured Data -->`);
    for (const schema of schemas) {
      if (schema && typeof schema === "object") {
        tags.push(
          `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`
        );
      }
    }
  }

  const headSnippet = `\n    ${tags.join("\n    ")}\n  `;
  return html.replace("</head>", `${headSnippet}</head>`);
}

function writeStaticHtml(targetRelPath: string, content: string) {
  const fullPath = path.resolve(DIST_DIR, targetRelPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, "utf-8");
}

async function safeFetchJson<T>(url: string): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch (err: any) {
    console.warn(`[prerender-seo] Fetch failed for ${url}: ${err?.message || err}`);
    return null;
  }
}

async function main() {
  console.log("──────────────────────────────────────────────────");
  console.log("QuickBihar Storefront Post-Build SEO Pre-renderer");
  console.log("──────────────────────────────────────────────────");

  if (!fs.existsSync(INDEX_HTML_PATH)) {
    console.error(`[prerender-seo] Error: dist/index.html not found. Run expo export first.`);
    process.exit(1);
  }

  const baseHtml = fs.readFileSync(INDEX_HTML_PATH, "utf-8");
  const siteBase = getSiteBase();
  console.log(`[prerender-seo] Site base: ${siteBase}`);

  let generatedCount = 0;

  // 1. Home / Storefront Root
  const homeMeta = staticPageMeta({
    title: "QuickBihar | Online Shopping in Bihar — Fashion, Clothing & Lifestyle",
    description:
      "Shop the latest fashion, ethnic wear, and daily essentials from trusted local stores in Bihar. Ultra-fast doorstep delivery.",
    path: "/",
    image: `${siteBase}/assets/images/icons/splash-icon.png`,
    indexable: true,
  });

  const homeSchemas = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "QuickBihar",
      url: siteBase,
      potentialAction: {
        "@type": "SearchAction",
        target: `${siteBase}/(tabs)/clothing/search?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "QuickBihar",
      url: siteBase,
      logo: `${siteBase}/assets/images/icons/ios-icon-default.png`,
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer service",
        areaServed: "IN",
      },
    },
  ];

  const homeHtml = injectMetadata(baseHtml, homeMeta, homeSchemas);
  writeStaticHtml("index.html", homeHtml);
  generatedCount++;

  // 2. Hub Pages
  const topSellingMeta = staticPageMeta({
    title: "Top Selling Fashion & Clothing in Bihar | QuickBihar",
    description: "Browse best-selling styles, trending clothing, and top-rated local fashion on QuickBihar.",
    path: "/top-selling",
    image: `${siteBase}/assets/images/icons/splash-icon.png`,
    indexable: true,
  });
  const topSellingBreadcrumbs = breadcrumbJsonLd(topSellingMeta.canonical, [
    { name: "Home", path: "/" },
    { name: "Top Selling", path: "/top-selling" },
  ]);
  writeStaticHtml("top-selling.html", injectMetadata(baseHtml, topSellingMeta, [topSellingBreadcrumbs]));
  writeStaticHtml("top-selling/index.html", injectMetadata(baseHtml, topSellingMeta, [topSellingBreadcrumbs]));
  generatedCount += 2;

  const mallHubMeta = staticPageMeta({
    title: "Shopping Malls in Bihar | Directory, Stores & Offers | QuickBihar",
    description: "Explore top shopping malls, store directories, and exclusive local offers across Bihar on QuickBihar.",
    path: "/mall",
    image: `${siteBase}/assets/images/icons/splash-icon.png`,
    indexable: true,
  });
  const mallBreadcrumbs = breadcrumbJsonLd(mallHubMeta.canonical, [
    { name: "Home", path: "/" },
    { name: "Malls", path: "/mall" },
  ]);
  writeStaticHtml("mall.html", injectMetadata(baseHtml, mallHubMeta, [mallBreadcrumbs]));
  writeStaticHtml("mall/index.html", injectMetadata(baseHtml, mallHubMeta, [mallBreadcrumbs]));
  generatedCount += 2;

  // 3. Dynamic Template Fallbacks (for client-side routing)
  const genericCategoryMeta = staticPageMeta({
    title: "Category | Shop Online in Bihar | QuickBihar",
    description: "Shop curated products from local stores in Bihar on QuickBihar.",
    path: "/category",
    indexable: false,
  });
  writeStaticHtml("category/[slug].html", injectMetadata(baseHtml, genericCategoryMeta));

  const genericProductMeta = staticPageMeta({
    title: "Product Detail | QuickBihar",
    description: "View product details, variants, prices, and reviews on QuickBihar.",
    path: "/product",
    indexable: false,
  });
  writeStaticHtml("product/[id].html", injectMetadata(baseHtml, genericProductMeta));

  const genericMallMeta = staticPageMeta({
    title: "Mall Detail | QuickBihar",
    description: "Explore mall stores, collections, and reviews on QuickBihar.",
    path: "/mall",
    indexable: false,
  });
  writeStaticHtml("mall/[id].html", injectMetadata(baseHtml, genericMallMeta));

  // 4. Not Found (+not-found.html)
  const notFoundMeta = staticPageMeta({
    title: "Page Not Found (404) | QuickBihar",
    description: "The page you are looking for does not exist on QuickBihar.",
    path: "/+not-found",
    indexable: false,
  });
  writeStaticHtml("+not-found.html", injectMetadata(baseHtml, notFoundMeta));
  generatedCount++;

  // 5. Query Backend for Real Catalog Items
  console.log(`[prerender-seo] Fetching catalog data from ${siteBase}/api/v1...`);

  // 5a. Categories
  const catRes = await safeFetchJson<any>(
    `${siteBase}/api/v1/categories/public`
  );
  let categories: any[] = Array.isArray(catRes?.data)
    ? catRes.data
    : Array.isArray(catRes)
    ? catRes
    : [];

  // Default core categories if API is offline or returns empty (guarantees static hubs exist)
  if (categories.length === 0) {
    console.log("[prerender-seo] Using core clothing category fallback definitions for prerendering.");
    categories = [
      { title: "Men's Wear", slug: "mens-wear", priority: 1, isActive: true },
      { title: "Women's Wear", slug: "womens-wear", priority: 2, isActive: true },
      { title: "Kids Wear", slug: "kids-wear", priority: 3, isActive: true },
      { title: "Sarees", slug: "sarees", priority: 4, isActive: true },
      { title: "Jeans", slug: "jeans", priority: 5, isActive: true },
      { title: "Kurtis & Suits", slug: "kurtis-suits", priority: 6, isActive: true },
      { title: "Shirts & T-Shirts", slug: "shirts-t-shirts", priority: 7, isActive: true },
      { title: "Ethnic Wear", slug: "ethnic-wear", priority: 8, isActive: true },
    ];
  }
  console.log(`[prerender-seo] Prerendering ${categories.length} categories.`);

  for (const cat of categories) {
    const slug = String(cat?.slug || "").trim();
    if (!slug) continue;

    const meta = categoryMeta(cat);
    const breadcrumbs = breadcrumbJsonLd(meta.canonical, [
      { name: "Home", path: "/" },
      { name: "Categories", path: "/" },
      { name: cat.title || slug, path: `/category/${slug}` },
    ]);

    const catHtml = injectMetadata(baseHtml, meta, [breadcrumbs]);
    writeStaticHtml(`category/${slug}.html`, catHtml);
    writeStaticHtml(`category/${slug}/index.html`, catHtml);
    generatedCount += 2;
  }

  // 5b. Products (Public + Trending)
  const prodRes = await safeFetchJson<{ data?: { products?: any[] } | any[] }>(
    `${siteBase}/api/v1/products/public?vertical=CLOTHING&limit=100`
  );
  const rawProducts = Array.isArray(prodRes?.data)
    ? prodRes!.data
    : Array.isArray((prodRes?.data as any)?.products)
    ? (prodRes?.data as any).products
    : [];

  console.log(`[prerender-seo] Fetched ${rawProducts.length} public products.`);

  for (const prod of rawProducts) {
    const id = String(prod?._id || prod?.id || "").trim();
    const slug = String(prod?.slug || "").trim();
    if (!id && !slug) continue;

    const meta = productMeta(prod);
    const schemas: Record<string, any>[] = [];

    const pJsonLd = productJsonLd(prod, meta.canonical);
    if (pJsonLd) schemas.push(pJsonLd);

    const breadcrumbs = breadcrumbJsonLd(meta.canonical, [
      { name: "Home", path: "/" },
      { name: prod?.category?.title || "Fashion", path: "/" },
      { name: prod.title || "Product", path: meta.canonical },
    ]);
    schemas.push(breadcrumbs);

    const prodHtml = injectMetadata(baseHtml, meta, schemas);

    if (slug) {
      writeStaticHtml(`product/${slug}.html`, prodHtml);
      writeStaticHtml(`product/${slug}/index.html`, prodHtml);
      generatedCount += 2;
    }
    if (id && id !== slug) {
      writeStaticHtml(`product/${id}.html`, prodHtml);
      writeStaticHtml(`product/${id}/index.html`, prodHtml);
      generatedCount += 2;
    }
  }

  // 5c. Malls
  const mallRes = await safeFetchJson<{ data?: any[] }>(`${siteBase}/api/v1/malls`);
  const malls: any[] = Array.isArray(mallRes?.data) ? mallRes!.data : [];
  console.log(`[prerender-seo] Fetched ${malls.length} malls.`);

  for (const mall of malls) {
    const id = String(mall?._id || mall?.id || "").trim();
    const slug = String(mall?.slug || "").trim();
    if (!id && !slug) continue;

    const meta = mallMeta(mall);
    const schemas: Record<string, any>[] = [];

    const mJsonLd = mallJsonLd(mall, meta.canonical);
    if (mJsonLd) schemas.push(mJsonLd);

    const breadcrumbs = breadcrumbJsonLd(meta.canonical, [
      { name: "Home", path: "/" },
      { name: "Malls", path: "/mall" },
      { name: mall.name || "Mall", path: meta.canonical },
    ]);
    schemas.push(breadcrumbs);

    const mallHtml = injectMetadata(baseHtml, meta, schemas);

    if (slug) {
      writeStaticHtml(`mall/${slug}.html`, mallHtml);
      writeStaticHtml(`mall/${slug}/index.html`, mallHtml);
      generatedCount += 2;
    }
    if (id && id !== slug) {
      writeStaticHtml(`mall/${id}.html`, mallHtml);
      writeStaticHtml(`mall/${id}/index.html`, mallHtml);
      generatedCount += 2;
    }
  }

  console.log(`[prerender-seo] Successfully generated ${generatedCount} static SEO pages in dist/!`);
}

main().catch((err) => {
  console.error("[prerender-seo] Unhandled error:", err);
  process.exit(1);
});
