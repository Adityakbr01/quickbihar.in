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
  let cleaned = html
    .replace(/<meta name="(title|description|keywords|author|publisher|robots|twitter:[^"]+)"[^>]*>\s*/gi, "")
    .replace(/<meta property="(og:[^"]+)"[^>]*>\s*/gi, "")
    .replace(/<link rel="(canonical|publisher)"[^>]*>\s*/gi, "")
    .replace(/<title>[\s\S]*?<\/title>\s*/gi, "")
    .replace(/<!-- (Primary Meta Tags|Open Graph \/ Facebook|Twitter|JSON-LD Structured Data) -->\s*/gi, "")
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/gi, "");

  // Add descriptive title attributes to head link tags so link-checkers don't warn about links without title
  cleaned = cleaned.replace(/<link rel="icon" href="([^"]*)"(?![^>]*title=)([^>]*)>/gi, '<link rel="icon" href="$1" title="QuickBihar Favicon"$2>');
  cleaned = cleaned.replace(/<link rel="preload" href="([^"]*)" as="style"(?![^>]*title=)([^>]*)>/gi, '<link rel="preload" href="$1" as="style" title="QuickBihar Stylesheet Preload"$2>');
  cleaned = cleaned.replace(/<link rel="stylesheet" href="([^"]*)"(?![^>]*title=)([^>]*)>/gi, '<link rel="stylesheet" href="$1" title="QuickBihar Stylesheet"$2>');

  return cleaned;
}

