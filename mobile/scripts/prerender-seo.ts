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
  locationMeta,
  locationJsonLd,
  faqJsonLd,
  type PageMeta,
} from "../src/lib/seo";
import {
  ALL_BUXAR_PAGES,
  BUXAR_DISTRICT_HUB,
  type BuxarLocation,
} from "../src/constants/locations/buxar";

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
    .replace(/<meta\b[^>]+(?:name|property)="(title|description|keywords|author|publisher|robots|twitter:[^"]+|og:[^"]+)"[^>]*>\s*/gi, "")
    .replace(/<link\b[^>]+rel="(canonical|publisher)"[^>]*>\s*/gi, "")
    .replace(/<title\b[^>]*>[\s\S]*?<\/title>\s*/gi, "")
    .replace(/<!-- (Primary Meta Tags|Open Graph \/ Facebook|Twitter|JSON-LD Structured Data) -->\s*/gi, "")
    .replace(/<script\b[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>\s*/gi, "");

  // Reset body to standard Expo SPA structure: clean <noscript>, clean <div id="root"></div>, and entry script tag
  const scriptMatch = cleaned.match(/<script\b[^>]*src="[^"]*\/_expo\/static\/js\/web\/[^"]*"[^>]*><\/script>/i);
  const scriptTag = scriptMatch ? scriptMatch[0] : "";

  const bodyStart = cleaned.indexOf("<body>");
  const bodyEnd = cleaned.indexOf("</body>");
  if (bodyStart !== -1 && bodyEnd !== -1 && scriptTag) {
    const cleanBody = `<body>
    <!-- Use static rendering with Expo Router to support running without JavaScript. -->
    <noscript>
      You need to enable JavaScript to run this app.
    </noscript>
    <!-- The root element for your Expo app. -->
    <div id="root"></div>
    ${scriptTag}
  `;
    cleaned = cleaned.slice(0, bodyStart) + cleanBody + cleaned.slice(bodyEnd);
  }

  // Add descriptive title attributes to head link tags so link-checkers don't warn about links without title
  cleaned = cleaned.replace(/<link rel="icon" href="([^"]*)"(?![^>]*title=)([^>]*)>/gi, '<link rel="icon" href="$1" title="QuickBihar Favicon"$2>');
  cleaned = cleaned.replace(/<link rel="preload" href="([^"]*)" as="style"(?![^>]*title=)([^>]*)>/gi, '<link rel="preload" href="$1" as="style" title="QuickBihar Stylesheet Preload"$2>');
  cleaned = cleaned.replace(/<link rel="stylesheet" href="([^"]*)"(?![^>]*title=)([^>]*)>/gi, '<link rel="stylesheet" href="$1" title="QuickBihar Stylesheet"$2>');

  return cleaned;
}

