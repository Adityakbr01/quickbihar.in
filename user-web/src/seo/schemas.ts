/**
 * @file src/seo/schemas.ts
 * Typed Schema.org JSON-LD builders for QuickBihar (Google Rich Results).
 *
 * Uses `schema-dts` for compile-time safety. Every builder returns a plain
 * `Thing` node; `createCompositeGraph()` merges them into ONE
 * `@context/@graph` script tag (Google's recommended shape).
 */

import type {
  AggregateRating,
  BreadcrumbList,
  ClothingStore,
  ItemList,
  Offer,
  Organization,
  PostalAddress,
  Product,
  ShoppingCenter,
  Thing,
  WebPage,
  WebSite,
} from 'schema-dts';
import {
  ORG_ID,
  SITE_CONTACT_EMAIL,
  SITE_CONTACT_PHONE,
  SITE_LOGO,
  SITE_NAME,
  WEBSITE_ID,
  getCanonicalUrl,
  getSiteOrigin,
} from './site';

/** Merge nodes into a single JSON-LD `@graph` payload. */
export function createCompositeGraph(nodes: Array<Thing | null | undefined>): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@graph': (nodes || []).filter(Boolean),
  };
}

/** QuickBihar as an Organization (Knowledge-Graph entity). */
export function organizationSchema(): Organization {
  const address: PostalAddress = {
    '@type': 'PostalAddress',
    addressLocality: 'Buxar',
    addressRegion: 'Bihar',
    postalCode: '802101',
    addressCountry: 'IN',
  };
  return {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: SITE_NAME,
    url: `${getSiteOrigin()}/`,
    logo: SITE_LOGO,
    description: `${SITE_NAME} — hyperlocal marketplace. Shop from verified local Bihar stores with 60–120 min delivery.`,
    email: SITE_CONTACT_EMAIL,
    telephone: SITE_CONTACT_PHONE,
    address,
  };
}

/** Top-level WebSite entity (home page only). */
export function websiteSchema(): WebSite {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: `${getSiteOrigin()}/`,
    name: SITE_NAME,
    publisher: { '@id': ORG_ID },
  };
}

/** WebPage entity linking a URL into the site graph. */
export function webPageSchema(path: string, title: string, description: string): WebPage {
  return {
    '@type': 'WebPage',
    url: getCanonicalUrl(path),
    name: title,
    description,
    isPartOf: { '@id': WEBSITE_ID },
  };
}

/** Breadcrumb trail (must visibly match the on-page breadcrumb nav). */
export function breadcrumbSchema(items: Array<{ name: string; path?: string }>): BreadcrumbList {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      ...(item.path ? { item: getCanonicalUrl(item.path) } : {}),
    })),
  };
}

interface ProductInput {
  title?: string;
  brand?: string;
  description?: string;
  shortDescription?: string;
  images?: Array<{ url?: string }>;
  price?: number;
  currency?: string;
  totalStock?: number;
  isActive?: boolean;
  ratings?: { average?: number; count?: number };
  variants?: Array<{ sku?: string }>;
}

/** Product rich result — emitted ONLY with real price + image (never fabricate). */
export function productSchema(product: ProductInput, canonical: string): Product | null {
  const images = (Array.isArray(product?.images) ? product.images : [])
    .map((img) => img?.url)
    .filter(Boolean) as string[];
  const price = Number(product?.price);
  if (!product?.title || images.length === 0 || !Number.isFinite(price)) return null;

  const offers: Offer = {
    '@type': 'Offer',
    url: canonical,
    priceCurrency: product.currency || 'INR',
    price,
    availability:
      product.isActive === false || Number(product.totalStock) <= 0
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock',
  };

  const node: Product = {
    '@type': 'Product',
    name: String(product.title),
    image: images,
    description: String(product.shortDescription || product.description || product.title),
    sku: product.variants?.[0]?.sku,
    brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
    offers,
  };

  const ratingValue = Number(product.ratings?.average);
  const reviewCount = Number(product.ratings?.count);
  if (Number.isFinite(ratingValue) && ratingValue > 0 && Number.isFinite(reviewCount) && reviewCount > 0) {
    node.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue,
      reviewCount,
    } satisfies AggregateRating;
  }
  return node;
}

/** Collection page (category / top-selling) as an ItemList of up to 20 products. */
export function collectionSchema(input: {
  name: string;
  description?: string;
  canonical: string;
  items: Array<{ name: string; url: string; image?: string }>;
}): ItemList | null {
  if (!input.items.length) return null;
  return {
    '@type': 'CollectionPage',
    name: input.name,
    description: input.description,
    url: input.canonical,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: input.items.length,
      itemListElement: input.items.slice(0, 20).map((item, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: item.name,
        url: item.url,
        ...(item.image ? { image: item.image } : {}),
      })),
    },
  } as unknown as ItemList;
}

interface MallInput {
  name?: string;
  description?: string;
  coverImageUrl?: string;
  logoUrl?: string;
  images?: Array<{ url?: string } | string>;
  address?: { line1?: string; city?: string; state?: string; pincode?: string };
  rating?: number;
  reviewCount?: number;
}

/** Mall rich result (ShoppingCenter). */
export function mallSchema(mall: MallInput, canonical: string): ShoppingCenter | null {
  if (!mall?.name) return null;
  const firstImage = Array.isArray(mall.images) ? mall.images[0] : undefined;
  const image =
    mall.coverImageUrl ||
    mall.logoUrl ||
    (typeof firstImage === 'string' ? firstImage : (firstImage as { url?: string } | undefined)?.url);
  const node: ShoppingCenter = {
    '@type': 'ShoppingCenter',
    name: String(mall.name),
    url: canonical,
    description: String(mall.description || `${mall.name} — stores on ${SITE_NAME}.`),
    ...(image ? { image } : {}),
    ...(mall.address
      ? {
          address: {
            '@type': 'PostalAddress',
            streetAddress: mall.address.line1,
            addressLocality: mall.address.city,
            addressRegion: mall.address.state,
            postalCode: mall.address.pincode,
            addressCountry: 'IN',
          } satisfies PostalAddress,
        }
      : {}),
  };
  const ratingValue = Number(mall.rating);
  const reviewCount = Number(mall.reviewCount);
  if (Number.isFinite(ratingValue) && ratingValue > 0 && Number.isFinite(reviewCount) && reviewCount > 0) {
    node.aggregateRating = { '@type': 'AggregateRating', ratingValue, reviewCount };
  }
  return node;
}

/** Local store entity for Buxar-area location pages. */
export function storeSchema(input: {
  name: string;
  canonical: string;
  description: string;
  image?: string;
  pins: string[];
}): ClothingStore {
  return {
    '@type': 'ClothingStore',
    name: `${SITE_NAME} — ${input.name}`,
    url: input.canonical,
    description: input.description,
    ...(input.image ? { image: input.image } : {}),
    priceRange: '₹₹',
    paymentAccepted: ['Cash', 'Credit Card', 'Debit Card', 'UPI'],
    currenciesAccepted: 'INR',
    address: {
      '@type': 'PostalAddress',
      addressLocality: input.name,
      addressRegion: 'Bihar',
      postalCode: input.pins[0] || '802101',
      addressCountry: 'IN',
    },
    areaServed: input.pins.join(', '),
  } as unknown as ClothingStore;
}
