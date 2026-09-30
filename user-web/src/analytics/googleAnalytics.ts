/**
 * @file src/analytics/googleAnalytics.ts
 * Google Analytics 4 (GA4) integration for QuickBihar (React + Vite SPA).
 *
 * - Measurement ID is read from `VITE_GA_MEASUREMENT_ID` (public identifier,
 *   NOT a secret) with the production ID as fallback so tracking works even
 *   when the env var is missing.
 * - The gtag.js script is injected ONCE (module + window guards survive React
 *   StrictMode double-effects). Automatic page_view is disabled
 *   (`send_page_view: false`) because <RouteTracker /> sends manual page_view
 *   events on every React Router navigation — this avoids duplicates.
 * - Every analytics call is wrapped in try/catch and no-ops when GA fails to
 *   load, when running outside a browser (SSG prerender), or when consent /
 *   ad-blockers remove gtag. Analytics NEVER breaks cart, checkout, auth,
 *   routing, or API flows.
 * - Privacy: page URLs are sanitized before sending (query allowlist +
 *   utm_* passthrough). Never pass PII (emails, phones, addresses, tokens,
 *   OTPs) in event params, URLs, or item fields.
 */

export const GA_MEASUREMENT_ID_FALLBACK = "G-VXLCL1EE0J";

export const GA_CURRENCY = "INR";

/** GA catalog values used to distinguish the three marketplace verticals. */
export type GaCatalog = "clothing" | "jewellery" | "food";

export interface GaItem {
  item_id: string;
  item_name: string;
  item_category?: string;
  item_category2?: string;
  item_category3?: string;
  item_variant?: string;
  price?: number;
  quantity?: number;
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    __qbGaInitialized?: string | boolean;
  }
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

/** Measurement ID from env (public), falling back to the production ID. */
export function getMeasurementId(): string {
  try {
    const fromEnv =
      typeof import.meta !== "undefined"
        ? (import.meta.env?.VITE_GA_MEASUREMENT_ID as string | undefined)
        : undefined;
    const cleaned = (fromEnv || "").trim();
    if (cleaned) return cleaned;
  } catch {
    // import.meta.env unavailable (e.g. SSG prerender) — use fallback.
  }
  return GA_MEASUREMENT_ID_FALLBACK;
}

/** True once the gtag stub + config have been installed in this page. */
export function isGaInitialized(): boolean {
  if (!isBrowser()) return false;
  return Boolean(window.__qbGaInitialized);
}

/**
 * Load gtag.js once and configure GA4 with manual page_view mode.
 * Safe to call repeatedly (StrictMode, HMR, re-mounts) — subsequent calls
 * are no-ops. Never throws.
 */