const APP_SHELL_SKELETON = `
    <div id="root">
      <div style="max-width:480px;margin:0 auto;background:#ffffff;min-height:100vh;width:100%;display:flex;flex-direction:column;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;box-sizing:border-box;">
        <style>
          @keyframes qb-shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          .qb-skel {
            background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 37%, #f1f5f9 63%);
            background-size: 400% 100%;
            animation: qb-shimmer 1.4s ease infinite;
          }
        </style>

        <!-- Top Header: Brand/Location & Search Bar Skeleton -->
        <div style="padding:14px 16px 10px;border-bottom:1px solid #f1f5f9;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <div class="qb-skel" style="width:34px;height:34px;border-radius:10px;"></div>
              <div style="display:flex;flex-direction:column;gap:4px;">
                <div class="qb-skel" style="width:85px;height:12px;border-radius:4px;"></div>
                <div class="qb-skel" style="width:130px;height:10px;border-radius:4px;"></div>
              </div>
            </div>
            <div class="qb-skel" style="width:34px;height:34px;border-radius:17px;"></div>
          </div>
          <!-- Search Bar Skeleton -->
          <div class="qb-skel" style="height:42px;border-radius:10px;width:100%;"></div>
        </div>

        <!-- Hero Carousel Banner Skeleton -->
        <div style="padding:12px 16px 6px;">
          <div class="qb-skel" style="height:150px;border-radius:14px;width:100%;"></div>
        </div>

        <!-- Categories Shimmer Row -->
        <div style="padding:12px 16px;">
          <div class="qb-skel" style="width:120px;height:14px;border-radius:4px;margin-bottom:12px;"></div>
          <div style="display:flex;justify-content:space-between;gap:6px;">
            <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
              <div class="qb-skel" style="width:54px;height:54px;border-radius:27px;"></div>
              <div class="qb-skel" style="width:44px;height:8px;border-radius:4px;"></div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
              <div class="qb-skel" style="width:54px;height:54px;border-radius:27px;"></div>
              <div class="qb-skel" style="width:44px;height:8px;border-radius:4px;"></div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
              <div class="qb-skel" style="width:54px;height:54px;border-radius:27px;"></div>
              <div class="qb-skel" style="width:44px;height:8px;border-radius:4px;"></div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
              <div class="qb-skel" style="width:54px;height:54px;border-radius:27px;"></div>
              <div class="qb-skel" style="width:44px;height:8px;border-radius:4px;"></div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
              <div class="qb-skel" style="width:54px;height:54px;border-radius:27px;"></div>
              <div class="qb-skel" style="width:44px;height:8px;border-radius:4px;"></div>
            </div>
          </div>
        </div>

        <!-- 2-Column Product Grid Skeleton -->
        <div style="padding:8px 16px;flex:1;">
          <div class="qb-skel" style="width:140px;height:14px;border-radius:4px;margin-bottom:12px;"></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div style="background:#fafafa;padding:8px;border-radius:12px;border:1px solid #f1f5f9;">
              <div class="qb-skel" style="height:125px;border-radius:8px;width:100%;margin-bottom:8px;"></div>
              <div class="qb-skel" style="width:80%;height:10px;border-radius:4px;margin-bottom:6px;"></div>
              <div class="qb-skel" style="width:45%;height:12px;border-radius:4px;"></div>
            </div>
            <div style="background:#fafafa;padding:8px;border-radius:12px;border:1px solid #f1f5f9;">
              <div class="qb-skel" style="height:125px;border-radius:8px;width:100%;margin-bottom:8px;"></div>
              <div class="qb-skel" style="width:80%;height:10px;border-radius:4px;margin-bottom:6px;"></div>
              <div class="qb-skel" style="width:45%;height:12px;border-radius:4px;"></div>
            </div>
          </div>
        </div>

        <!-- Sticky Bottom Navigation Bar Skeleton -->
        <div style="position:sticky;bottom:0;background:#ffffff;border-top:1px solid #f1f5f9;padding:10px 24px;display:flex;justify-content:space-between;align-items:center;">
          <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
            <div class="qb-skel" style="width:22px;height:22px;border-radius:6px;"></div>
            <div class="qb-skel" style="width:28px;height:6px;border-radius:3px;"></div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
            <div class="qb-skel" style="width:22px;height:22px;border-radius:6px;"></div>
            <div class="qb-skel" style="width:28px;height:6px;border-radius:3px;"></div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
            <div class="qb-skel" style="width:22px;height:22px;border-radius:6px;"></div>
            <div class="qb-skel" style="width:28px;height:6px;border-radius:3px;"></div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
            <div class="qb-skel" style="width:22px;height:22px;border-radius:6px;"></div>
            <div class="qb-skel" style="width:28px;height:6px;border-radius:3px;"></div>
          </div>
        </div>
      </div>
    </div>`;

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
  html = html.replace("</head>", `${headSnippet}</head>`);

  // Inject branded skeleton into #root for instant 0ms shimmer placeholder on initial load and reload
  if (html.includes('<div id="root"></div>')) {
    html = html.replace('<div id="root"></div>', APP_SHELL_SKELETON.trim());
  }

  return html;
}