function injectMetadata(
  templateHtml: string,
  meta: PageMeta,
  schemas: Record<string, any>[] = []
): string {
  let html = cleanBaseHtml(templateHtml);

  const defaultKeywords =
    "QuickBihar, online shopping Bihar, clothing store Patna, ethnic wear Bihar, sarees Bihar, men clothing, women clothing, Bihar fast delivery, local stores Bihar";
  const defaultAuthor = "QuickBihar";
  const defaultPublisher = "QuickBihar";

  // 1. Insert <title>
  const titleTag = `<title data-rh="true">${escapeHtml(meta.title)}</title>`;
  html = html.replace("</head>", `  ${titleTag}\n</head>`);

  // 2. Build meta and link tags with data-rh="true"
  const tags: string[] = [
    `<!-- Primary Meta Tags -->`,
    `<meta data-rh="true" name="title" content="${escapeHtml(meta.title)}" />`,
    `<meta data-rh="true" name="description" content="${escapeHtml(meta.description)}" />`,
    `<meta data-rh="true" name="keywords" content="${escapeHtml(meta.keywords || defaultKeywords)}" />`,
    `<meta data-rh="true" name="author" content="${escapeHtml(meta.author || defaultAuthor)}" />`,
    `<meta data-rh="true" name="publisher" content="${escapeHtml(meta.publisher || defaultPublisher)}" />`,
    `<meta data-rh="true" name="robots" content="${meta.robots}" />`,
    `<link data-rh="true" rel="canonical" href="${escapeHtml(meta.canonical)}" />`,
    `<link data-rh="true" rel="publisher" href="https://quickbihar.in/" title="QuickBihar Official Website" />`,
    ``,
    `<!-- Open Graph / Facebook -->`,
    `<meta data-rh="true" property="og:type" content="${escapeHtml(meta.type || "website")}" />`,
    `<meta data-rh="true" property="og:url" content="${escapeHtml(meta.canonical)}" />`,
    `<meta data-rh="true" property="og:title" content="${escapeHtml(meta.title)}" />`,
    `<meta data-rh="true" property="og:description" content="${escapeHtml(meta.description)}" />`,
    `<meta data-rh="true" property="og:site_name" content="QuickBihar" />`,
    `<meta data-rh="true" property="og:locale" content="en_IN" />`,
  ];

  if (meta.image) {
    tags.push(`<meta data-rh="true" property="og:image" content="${escapeHtml(meta.image)}" />`);
  }

  tags.push(
    ``,
    `<!-- Twitter -->`,
    `<meta data-rh="true" name="twitter:card" content="summary_large_image" />`,
    `<meta data-rh="true" name="twitter:url" content="${escapeHtml(meta.canonical)}" />`,
    `<meta data-rh="true" name="twitter:title" content="${escapeHtml(meta.title)}" />`,
    `<meta data-rh="true" name="twitter:description" content="${escapeHtml(meta.description)}" />`
  );

  if (meta.image) {
    tags.push(`<meta data-rh="true" name="twitter:image" content="${escapeHtml(meta.image)}" />`);
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

/** Injects semantic crawler-accessible HTML inside #root so non-JS and simple crawlers find H1, H2, images with alt/title, and links with title */
function injectCrawlerBodyFallback(
  html: string,
  options: {
    h1Title: string;
    description: string;
    categories?: any[];
    malls?: any[];
    products?: any[];
  }
): string {
  const { h1Title, description, categories = [], malls = [], products = [] } = options;

  let categoriesHtml = "";
  if (categories.length > 0) {
    categoriesHtml = `
      <section aria-labelledby="cat-heading" style="margin-top: 24px;">
        <h2 id="cat-heading">Top Clothing Categories in Bihar</h2>
        <div style="display: flex; flex-wrap: wrap; gap: 16px; margin-top: 12px;">
          ${categories
            .slice(0, 8)
            .map((cat) => {
              const slug = cat.slug || "";
              const title = cat.title || "Category";
              const img = cat.image || "https://quickbihar.in/assets/images/icons/splash-icon.png";
              return `
            <div style="text-align: center; width: 75px;">
              <a href="/category/${slug}" title="Shop ${escapeHtml(title)} Clothing in Bihar" style="text-decoration: none; color: inherit;">
                <img src="${escapeHtml(img)}" alt="${escapeHtml(title)} - Clothing Category in Bihar" title="${escapeHtml(title)} | QuickBihar Online Shopping" width="64" height="64" style="border-radius: 32px; object-fit: cover;" />
                <div style="font-size: 11px; font-weight: 500; margin-top: 4px;">${escapeHtml(title)}</div>
              </a>
            </div>`;
            })
            .join("\n")}
        </div>
      </section>
    `;
  }

  let mallsHtml = "";
  if (malls.length > 0) {
    mallsHtml = `
      <section aria-labelledby="mall-heading" style="margin-top: 24px;">
        <h2 id="mall-heading">Top 10 Shopping Malls in Bihar</h2>
        <div style="display: flex; flex-wrap: wrap; gap: 16px; margin-top: 12px;">
          ${malls
            .slice(0, 6)
            .map((m) => {
              const id = m.slug || m._id || m.id;
              const name = m.name || "Shopping Mall";
              const loc = m.location || "Bihar";
              const img = m.image || "https://quickbihar.in/assets/images/icons/splash-icon.png";
              return `
            <div style="width: 140px;">
              <a href="/mall/${id}" title="Visit ${escapeHtml(name)} in ${escapeHtml(loc)}" style="text-decoration: none; color: inherit;">
                <img src="${escapeHtml(img)}" alt="${escapeHtml(name)} - Shopping Mall in ${escapeHtml(loc)}" title="${escapeHtml(name)} | QuickBihar Local Mall" width="140" height="90" style="border-radius: 8px; object-fit: cover;" />
                <div style="font-size: 13px; font-weight: bold; margin-top: 4px;">${escapeHtml(name)}</div>
                <div style="font-size: 11px; color: #666;">${escapeHtml(loc)}</div>
              </a>
            </div>`;
            })
            .join("\n")}
        </div>
      </section>
    `;
  }

  let productsHtml = "";
  if (products.length > 0) {
    productsHtml = `
      <section aria-labelledby="prod-heading" style="margin-top: 24px;">
        <h2 id="prod-heading">Trending Fashion Deals in Bihar</h2>
        <div style="display: flex; flex-wrap: wrap; gap: 16px; margin-top: 12px;">
          ${products
            .slice(0, 6)
            .map((p) => {
              const id = p.slug || p._id || p.id;
              const title = p.title || "Fashion Deal";
              const img = p.images?.[0]?.url || "https://quickbihar.in/assets/images/icons/splash-icon.png";
              return `
            <div style="width: 130px;">
              <a href="/product/${id}" title="Shop ${escapeHtml(title)} on QuickBihar" style="text-decoration: none; color: inherit;">
                <img src="${escapeHtml(img)}" alt="${escapeHtml(title)} - Fashion Deal in Bihar" title="${escapeHtml(title)} | QuickBihar Deals" width="130" height="150" style="border-radius: 8px; object-fit: cover;" />
                <div style="font-size: 12px; font-weight: 600; margin-top: 4px;">${escapeHtml(title)}</div>
              </a>
            </div>`;
            })
            .join("\n")}
        </div>
      </section>
    `;
  }

  const fallbackBody = `
    <header style="padding: 16px 20px; border-bottom: 1px solid #eee;">
      <h1 style="font-size: 22px; font-weight: 900; margin: 0 0 8px 0;">${escapeHtml(h1Title)}</h1>
      <p style="font-size: 14px; color: #555; margin: 0 0 12px 0;">${escapeHtml(description)}</p>
      <nav aria-label="Main Site Navigation" style="font-size: 13px;">
        <a href="/" title="QuickBihar Home — Online Shopping in Bihar" style="color: #4F46E5; font-weight: 600;">Home</a> &bull;
        <a href="/top-selling" title="Top Selling Fashion in Bihar" style="color: #4F46E5; font-weight: 600;">Top Selling</a> &bull;
        <a href="/mall" title="Shopping Malls in Bihar" style="color: #4F46E5; font-weight: 600;">Shopping Malls</a> &bull;
        <a href="/robots.txt" title="QuickBihar Robots.txt" style="color: #4F46E5;">Robots.txt</a> &bull;
        <a href="/sitemap.xml" title="QuickBihar Sitemap.xml" style="color: #4F46E5;">Sitemap.xml</a>
      </nav>
    </header>
    <main style="padding: 16px 20px;">
      ${categoriesHtml}
      ${productsHtml}
      ${mallsHtml}
    </main>
    <footer style="padding: 20px; border-top: 1px solid #eee; margin-top: 32px; font-size: 12px; color: #777;">
      <p>&copy; ${new Date().getFullYear()} QuickBihar. Local Fashion, Clothing &amp; Daily Essentials with Fast Doorstep Delivery across Bihar.</p>
    </footer>
  `;

  if (html.includes('<div id="root"></div>')) {
    return html.replace('<div id="root"></div>', `<div id="root">${fallbackBody}</div>`);
  }
  return html;
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

  // 1. Fetch Catalog Data from Backend
  console.log(`[prerender-seo] Fetching catalog data from ${siteBase}/api/v1...`);

  // 1a. Categories
  const catRes = await safeFetchJson<any>(`${siteBase}/api/v1/categories/public`);
  let categories: any[] = Array.isArray(catRes?.data)
    ? catRes.data
    : Array.isArray(catRes)
    ? catRes
    : [];

  // Default core clothing categories fallback
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

  // 1b. Products
  const prodRes = await safeFetchJson<{ data?: { products?: any[] } | any[] }>(
    `${siteBase}/api/v1/products/public?vertical=CLOTHING&limit=100`
  );
  const rawProducts = Array.isArray(prodRes?.data)
    ? prodRes!.data
    : Array.isArray((prodRes?.data as any)?.products)
    ? (prodRes?.data as any).products
    : [];
  console.log(`[prerender-seo] Fetched ${rawProducts.length} public products.`);

  // 1c. Malls
  const mallRes = await safeFetchJson<{ data?: any[] }>(`${siteBase}/api/v1/malls`);
  const malls: any[] = Array.isArray(mallRes?.data) ? mallRes!.data : [];
  console.log(`[prerender-seo] Fetched ${malls.length} malls.`);

  // 2. Home / Storefront Root Pre-rendering
  const homeTitle = "QuickBihar | Shop Fashion & Clothing Online in Bihar";
  const homeDesc =
    "Shop the latest fashion, ethnic wear, and daily essentials from trusted local stores in Bihar. Ultra-fast doorstep delivery.";
  const homeKeywords =
    "QuickBihar, online shopping Bihar, clothing store Patna, ethnic wear Bihar, sarees Bihar, men clothing, women clothing, Bihar fast delivery, local stores Bihar";

  const homeMeta = staticPageMeta({
    title: homeTitle,
    description: homeDesc,
    keywords: homeKeywords,
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

  let homeHtml = injectMetadata(baseHtml, homeMeta, homeSchemas);
  homeHtml = injectCrawlerBodyFallback(homeHtml, {
    h1Title: homeTitle,
    description: homeDesc,
    categories,
    malls,
    products: rawProducts,
  });

  // Write home HTML across root and clothing/home path variations
  writeStaticHtml("index.html", homeHtml);
  writeStaticHtml("clothing/home.html", homeHtml);
  writeStaticHtml("clothing/home/index.html", homeHtml);
  writeStaticHtml("(tabs)/clothing/home.html", homeHtml);
  writeStaticHtml("(tabs)/clothing/home/index.html", homeHtml);
  generatedCount += 5;

  // 3. Hub Pages
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
  let topSellingHtml = injectMetadata(baseHtml, topSellingMeta, [topSellingBreadcrumbs]);
  topSellingHtml = injectCrawlerBodyFallback(topSellingHtml, {
    h1Title: "Top Selling Fashion & Clothing in Bihar",
    description: "Browse best-selling styles, trending clothing, and top-rated local fashion on QuickBihar.",
    categories,
    products: rawProducts,
  });
  writeStaticHtml("top-selling.html", topSellingHtml);
  writeStaticHtml("top-selling/index.html", topSellingHtml);
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
  let mallHubHtml = injectMetadata(baseHtml, mallHubMeta, [mallBreadcrumbs]);
  mallHubHtml = injectCrawlerBodyFallback(mallHubHtml, {
    h1Title: "Shopping Malls in Bihar — Store Directories & Offers",
    description: "Explore top shopping malls, store directories, and exclusive local offers across Bihar on QuickBihar.",
    malls,
  });
  writeStaticHtml("mall.html", mallHubHtml);
  writeStaticHtml("mall/index.html", mallHubHtml);
  generatedCount += 2;

  // 4. Dynamic Template Fallbacks (for client-side routing)
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

  // 5. Not Found (+not-found.html)
  const notFoundMeta = staticPageMeta({
    title: "Page Not Found (404) | QuickBihar",
    description: "The page you are looking for does not exist on QuickBihar.",
    path: "/+not-found",
    indexable: false,
  });
  writeStaticHtml("+not-found.html", injectMetadata(baseHtml, notFoundMeta));
  generatedCount++;

  // 6. Real Category Pages
  for (const cat of categories) {
    const slug = String(cat?.slug || "").trim();
    if (!slug) continue;

    const meta = categoryMeta(cat);
    const breadcrumbs = breadcrumbJsonLd(meta.canonical, [
      { name: "Home", path: "/" },
      { name: "Categories", path: "/" },
      { name: cat.title || slug, path: `/category/${slug}` },
    ]);

    let catHtml = injectMetadata(baseHtml, meta, [breadcrumbs]);
    catHtml = injectCrawlerBodyFallback(catHtml, {
      h1Title: `${cat.title || slug} — Shop Online in Bihar`,
      description: `Shop trending ${cat.title || slug} from top local stores across Bihar on QuickBihar. Fast delivery and COD available.`,
      categories,
      products: rawProducts.filter((p: any) => p?.category?.title?.toLowerCase() === cat.title?.toLowerCase()),
    });

    writeStaticHtml(`category/${slug}.html`, catHtml);
    writeStaticHtml(`category/${slug}/index.html`, catHtml);
    generatedCount += 2;
  }

  // 7. Real Product Pages
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

    let prodHtml = injectMetadata(baseHtml, meta, schemas);
    prodHtml = injectCrawlerBodyFallback(prodHtml, {
      h1Title: prod.title || "Fashion Product",
      description: meta.description,
      categories,
    });

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

  // 8. Real Mall Pages
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

    let mallHtml = injectMetadata(baseHtml, meta, schemas);
    mallHtml = injectCrawlerBodyFallback(mallHtml, {
      h1Title: `${mall.name || "Mall"} in ${mall.location || "Bihar"}`,
      description: meta.description,
      malls,
    });

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
