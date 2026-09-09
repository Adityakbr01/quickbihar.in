/**
 * Storefront SEO helpers (plan §15).
 *
 * Pure TypeScript — no React, no DOM, no native modules — so it is safe to import
 * from prerendered static routes, API mappers, and the sitemap service alike.
 *
 * Rendering lives in `src/components/seo/SeoHead.tsx` (expo-router `Head` wrapper).
 */

const trimTrailingSlash = (value: string) => (value || "").replace(/\/+$/, "");

/** Public site base, e.g. https://quickbihar.in (same origin as the API in prod). */
export function getSiteBase(): string {
  return trimTrailingSlash(process.env.EXPO_PUBLIC_API_ORIGIN || "https://quickbihar.in");
}

/** Absolute canonical URL for a site path (always https apex, no trailing slash, lowercase-safe). */
export function canonicalUrl(path: string): string {
  const clean = `/${String(path || "/").replace(/^\/+/, "")}`;
  const noTrailing = clean.length > 1 ? clean.replace(/\/+$/, "") : clean;
  return `${getSiteBase()}${noTrailing}`;
}

/** Truncate display strings to search-result limits without cutting words harshly. */
export function truncateText(value: string | undefined | null, max: number): string {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text || text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  if (lastSpace > max * 0.6) {
    return cut.slice(0, lastSpace).trim();
  }
  return cut.trim();
}

export const seoTitle = (value: string | undefined | null) => truncateText(value, 65);
export const seoDescription = (value: string | undefined | null) => truncateText(value, 160);

/** Strip HTML-ish noise from descriptions before using them as meta content. */
export function plainDescription(value: string | undefined | null, fallback = ""): string {
  const text = String(value || fallback || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return seoDescription(text);
}

/* ── Indexability gates (mirror of plan §12 — entity must pass ALL checks) ── */

export function isIndexableProduct(product: any): boolean {
  if (!product) return false;
  if (product.isActive === false) return false;
  if (product.isDeleted) return false;
  if (product.approvalStatus && product.approvalStatus !== "APPROVED") return false;
  if (!product.slug) return false;
  if (!product.title) return false;
  const images = Array.isArray(product.images) ? product.images : [];
  if (!images.length || !images[0]?.url) return false;
  const desc = String(product.shortDescription || product.description || "").trim();
  if (desc.length < 20) return false;
  return true;
}

export function isIndexableCategory(category: any, productCount = 1): boolean {
  if (!category) return false;
  if (category.isActive === false) return false;
  if (!category.slug) return false;
  if (!category.title) return false;
  if (productCount < 1) return false;
  return true;
}

export function isIndexableMall(mall: any): boolean {
  if (!mall) return false;
  if (mall.isActive === false) return false;
  if (mall.status && mall.status !== "APPROVED") return false;
  if (!mall.slug && !mall._id && !mall.id) return false;
  if (!mall.name) return false;
  return true;
}

/** Robots directive for a route: indexable public pages vs everything else. */
export function robotsFor(indexable: boolean): "index, follow" | "noindex, nofollow" {
  return indexable ? "index, follow" : "noindex, nofollow";
}

/* ── Metadata templates (all values derived from real entity data) ── */

export interface PageMeta {
  title: string;
  description: string;
  canonical: string;
  keywords?: string;
  author?: string;
  publisher?: string;
  image?: string;
  robots: "index, follow" | "noindex, nofollow";
  type?: "website" | "product" | "article";
}

export function productMeta(product: any): PageMeta {
  const indexable = isIndexableProduct(product);
  const brand = product?.brand ? ` — ${product.brand}` : "";
  const title = `${product?.title || "Product"}${brand}`;
  return {
    title: seoTitle(`${title} | Buy Online in Bihar | QuickBihar`),
    description:
      plainDescription(product?.shortDescription || product?.description) ||
      seoDescription(`${product?.title || "Product"} available on QuickBihar. Shop from local Bihar stores.`),
    canonical: canonicalUrl(`/product/${product?.slug || product?._id || ""}`),
    keywords: `${product?.title || "Product"}, ${product?.category?.title || "Fashion"}, buy online Bihar, QuickBihar`,
    author: "QuickBihar",
    publisher: "QuickBihar",
    image: Array.isArray(product?.images) ? product.images[0]?.url : undefined,
    robots: robotsFor(indexable),
    type: "product",
  };
}

export function categoryMeta(category: any): PageMeta {
  const indexable = isIndexableCategory(category);
  const catTitle = category?.title || "Category";
  return {
    title: seoTitle(`${catTitle} | Shop Online in Bihar | QuickBihar`),
    description:
      plainDescription(category?.seo?.metaDescription || category?.description) ||
      seoDescription(`Shop ${catTitle} from local Bihar stores on QuickBihar. Fast doorstep delivery & easy returns.`),
    canonical: canonicalUrl(`/category/${category?.slug || ""}`),
    keywords: `${catTitle} Bihar, buy ${catTitle} online, ${catTitle} Patna, local clothing Bihar, QuickBihar`,
    author: "QuickBihar",
    publisher: "QuickBihar",
    image: category?.image || category?.banner || undefined,
    robots: robotsFor(indexable),
  };
}

export function mallMeta(mall: any): PageMeta {
  const indexable = isIndexableMall(mall);
  const city = mall?.address?.city ? `, ${mall.address.city}` : "";
  return {
    title: seoTitle(`${mall?.name || "Mall"}${city} | Stores, Offers & Reviews | QuickBihar`),
    description:
      plainDescription(mall?.description) ||
      seoDescription(`${mall?.name || "Mall"}${city} — stores, collections and reviews on QuickBihar.`),
    canonical: canonicalUrl(`/mall/${mall?.slug || mall?._id || mall?.id || ""}`),
    keywords: `${mall?.name || "Mall"} Bihar, shopping mall ${city || "Bihar"}, stores in Bihar, QuickBihar`,
    author: "QuickBihar",
    publisher: "QuickBihar",
    image: mall?.coverImageUrl || mall?.logoUrl || (Array.isArray(mall?.images) ? mall.images[0]?.url : undefined),
    robots: robotsFor(indexable),
  };
}

export function staticPageMeta(input: {
  title: string;
  description: string;
  path: string;
  keywords?: string;
  author?: string;
  publisher?: string;
  image?: string;
  indexable?: boolean;
}): PageMeta {
  const indexable = input.indexable !== false;
  return {
    title: seoTitle(input.title),
    description: seoDescription(input.description),
    canonical: canonicalUrl(input.path),
    keywords:
      input.keywords ||
      "QuickBihar, online shopping Bihar, clothing store Patna, ethnic wear Bihar, sarees Bihar, local store delivery Bihar",
    author: input.author || "QuickBihar",
    publisher: input.publisher || "QuickBihar",
    image: input.image,
    robots: robotsFor(indexable),
  };
}

/* ── JSON-LD builders (visible-content-matched only; omit when required fields miss) ── */

export function productJsonLd(product: any, canonical: string): Record<string, any> | null {
  if (!product?.title || !Array.isArray(product?.images) || !product.images[0]?.url) return null;
  const price = Number(product.price);
  if (!Number.isFinite(price)) return null;
  const offers: Record<string, any> = {
    "@type": "Offer",
    url: canonical,
    priceCurrency: product.currency || "INR",
    price,
    availability:
      product.isActive === false || Number(product.totalStock) <= 0
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
  };
  const jsonLd: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    image: product.images.map((img: any) => img.url).filter(Boolean),
    description: plainDescription(product.shortDescription || product.description),
    sku: product.variants?.[0]?.sku,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    offers,
  };
  const ratingValue = Number(product.ratings?.average);
  const reviewCount = Number(product.ratings?.count);
  // Only emit aggregateRating with REAL review data — never fabricate (plan §19).
  if (Number.isFinite(ratingValue) && ratingValue > 0 && Number.isFinite(reviewCount) && reviewCount > 0) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue,
      reviewCount,
    };
  }
  return jsonLd;
}