/**
 * ponytail: Isolate crawler semantic HTML inside <noscript> so non-JS crawlers find H1, H2,
 * and links, while real users on reload see the branded App Shell loader without raw HTML flash.
 */
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
    const mallHeading =
      malls.length >= 10
        ? "Top 10 Shopping Malls in Bihar"
        : malls.length > 1
          ? "Featured Shopping Malls in Bihar"
          : "Featured Shopping Mall in Bihar";
    mallsHtml = `
      <section aria-labelledby="mall-heading" style="margin-top: 24px;">
        <h2 id="mall-heading">${mallHeading}</h2>
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
        <a href="/instant-delivery" title="Instant Fashion Delivery in Bihar" style="color: #4F46E5; font-weight: 600;">Instant Delivery</a> &bull;
        <a href="/locations/bihar/buxar" title="Fashion &amp; Instant Delivery in Buxar" style="color: #4F46E5; font-weight: 600;">Buxar Hub</a>
      </nav>
    </header>
    <main style="padding: 16px 20px;">
      ${categoriesHtml}
      ${productsHtml}
      ${mallsHtml}
      <section aria-labelledby="loc-heading" style="margin-top: 28px;">
        <h2 id="loc-heading">Instant Fashion &amp; Clothing Delivery in Buxar</h2>
        <p style="font-size: 13px; color: #555; margin-bottom: 12px;">Doorstep delivery of kurtis, sarees, shirts, jeans, and kids clothing across Buxar Sadar &amp; Dumraon subdivisions:</p>
        <div style="display: flex; flex-wrap: wrap; gap: 8px; font-size: 12px;">
          <a href="/locations/bihar/buxar" title="Buxar District Hub" style="padding: 6px 12px; background: #eef2ff; color: #4338ca; border-radius: 6px; text-decoration: none; font-weight: bold;">All Buxar Hubs (26 PINs)</a>
          <a href="/locations/bihar/buxar/buxar-city" title="Fashion in Buxar City 802101" style="padding: 6px 12px; background: #f8fafc; color: #334155; border: 1px solid #e2e8f0; border-radius: 6px; text-decoration: none;">Buxar City (802101)</a>
          <a href="/locations/bihar/buxar/dumraon" title="Fashion in Dumraon 802119" style="padding: 6px 12px; background: #f8fafc; color: #334155; border: 1px solid #e2e8f0; border-radius: 6px; text-decoration: none;">Dumraon (802119)</a>
          <a href="/locations/bihar/buxar/chausa" title="Fashion in Chausa 802114" style="padding: 6px 12px; background: #f8fafc; color: #334155; border: 1px solid #e2e8f0; border-radius: 6px; text-decoration: none;">Chausa (802114)</a>
          <a href="/locations/bihar/buxar/itarhi" title="Fashion in Itarhi 802123" style="padding: 6px 12px; background: #f8fafc; color: #334155; border: 1px solid #e2e8f0; border-radius: 6px; text-decoration: none;">Itarhi (802123)</a>
          <a href="/locations/bihar/buxar/rajpur" title="Fashion in Rajpur 802113" style="padding: 6px 12px; background: #f8fafc; color: #334155; border: 1px solid #e2e8f0; border-radius: 6px; text-decoration: none;">Rajpur (802113)</a>
          <a href="/locations/bihar/buxar/brahampur" title="Fashion in Brahampur 802112" style="padding: 6px 12px; background: #f8fafc; color: #334155; border: 1px solid #e2e8f0; border-radius: 6px; text-decoration: none;">Brahampur (802112)</a>
          <a href="/locations/bihar/buxar/nawanagar" title="Fashion in Nawanagar 802129" style="padding: 6px 12px; background: #f8fafc; color: #334155; border: 1px solid #e2e8f0; border-radius: 6px; text-decoration: none;">Nawanagar (802129)</a>
          <a href="/locations/bihar/buxar/simri" title="Fashion in Simri 802118" style="padding: 6px 12px; background: #f8fafc; color: #334155; border: 1px solid #e2e8f0; border-radius: 6px; text-decoration: none;">Simri (802118)</a>
        </div>
      </section>
    </main>
    <footer style="padding: 20px; border-top: 1px solid #eee; margin-top: 32px; font-size: 12px; color: #777;">
      <p>&copy; ${new Date().getFullYear()} QuickBihar. Local Fashion, Clothing &amp; Daily Essentials with Fast Doorstep Delivery across Bihar.</p>
    </footer>
  `;

  // Inject semantic fallback inside <noscript> so non-JS crawlers find it without real users seeing it
  if (html.includes("<noscript>")) {
    html = html.replace(/<noscript>[\s\S]*?<\/noscript>/i, `<noscript>\n${fallbackBody}\n    </noscript>`);
  } else {
    html = html.replace("<body>", `<body>\n    <noscript>\n${fallbackBody}\n    </noscript>`);
  }

  // Ensure #root has the branded skeleton if not already injected
  if (html.includes('<div id="root"></div>')) {
    html = html.replace('<div id="root"></div>', APP_SHELL_SKELETON.trim());
  }

  return html;
}

