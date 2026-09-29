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
  CollectionPage,
  FAQPage,
  ItemList,
  JewelryStore,
  ListItem,
  Offer,
  Organization,
  PostalAddress,
  Product,
  Restaurant,
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

/** Top-level WebSite entity (home page only).
 *
 * NOTE: no SearchAction here — schema-dts v2 has no `query-input` property
 * on SearchAction, and Google requires it for the sitelinks searchbox.
 * Emitting a half-spec action would be worse than omitting it.
 */
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
  /** Local seller storefront name (from the product's embedded store/seller). */
  sellerName?: string;
}

/** Product rich result — emitted ONLY with real price + image (never fabricate). */
export function productSchema(product: ProductInput, canonical: string): Product | null {
  const images = (Array.isArray(product?.images) ? product.images : [])
    .map((img) => img?.url)
    .filter((url): url is string => Boolean(url));
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
    ...(product.sellerName
      ? { seller: { '@type': 'Organization', name: product.sellerName } }
      : {}),
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

/** Collection page (category / top-selling / collections) with an ItemList of up to 20 entries. */
export function collectionSchema(input: {
  name: string;
  description?: string;
  canonical: string;
  items: Array<{ name: string; url?: string; image?: string }>;
}): CollectionPage | null {
  if (!input.items.length) return null;
  const itemListElement: ListItem[] = input.items.slice(0, 20).map((item, i) => {
    const listItem: ListItem = {
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
    };
    if (item.url) listItem.url = item.url;
    if (item.image) listItem.image = item.image;
    return listItem;
  });
  const itemList: ItemList = {
    '@type': 'ItemList',
    numberOfItems: input.items.length,
    itemListElement,
  };
  const page: CollectionPage = {
    '@type': 'CollectionPage',
    name: input.name,
    ...(input.description ? { description: input.description } : {}),
    url: input.canonical,
    mainEntity: itemList,
  };
  return page;
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
  const firstUrl = typeof firstImage === 'string' ? firstImage : firstImage?.url;
  const image = mall.coverImageUrl || mall.logoUrl || firstUrl;
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
  };
}

/** Shared hub address (Buxar local hub — same business, all verticals). */
function hubAddress(): PostalAddress {
  return {
    '@type': 'PostalAddress',
    addressLocality: 'Buxar',
    addressRegion: 'Bihar',
    postalCode: '802101',
    addressCountry: 'IN',
  };
}

/** QuickBihar Jewellery storefront entity (BIS-hallmarked gold, live gold rate). */
export function jewelryStoreSchema(canonical: string): JewelryStore {
  return {
    '@type': 'JewelryStore',
    '@id': `${getSiteOrigin()}/jewelery#store`,
    name: `${SITE_NAME} Jewellery`,
    url: canonical,
    description: `${SITE_NAME} Jewellery — BIS-hallmarked gold, diamond & fashion jewellery from trusted Bihar jewellers. Certified, secure delivery.`,
    telephone: SITE_CONTACT_PHONE,
    email: SITE_CONTACT_EMAIL,
    priceRange: '₹₹₹',
    paymentAccepted: ['Cash', 'Credit Card', 'Debit Card', 'UPI'],
    currenciesAccepted: 'INR',
    address: hubAddress(),
  };
}

/** QuickBihar Food ordering entity (local restaurants, hyperlocal delivery). */
export function restaurantSchema(canonical: string): Restaurant {
  return {
    '@type': 'Restaurant',
    '@id': `${getSiteOrigin()}/food#restaurant`,
    name: `${SITE_NAME} Food`,
    url: canonical,
    description: `${SITE_NAME} Food — order from local restaurants & kitchens in Bihar. Hot, fast hyperlocal delivery to your doorstep.`,
    servesCuisine: ['Bihari', 'North Indian', 'Biryani', 'Chinese', 'Snacks'],
    priceRange: '₹',
    telephone: SITE_CONTACT_PHONE,
    address: hubAddress(),
  };
}

/** FAQ rich result — emitted ONLY with real, visible Q&A pairs (never fabricate). */
export function faqPageSchema(faqs: Array<{ question: string; answer: string }>): FAQPage | null {
  const usable = (faqs || [])
    .map((f) => ({ question: String(f?.question || '').trim(), answer: String(f?.answer || '').trim() }))
    .filter((f) => f.question.length > 0 && f.answer.length > 0);
  if (usable.length === 0) return null;
  return {
    '@type': 'FAQPage',
    mainEntity: usable.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}