export function itemListJsonLd(input: {
  name: string;
  description?: string;
  canonical: string;
  items: Array<{ name: string; url: string; image?: string }>;
}): Record<string, any> | null {
  if (!input.items.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.name,
    description: input.description,
    url: input.canonical,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: input.items.length,
      itemListElement: input.items.slice(0, 20).map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        url: item.url,
        ...(item.image ? { image: item.image } : {}),
      })),
    },
  };
}

export function mallJsonLd(mall: any, canonical: string): Record<string, any> | null {
  if (!mall?.name) return null;
  const jsonLd: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "ShoppingCenter",
    name: mall.name,
    url: canonical,
    description: plainDescription(mall.description),
    image: mall.coverImageUrl || mall.logoUrl || undefined,
    address: mall.address
      ? {
          "@type": "PostalAddress",
          streetAddress: mall.address.line1,
          addressLocality: mall.address.city,
          addressRegion: mall.address.state,
          postalCode: mall.address.pincode,
          addressCountry: "IN",
        }
      : undefined,
  };
  const ratingValue = Number(mall.rating);
  const reviewCount = Number(mall.reviewCount);
  if (Number.isFinite(ratingValue) && ratingValue > 0 && Number.isFinite(reviewCount) && reviewCount > 0) {
    jsonLd.aggregateRating = { "@type": "AggregateRating", ratingValue, reviewCount };
  }
  return jsonLd;
}

export function breadcrumbJsonLd(canonical: string, trail: Array<{ name: string; path?: string }>): Record<string, any> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      ...(crumb.path ? { item: canonicalUrl(crumb.path) } : { item: canonical }),
    })),
  };
}