export function initGA4(): void {
  if (!isBrowser()) return;
  if (window.__qbGaInitialized) return;
  try {
    const measurementId = getMeasurementId();
    if (!measurementId) return;

    window.dataLayer = window.dataLayer || [];
    if (typeof window.gtag !== "function") {
      window.gtag = function gtag(...args: unknown[]) {
        window.dataLayer!.push(args);
      };
    }
    // Mark initialized BEFORE injecting so concurrent StrictMode effects
    // cannot double-inject the script tag.
    window.__qbGaInitialized = measurementId;

    window.gtag("js", new Date());
    // Manual SPA page_view mode: <RouteTracker /> sends page_view on every
    // route change (including the first load), so the automatic hit must be
    // off to avoid double-counting the landing page.
    window.gtag("config", measurementId, { send_page_view: false });

    const existing = document.querySelector(
      `script[data-qb-ga="${measurementId}"]`,
    );
    if (!existing) {
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
        measurementId,
      )}`;
      script.setAttribute("data-qb-ga", measurementId);
      document.head.appendChild(script);
    }
  } catch {
    // Analytics must never break the app.
  }
}

/** Low-level safe event sender. Drops the event when GA isn't ready. */
export function trackEvent(
  eventName: string,
  params?: Record<string, unknown>,
): void {
  try {
    if (!isBrowser() || typeof window.gtag !== "function") return;
    if (!window.__qbGaInitialized) return;
    if (params) {
      window.gtag("event", eventName, params);
    } else {
      window.gtag("event", eventName);
    }
  } catch {
    // Never let analytics break business functionality.
  }
}

/* ── Privacy: URL sanitization ────────────────────────────────────────────
 * Checkout/address flows put PII into the URL (e.g. ?data={...address with
 * phone...}, ?id=...). GA must never receive it, so page_view URLs are
 * rebuilt from the pathname plus an allowlist of known-safe query keys
 * (utm_* marketing params pass through). Everything else is dropped.
 */
const SAFE_QUERY_KEYS = new Set([
  "query",
  "categoryid",
  "categoryname",
  "subcategory",
  "orderid",
  "id",
  "productid",
  "page",
  "sort",
]);

interface SanitizedPage {
  pagePath: string;
  pageLocation: string;
}

export function sanitizePageUrl(pathname: string, search: string): SanitizedPage {
  const safePath = pathname && pathname.startsWith("/") ? pathname : "/";
  let filtered = "";
  try {
    const params = new URLSearchParams(search || "");
    const kept = new URLSearchParams();
    params.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (lower.startsWith("utm_") || SAFE_QUERY_KEYS.has(lower)) {
        kept.append(key, value);
      }
    });
    const qs = kept.toString();
    filtered = qs ? `?${qs}` : "";
  } catch {
    filtered = "";
  }
  const pagePath = `${safePath}${filtered}`;
  let pageLocation = pagePath;
  try {
    if (isBrowser()) {
      pageLocation = `${window.location.origin}${pagePath}`;
    }
  } catch {
    pageLocation = pagePath;
  }
  return { pagePath, pageLocation };
}

/* ── Catalog resolution ─────────────────────────────────────────────────── */

function normalizeCatalogToken(value: unknown): GaCatalog | null {
  const v = String(value || "").trim().toLowerCase();
  if (!v) return null;
  if (v === "jewelery" || v === "jewellery" || v === "jewelry") return "jewellery";
  if (v === "clothing" || v === "fashion" || v === "apparel") return "clothing";
  if (v === "food" || v === "eats") return "food";
  return null;
}

/**
 * Resolve the GA catalog for a server product (IProduct shape). Uses real
 * product data — jeweleryDetails / foodDetails / vertical — never guesses.
 */
export function resolveProductCatalog(product: unknown): GaCatalog {
  try {
    const p = product as Record<string, unknown> | null;
    if (!p || typeof p !== "object") return "clothing";
    if (p.jeweleryDetails) return "jewellery";
    if (p.foodDetails) return "food";
    const fromVertical =
      normalizeCatalogToken(p.vertical) || normalizeCatalogToken(p.module);
    if (fromVertical) return fromVertical;
    return "clothing";
  } catch {
    return "clothing";
  }
}

/** Map a cart line's owning module ("clothing" | "jewelery") to GA catalog. */
export function resolveCartModuleCatalog(module: unknown): GaCatalog {
  return normalizeCatalogToken(module) || "clothing";
}

/**
 * Catalog for the current route, used as the `catalog` param on page_view so
 * the Traffic → Catalog funnel stays segmentable. Returns undefined for
 * mixed/neutral routes (e.g. "/") where no catalog claim should be made.
 */
export function resolveCatalogFromPath(pathname: string): GaCatalog | undefined {
  const p = (pathname || "").toLowerCase();
  if (p === "/" || p === "") return undefined;
  if (p.startsWith("/jewelery") || p.startsWith("/jewelry")) return "jewellery";
  if (p.startsWith("/food")) return "food";
  return "clothing";
}

/** Per-unit selling price mirroring the cart store's GST-inclusive math. */
export function effectiveUnitPrice(
  product: unknown,
): number | undefined {
  try {
    const p = product as Record<string, unknown> | null;
    if (!p || typeof p !== "object") return undefined;
    const base = Number(p.price);
    if (!Number.isFinite(base)) return undefined;
    const isGst = Boolean(p.isGstApplicable);
    const gstPct = Number(p.gstPercentage) || 0;
    if (isGst && gstPct > 0) return Math.round(base * (1 + gstPct / 100));
    return Math.round(base);
  } catch {
    return undefined;
  }
}

/* ── GA item builders (adapted to the real QuickBihar data model) ───────── */

function cleanString(value: unknown): string | undefined {
  const s = String(value ?? "").trim();
  return s ? s : undefined;
}

function cleanNumber(value: unknown): number | undefined {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

/** GA item from a server IProduct (view_item / add_to_cart). */
export function gaItemFromProduct(
  product: unknown,
  quantity = 1,
  variantLabel?: string,
): GaItem {
  const p = (product || {}) as Record<string, unknown>;
  const catalog = resolveProductCatalog(product);
  const item: GaItem = {
    item_id: cleanString(p._id ?? p.id) || "unknown",
    item_name: cleanString(p.title ?? (p as Record<string, unknown>).name) || "Product",
    item_category: catalog,
    quantity: quantity > 0 ? quantity : 1,
  };
  const category2 = cleanString(p.category ?? (p as Record<string, unknown>).collection);
  const category3 = cleanString(
    p.subCategory ?? (p as Record<string, unknown>).metal,
  );
  if (category2) item.item_category2 = category2;
  if (category3) item.item_category3 = category3;
  const price = effectiveUnitPrice(product);
  if (price !== undefined) item.price = price;
  const variant =
    cleanString(variantLabel) ||
    [
      cleanString((p as Record<string, unknown>).selectedColor),
      cleanString((p as Record<string, unknown>).selectedSize),
    ]
      .filter(Boolean)
      .join(" / ") ||
    undefined;
  if (variant) item.item_variant = variant;
  return item;
}

/** GA item from a cart-store line (CartItem shape). */
export function gaItemFromCartLine(line: unknown): GaItem {
  const l = (line || {}) as Record<string, unknown>;
  const item: GaItem = {
    item_id: cleanString(l.productId) || cleanString(l.sku) || "unknown",
    item_name: cleanString(l.productTitle) || "Product",
    item_category: resolveCartModuleCatalog(l.module),
    quantity: cleanNumber(l.quantity) || 1,
  };
  const price = cleanNumber(l.price);
  if (price !== undefined) item.price = Math.round(price);
  const variant = [cleanString(l.selectedColor), cleanString(l.selectedSize)]
    .filter(Boolean)
    .join(" / ");
  if (variant) item.item_variant = variant;
  return item;
}

/**
 * GA item from a server order line (order.model item shape:
 * { productId, title, sku, size, color, quantity, price }).
 * Order lines carry no category, so the caller passes the catalog implied
 * by the checkout that created the order.
 */
export function gaItemFromOrderLine(
  line: unknown,
  fallbackCatalog: GaCatalog,
): GaItem {
  const l = (line || {}) as Record<string, unknown>;
  const item: GaItem = {
    item_id:
      cleanString(
        typeof l.productId === "object" && l.productId !== null
          ? (l.productId as Record<string, unknown>)._id
          : l.productId,
      ) ||
      cleanString(l.sku) ||
      "unknown",
    item_name: cleanString(l.title) || "Product",
    item_category: fallbackCatalog,
    quantity: cleanNumber(l.quantity) || 1,
  };
  const price = cleanNumber(l.price);
  if (price !== undefined) item.price = Math.round(price);
  const variant = [cleanString(l.color), cleanString(l.size)]
    .filter(Boolean)
    .join(" / ");
  if (variant) item.item_variant = variant;
  return item;
}

function itemsValue(items: GaItem[]): number {
  return items.reduce(
    (sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 1),
    0,
  );
}

/* ── Page views (SPA) ───────────────────────────────────────────────────── */

export function trackPageView(pathname: string, search = ""): void {
  try {
    const { pagePath, pageLocation } = sanitizePageUrl(pathname, search);
    const catalog = resolveCatalogFromPath(pathname);
    const params: Record<string, unknown> = {
      page_path: pagePath,
      page_location: pageLocation,
    };
    try {
      if (isBrowser() && document.title) params.page_title = document.title;
    } catch {
      // title is best-effort only.
    }
    if (catalog) params.catalog = catalog;
    trackEvent("page_view", params);
  } catch {
    // Never break navigation.
  }
}

/* ── E-commerce events (GA4 recommended) ────────────────────────────────── */

export function trackViewItem(
  product: unknown,
  quantity = 1,
  variantLabel?: string,
): void {
  try {
    const item = gaItemFromProduct(product, quantity, variantLabel);
    trackEvent("view_item", {
      currency: GA_CURRENCY,
      value: itemsValue([item]),
      catalog: item.item_category,
      items: [item],
    });
  } catch {
    // no-op
  }
}

export function trackAddToCart(
  product: unknown,
  quantity = 1,
  variantLabel?: string,
): void {
  try {
    const item = gaItemFromProduct(product, quantity, variantLabel);
    trackEvent("add_to_cart", {
      currency: GA_CURRENCY,
      value: itemsValue([item]),
      catalog: item.item_category,
      items: [item],
    });
  } catch {
    // no-op
  }
}

/** add_to_cart from an already-built cart line (used by the cart store). */
export function trackAddToCartLine(line: unknown): void {
  try {
    const item = gaItemFromCartLine(line);
    trackEvent("add_to_cart", {
      currency: GA_CURRENCY,
      value: itemsValue([item]),
      catalog: item.item_category,
      items: [item],
    });
  } catch {
    // no-op
  }
}

export function trackRemoveFromCartLine(line: unknown): void {
  try {
    const item = gaItemFromCartLine(line);
    trackEvent("remove_from_cart", {
      currency: GA_CURRENCY,
      value: itemsValue([item]),
      catalog: item.item_category,
      items: [item],
    });
  } catch {
    // no-op
  }
}

export function trackBeginCheckout(lines: unknown[]): void {
  try {
    const items = ((lines || []) as unknown[]).map(gaItemFromCartLine);
    if (items.length === 0) return;
    const catalogs = new Set(items.map((i) => i.item_category));
    trackEvent("begin_checkout", {
      currency: GA_CURRENCY,
      value: itemsValue(items),
      ...(catalogs.size === 1 ? { catalog: [...catalogs][0] } : {}),
      items,
    });
  } catch {
    // no-op
  }
}

export interface PurchaseData {
  transactionId: string;
  value: number;
  items: GaItem[];
  catalog: GaCatalog;
  coupon?: string;
  shipping?: number;
  tax?: number;
}

const PURCHASE_FLAG_PREFIX = "qb_ga_purchase_";

export function hasFiredPurchase(transactionId: string): boolean {
  try {
    if (!isBrowser() || !transactionId) return false;
    return window.localStorage?.getItem(PURCHASE_FLAG_PREFIX + transactionId) === "1";
  } catch {
    return false;
  }
}

function markPurchaseFired(transactionId: string): void {
  try {
    window.localStorage?.setItem(PURCHASE_FLAG_PREFIX + transactionId, "1");
  } catch {
    // Storage may be unavailable (private mode) — the in-memory fallback
    // below still dedupes within the page lifetime.
    try {
      (markPurchaseFired as unknown as Record<string, string>)[transactionId] = "1";
    } catch {
      // no-op
    }
  }
}

/**
 * purchase — fire ONCE per server order ID. Refreshing the order-success
 * page (or re-mounting in StrictMode) will not emit a duplicate because the
 * order ID is recorded in localStorage before sending.
 */
export function trackPurchase(data: PurchaseData): boolean {
  try {
    const transactionId = String(data.transactionId || "").trim();
    if (!transactionId) return false;
    if (hasFiredPurchase(transactionId)) return false;
    const value = Number(data.value);
    if (!Number.isFinite(value)) return false;
    if (!Array.isArray(data.items) || data.items.length === 0) return false;
    markPurchaseFired(transactionId);
    const params: Record<string, unknown> = {
      transaction_id: transactionId,
      currency: GA_CURRENCY,
      value: Math.round(value),
      catalog: data.catalog,
      items: data.items,
    };
    if (data.coupon) params.coupon = data.coupon;
    if (data.shipping !== undefined && Number.isFinite(Number(data.shipping))) {
      params.shipping = Math.round(Number(data.shipping));
    }
    if (data.tax !== undefined && Number.isFinite(Number(data.tax))) {
      params.tax = Math.round(Number(data.tax));
    }
    trackEvent("purchase", params);
    return true;
  } catch {
    return false;
  }
}

/* ── Search ─────────────────────────────────────────────────────────────── */

export function trackSearchResults(
  searchTerm: string,
  resultCount?: number,
  catalog?: GaCatalog,
): void {
  try {
    const term = String(searchTerm || "").trim();
    if (!term) return;
    const params: Record<string, unknown> = { search_term: term };
    if (catalog) params.catalog = catalog;
    if (resultCount !== undefined && Number.isFinite(Number(resultCount))) {
      params.result_count = Math.round(Number(resultCount));
    }
    trackEvent("view_search_results", params);
  } catch {
    // no-op
  }
}