function injectLocationCrawlerFallback(
  html: string,
  loc: BuxarLocation,
  categories: any[] = [],
  products: any[] = []
): string {
  const pagePath =
    loc.slug === "buxar"
      ? "/locations/bihar/buxar"
      : `/locations/bihar/buxar/${loc.slug}`;

  const faqsHtml = loc.faqs
    .map(
      (f) => `
      <div style="margin-bottom: 12px;">
        <h3 style="font-size: 14px; font-weight: 700; margin: 0 0 4px 0;">${escapeHtml(f.question)}</h3>
        <p style="font-size: 13px; color: #555; margin: 0;">${escapeHtml(f.answer)}</p>
      </div>`
    )
    .join("\n");

  const categoriesHtml = (categories.length > 0 ? categories.slice(0, 8) : [
    { title: "Sarees", slug: "sarees" },
    { title: "Kurtis & Suits", slug: "kurtis-suits" },
    { title: "Men's Wear", slug: "mens-wear" },
    { title: "Jeans", slug: "jeans" },
    { title: "Kids Wear", slug: "kids-wear" },
  ])
    .map(
      (cat) => `
      <a href="/category/${cat.slug}" title="Shop ${escapeHtml(cat.title)} in ${escapeHtml(loc.name)}" style="display: inline-block; margin: 4px 8px 4px 0; padding: 4px 10px; background: #EEF2FF; color: #4338CA; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: 600;">
        ${escapeHtml(cat.title)}
      </a>`
    )
    .join("\n");

  const localitiesHtml = loc.localities
    .map(
      (n) => `
      <span style="display: inline-block; margin: 4px 6px 4px 0; padding: 3px 8px; background: #F3F4F6; color: #374151; border-radius: 4px; font-size: 11px;">
        ${escapeHtml(n)}
      </span>`
    )
    .join("\n");

  const pinsHtml = loc.pins
    .map(
      (pin) => `
      <span style="display: inline-block; margin: 4px 6px 4px 0; padding: 3px 8px; background: #FEF3C7; color: #92400E; border-radius: 4px; font-size: 11px; font-weight: 700;">
        PIN ${escapeHtml(pin)}
      </span>`
    )
    .join("\n");

  // Direct product links so crawlers discover PDPs from location hubs in one hop.
  let trendingHtml = "";
  if (products.length > 0) {
    trendingHtml = `
      <section style="margin-top: 20px;">
        <h2 style="font-size: 16px; font-weight: 700; margin-bottom: 8px;">Trending Fashion for ${escapeHtml(loc.name)}</h2>
        <div style="display: flex; flex-wrap: wrap; gap: 12px;">
          ${products
            .slice(0, 6)
            .map((p) => {
              const id = p.slug || p._id || p.id;
              const title = p.title || "Fashion Product";
              const img = p.images?.[0]?.url || "https://quickbihar.in/assets/images/icons/splash-icon.png";
              if (!id) return "";
              return `
            <div style="width: 130px;">
              <a href="/product/${id}" title="Shop ${escapeHtml(title)} in ${escapeHtml(loc.name)}" style="text-decoration: none; color: inherit;">
                <img src="${escapeHtml(img)}" alt="${escapeHtml(title)} — delivery in ${escapeHtml(loc.name)}" width="130" height="150" style="border-radius: 8px; object-fit: cover;" />
                <div style="font-size: 12px; font-weight: 600; margin-top: 4px;">${escapeHtml(title)}</div>
              </a>
            </div>`;
            })
            .join("\n")}
        </div>
        <div style="margin-top: 10px; font-size: 13px;">
          <a href="/top-selling" title="Top selling fashion in Bihar" style="color: #4F46E5; font-weight: 600;">View all top-selling fashion →</a>
        </div>
      </section>
    `;
  }

  const fallbackBody = `
    <header style="padding: 16px 20px; border-bottom: 1px solid #eee;">
      <h1 style="font-size: 22px; font-weight: 900; margin: 0 0 8px 0;">Online Fashion & Clothes Delivery in ${escapeHtml(loc.name)}, Buxar</h1>
      <p style="font-size: 14px; color: #555; margin: 0 0 8px 0;">${escapeHtml(loc.metaDescription)}</p>
      <p lang="hi" style="font-size: 13px; color: #1E3A8A; margin: 0 0 12px 0; background: #EFF6FF; padding: 8px 10px; border-radius: 8px;">${escapeHtml(loc.name)} में ऑनलाइन कपड़े मंगाना अब आसान — साड़ी, कुर्ती, जींस और किड्स वियर Cash on Delivery के साथ घर बैठे पाएं।</p>
      <div style="font-size: 12px; color: #4F46E5; font-weight: 700; margin-bottom: 8px;">
        ⚡ ${escapeHtml(loc.deliveryTime)} &bull; Subdivision: ${escapeHtml(loc.subdivision)} &bull; Block: ${escapeHtml(loc.block)}
      </div>
      <nav aria-label="Main Site Navigation" style="font-size: 13px;">
        <a href="/" title="QuickBihar Home" style="color: #4F46E5; font-weight: 600;">Home</a> &bull;
        <a href="/locations/bihar/buxar" title="Buxar District Fashion Delivery" style="color: #4F46E5; font-weight: 600;">Buxar District</a> &bull;
        <a href="/top-selling" title="Top Selling Fashion in Bihar" style="color: #4F46E5; font-weight: 600;">Top Selling</a>
      </nav>
    </header>
    <main style="padding: 16px 20px;">
      <section style="margin-top: 20px;">
        <h2 style="font-size: 16px; font-weight: 700; margin-bottom: 8px;">Popular Clothing Categories in ${escapeHtml(loc.name)}</h2>
        <div>${categoriesHtml}</div>
      </section>
      ${trendingHtml}
      <section style="margin-top: 20px;">
        <h2 style="font-size: 16px; font-weight: 700; margin-bottom: 8px;">Areas & Localities Covered in ${escapeHtml(loc.name)}</h2>
        <div>${localitiesHtml}</div>
      </section>
      <section style="margin-top: 20px;">
        <h2 style="font-size: 16px; font-weight: 700; margin-bottom: 8px;">PIN Codes Served</h2>
        <div>${pinsHtml}</div>
      </section>
      <section style="margin-top: 24px;">
        <h2 style="font-size: 16px; font-weight: 700; margin-bottom: 12px;">Frequently Asked Questions (FAQs)</h2>
        ${faqsHtml}
      </section>
    </main>
    <footer style="padding: 20px; border-top: 1px solid #eee; margin-top: 32px; font-size: 12px; color: #777;">
      <p>&copy; ${new Date().getFullYear()} QuickBihar. Local Fashion, Clothing &amp; Daily Essentials with Fast Doorstep Delivery across Buxar, Bihar.</p>
    </footer>
  `;

  if (html.includes("<noscript>")) {
    html = html.replace(/<noscript>[\s\S]*?<\/noscript>/i, `<noscript>\n${fallbackBody}\n    </noscript>`);
  } else {
    html = html.replace("<body>", `<body>\n    <noscript>\n${fallbackBody}\n    </noscript>`);
  }

  if (html.includes('<div id="root"></div>')) {
    html = html.replace('<div id="root"></div>', APP_SHELL_SKELETON.trim());
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
      areaServed: [
        { "@type": "State", name: "Bihar", addressCountry: "IN" },
        { "@type": "AdministrativeArea", name: "Buxar District, Bihar", addressCountry: "IN" },
      ],
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

  // Write home HTML across root and clothing/home path variations.
  // NOTE: /clothing/home is a duplicate of / — the root stays indexable while
  // the alias variants are noindex with canonical → / so crawlers consolidate
  // instead of indexing two identical pages.
  writeStaticHtml("index.html", homeHtml);
  const homeAliasMeta = staticPageMeta({
    title: homeTitle,
    description: homeDesc,
    keywords: homeKeywords,
    path: "/",
    image: `${siteBase}/assets/images/icons/splash-icon.png`,
    indexable: false,
  });
  let homeAliasHtml = injectMetadata(baseHtml, homeAliasMeta);
  homeAliasHtml = injectCrawlerBodyFallback(homeAliasHtml, {
    h1Title: homeTitle,
    description: homeDesc,
    categories,
    malls,
    products: rawProducts,
  });
  writeStaticHtml("clothing/home.html", homeAliasHtml);
  writeStaticHtml("clothing/home/index.html", homeAliasHtml);
  writeStaticHtml("(tabs)/clothing/home.html", homeAliasHtml);
  writeStaticHtml("(tabs)/clothing/home/index.html", homeAliasHtml);
  generatedCount += 5;

  // 2b. Search hub (clean path only — query variants stay noindex + robots-blocked).
  const searchHubMeta = staticPageMeta({
    title: "Search Fashion Online in Bihar | QuickBihar",
    description: "Search clothes, ethnic wear and accessories from local Bihar stores on QuickBihar.",
    path: "/clothing/search",
    image: `${siteBase}/assets/images/icons/splash-icon.png`,
    indexable: true,
  });
  const searchBreadcrumbs = breadcrumbJsonLd(searchHubMeta.canonical, [
    { name: "Home", path: "/" },
    { name: "Search", path: "/clothing/search" },
  ]);
  let searchHubHtml = injectMetadata(baseHtml, searchHubMeta, [searchBreadcrumbs]);
  searchHubHtml = injectCrawlerBodyFallback(searchHubHtml, {
    h1Title: "Search Fashion Online in Bihar",
    description: "Search clothes, ethnic wear and accessories from local Bihar stores on QuickBihar.",
    categories,
    products: rawProducts,
  });
  writeStaticHtml("clothing/search.html", searchHubHtml);
  writeStaticHtml("clothing/search/index.html", searchHubHtml);
  writeStaticHtml("(tabs)/clothing/search.html", searchHubHtml);
  writeStaticHtml("(tabs)/clothing/search/index.html", searchHubHtml);
  generatedCount += 4;

  // 2c. Functional/private shells — noindex so they never serve homepage-duplicate indexable HTML.
  const privateShell = (pageTitle: string, desc: string, pagePath: string) =>
    injectMetadata(
      baseHtml,
      staticPageMeta({ title: pageTitle, description: desc, path: pagePath, indexable: false })
    );
  writeStaticHtml(
    "clothing/cart.html",
    privateShell("Cart | QuickBihar", "Your QuickBihar shopping cart.", "/clothing/cart")
  );
  writeStaticHtml(
    "clothing/cart/index.html",
    privateShell("Cart | QuickBihar", "Your QuickBihar shopping cart.", "/clothing/cart")
  );
  writeStaticHtml("auth.html", privateShell("Sign In | QuickBihar", "Sign in to QuickBihar.", "/auth"));
  writeStaticHtml("auth/index.html", privateShell("Sign In | QuickBihar", "Sign in to QuickBihar.", "/auth"));
  generatedCount += 4;

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

  // 3b. Instant Delivery Hub
  const instantDeliveryMeta = staticPageMeta({
    title: "Instant Fashion & Clothes Delivery in Bihar | QuickBihar",
    description: "Check same day & instant doorstep delivery coverage for fashion, kurtis, sarees, shirts & kids clothing across Buxar, Dumraon and Bihar.",
    path: "/instant-delivery",
    image: `${siteBase}/assets/images/icons/splash-icon.png`,
    indexable: true,
  });
  const instantDeliveryBreadcrumbs = breadcrumbJsonLd(instantDeliveryMeta.canonical, [
    { name: "Home", path: "/" },
    { name: "Instant Delivery", path: "/instant-delivery" },
  ]);
  let instantDeliveryHtml = injectMetadata(baseHtml, instantDeliveryMeta, [instantDeliveryBreadcrumbs]);
  instantDeliveryHtml = injectCrawlerBodyFallback(instantDeliveryHtml, {
    h1Title: "Instant Fashion & Clothes Delivery in Bihar",
    description: "Check same day & instant doorstep delivery coverage for fashion, kurtis, sarees, shirts & kids clothing across Buxar, Dumraon and Bihar.",
    categories,
  });
  writeStaticHtml("instant-delivery.html", instantDeliveryHtml);
  writeStaticHtml("instant-delivery/index.html", instantDeliveryHtml);
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
      // Legacy ID URL: noindex + canonical → slug so link equity consolidates.
      const idMeta: PageMeta = { ...meta, robots: "noindex, nofollow" };
      let idHtml = injectMetadata(baseHtml, idMeta);
      idHtml = injectCrawlerBodyFallback(idHtml, {
        h1Title: prod.title || "Fashion Product",
        description: meta.description,
        categories,
      });
      writeStaticHtml(`product/${id}.html`, idHtml);
      writeStaticHtml(`product/${id}/index.html`, idHtml);
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
      // Legacy ID URL: noindex + canonical → slug so link equity consolidates.
      const idMeta: PageMeta = { ...meta, robots: "noindex, nofollow" };
      let idHtml = injectMetadata(baseHtml, idMeta);
      idHtml = injectCrawlerBodyFallback(idHtml, {
        h1Title: `${mall.name || "Mall"} in ${mall.location || "Bihar"}`,
        description: meta.description,
        malls,
      });
      writeStaticHtml(`mall/${id}.html`, idHtml);
      writeStaticHtml(`mall/${id}/index.html`, idHtml);
      generatedCount += 2;
    }
  }

  // 9. Buxar Local SEO Landing Pages (District Hub + All 11 Blocks)
  console.log(`[prerender-seo] Prerendering ${ALL_BUXAR_PAGES.length} Buxar location pages...`);
  for (const loc of ALL_BUXAR_PAGES) {
    const pagePath =
      loc.slug === "buxar"
        ? "/locations/bihar/buxar"
        : `/locations/bihar/buxar/${loc.slug}`;

    const meta = locationMeta({
      title: loc.title,
      metaDescription: loc.metaDescription,
      keywords: loc.keywords,
      path: pagePath,
      image: (loc as BuxarLocation).image,
    });

    const schemas: Record<string, any>[] = [];
    schemas.push(
      locationJsonLd({
        name: loc.name,
        canonical: canonicalUrl(pagePath),
        pins: loc.pins,
        subdivision: loc.subdivision,
        description: loc.metaDescription,
        image: (loc as BuxarLocation).image,
      })
    );

    schemas.push(
      breadcrumbJsonLd(
        canonicalUrl(pagePath),
        loc.slug === "buxar"
          ? [
              { name: "Home", path: "/" },
              { name: "Locations", path: "/locations/bihar/buxar" },
              { name: "Bihar", path: "/locations/bihar/buxar" },
              { name: "Buxar", path: pagePath },
            ]
          : [
              { name: "Home", path: "/" },
              { name: "Locations", path: "/locations/bihar/buxar" },
              { name: "Buxar", path: "/locations/bihar/buxar" },
              { name: loc.name, path: pagePath },
            ]
      )
    );

    const faqSchema = faqJsonLd(loc.faqs);
    if (faqSchema) schemas.push(faqSchema);

    let locHtml = injectMetadata(baseHtml, meta, schemas);
    locHtml = injectLocationCrawlerFallback(locHtml, loc, categories, rawProducts);

    if (loc.slug === "buxar") {
      writeStaticHtml("locations/bihar/buxar.html", locHtml);
      writeStaticHtml("locations/bihar/buxar/index.html", locHtml);
      generatedCount += 2;
    } else {
      writeStaticHtml(`locations/bihar/buxar/${loc.slug}.html`, locHtml);
      writeStaticHtml(`locations/bihar/buxar/${loc.slug}/index.html`, locHtml);
      generatedCount += 2;
    }
  }

  console.log(`[prerender-seo] Successfully generated ${generatedCount} static SEO pages in dist/!`);
}

main().catch((err) => {
  console.error("[prerender-seo] Unhandled error:", err);
  process.exit(1);
});
