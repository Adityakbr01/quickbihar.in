/**
 * @file src/seo/meta.ts
 * Page-meta builders for QuickBihar (pure TypeScript — no React, no DOM).
 *
 * Safe to import from client screens AND from the prerender entry.
 * Every builder derives title / description from REAL entity data and
 * enforces Google's display limits (title ~60, description ~155 chars).
 */

import { DEFAULT_OG_IMAGE, SITE_NAME, getCanonicalUrl } from './site';

/* ── text helpers ─────────────────────────────────────────────── */

function decodeEntities(value: string): string {
  return String(value || '')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;|&#x27;/gi, "'")
    .replace(/&nbsp;/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const TRAILING = `|–—-:;,/\\()[]{}'"“”‘’«».!?&+…‐-‒`;

function stripTrailing(value: string): string {
  let out = String(value || '').replace(/\s+/g, ' ').trim();
  let changed = true;
  while (changed && out.length > 0) {
    changed = false;
    const last = out.charAt(out.length - 1);
    if (last === ' ' || TRAILING.indexOf(last) !== -1) {
      out = out.slice(0, -1).trim();
      changed = true;
    }
  }
  return out;
}

export function truncateText(value: string | null | undefined, max: number): string {
  const text = decodeEntities(String(value || ''));
  if (!text || text.length <= max) return stripTrailing(text);
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  const out = lastSpace > max * 0.6 ? cut.slice(0, lastSpace).trim() : cut.trim();
  return stripTrailing(out);
}

export const seoTitle = (v: string | null | undefined) => truncateText(v, 60);
export const seoDescription = (v: string | null | undefined) => truncateText(v, 155);

/* ── core types ───────────────────────────────────────────────── */

export type Robots = 'index, follow' | 'noindex, nofollow';

export interface PageMeta {
  title: string;
  description: string;
  canonical: string;
  keywords?: string;
  image?: string;
  robots: Robots;
  type?: 'website' | 'product' | 'article';
}

export const robotsFor = (indexable: boolean): Robots =>
  indexable ? 'index, follow' : 'noindex, nofollow';

export const DEFAULT_KEYWORDS =
  'QuickBihar, online shopping Bihar, buy clothes Buxar, buy online Patna, local store delivery Bihar, same day delivery Bihar, cash on delivery Bihar';

/* ── indexability gates (entity must pass ALL checks) ─────────── */

interface IndexableProduct {
  slug?: string;
  title?: string;
  images?: Array<{ url?: string }>;
  shortDescription?: string;
  description?: string;
  isActive?: boolean;
  isDeleted?: boolean;
  approvalStatus?: string;
}

export function isIndexableProduct(p: IndexableProduct | null | undefined): boolean {
  if (!p || p.isActive === false || p.isDeleted) return false;
  if (p.approvalStatus && p.approvalStatus !== 'APPROVED') return false;
  if (!p.slug || !p.title) return false;
  if (!Array.isArray(p.images) || !p.images[0]?.url) return false;
  if (String(p.shortDescription || p.description || '').trim().length < 20) return false;
  return true;
}

interface IndexableCategory {
  slug?: string;
  title?: string;
  isActive?: boolean;
}

export function isIndexableCategory(
  c: IndexableCategory | null | undefined,
  productCount = 1,
): boolean {
  if (!c || c.isActive === false || !c.slug || !c.title) return false;
  return productCount >= 1;
}

interface IndexableMall {
  slug?: string;
  _id?: string;
  id?: string;
  name?: string;
  isActive?: boolean;
  status?: string;
}

export function isIndexableMall(m: IndexableMall | null | undefined): boolean {
  if (!m || m.isActive === false) return false;
  if (m.status && m.status !== 'APPROVED') return false;
  if (!m.slug && !(m as { _id?: string })._id && !(m as { id?: string }).id) return false;
  return Boolean(m.name);
}

/* ── page builders ────────────────────────────────────────────── */

export function homeMeta(): PageMeta {
  return {
    title: seoTitle('QuickBihar — Online Shopping in Bihar | Local Stores, Fast Delivery'),
    description: seoDescription(
      'Shop clothes, ethnic wear, groceries & more from verified local Bihar stores on QuickBihar. 60–120 min hyperlocal delivery in Buxar & Patna.',
    ),
    canonical: getCanonicalUrl('/clothing/home'),
    keywords: DEFAULT_KEYWORDS,
    image: DEFAULT_OG_IMAGE,
    robots: 'index, follow',
  };
}

export function searchMeta(hasQueryParams: boolean): PageMeta {
  return {
    title: seoTitle('Search Fashion Online in Bihar | QuickBihar'),
    description: seoDescription(
      'Search clothes, ethnic wear and accessories from local Bihar stores on QuickBihar.',
    ),
    canonical: getCanonicalUrl('/clothing/search'),
    keywords:
      'search clothing Bihar, search products QuickBihar, buy online Patna, buy online Buxar, ethnic wear Bihar',
    robots: robotsFor(!hasQueryParams),
  };
}

export function topSellingMeta(): PageMeta {
  return {
    title: seoTitle('Top Selling Products in Bihar | QuickBihar'),
    description: seoDescription(
      'Trending fashion & bestsellers from local Bihar stores. Shop top-rated products with fast doorstep delivery on QuickBihar.',
    ),
    canonical: getCanonicalUrl('/top-selling'),
    keywords: `top selling Bihar, trending fashion Bihar, bestsellers Patna, ${DEFAULT_KEYWORDS}`,
    image: DEFAULT_OG_IMAGE,
    robots: 'index, follow',
  };
}

export function mallsMeta(): PageMeta {
  return {
    title: seoTitle('Shopping Malls in Bihar | Stores, Offers & Reviews | QuickBihar'),
    description: seoDescription(
      'Explore top shopping malls in Bihar on QuickBihar — stores, collections, offers and reviews with fast hyperlocal delivery.',
    ),
    canonical: getCanonicalUrl('/malls'),
    keywords: `shopping malls Bihar, malls in Patna, malls in Buxar, stores in mall, ${DEFAULT_KEYWORDS}`,
    image: DEFAULT_OG_IMAGE,
    robots: 'index, follow',
  };
}

export function foodMeta(): PageMeta {
  return {
    title: seoTitle('Order Food Online in Bihar | QuickBihar Food'),
    description: seoDescription(
      'Order from local restaurants & kitchens in Bihar on QuickBihar Food. Hot, fast hyperlocal delivery to your doorstep.',
    ),
    canonical: getCanonicalUrl('/food'),
    keywords: 'order food Bihar, food delivery Buxar, food delivery Patna, QuickBihar Food',
    image: DEFAULT_OG_IMAGE,
    robots: 'index, follow',
  };
}

export function jeweleryMeta(): PageMeta {
  return {
    title: seoTitle('Buy Jewellery Online in Bihar | QuickBihar Jewellery'),
    description: seoDescription(
      'Shop BIS-hallmarked gold, diamond & fashion jewellery from trusted Bihar jewellers on QuickBihar. Certified, secure delivery.',
    ),
    canonical: getCanonicalUrl('/jewelery'),
    keywords: 'buy jewellery Bihar, gold jewellery Patna, jewellery Buxar, QuickBihar Jewellery',
    image: DEFAULT_OG_IMAGE,
    robots: 'index, follow',
  };
}

export function jeweleryCollectionsMeta(): PageMeta {
  return staticMeta({
    title: 'Jewellery Collections | QuickBihar Jewellery',
    description: 'Explore curated gold, diamond & festive jewellery collections from Bihar jewellers.',
    keywords: 'jewellery collections Bihar, gold collections Patna, bridal jewellery Bihar',
    path: '/jewelery/collections',
  });
}

export function jewelerySearchMeta(hasQueryParams: boolean): PageMeta {
  return staticMeta({
    title: 'Search Jewellery Online in Bihar | QuickBihar',
    description: 'Search gold, diamond & fashion jewellery from trusted Bihar jewellers on QuickBihar.',
    keywords: 'search jewellery Bihar, gold pendant Patna, jhumka Buxar, QuickBihar Jewellery',
    path: '/jewelery/search',
    indexable: !hasQueryParams,
  });
}

interface ProductLike extends IndexableProduct {
  price?: number;
  currency?: string;
  brand?: string;
  category?: string | { title?: string };
  subCategory?: string;
}

export function productMeta(product: ProductLike): PageMeta {
  const indexable = isIndexableProduct(product);
  const name = String(product?.title || 'Product').trim();
  const categoryName =
    typeof product?.category === 'string'
      ? product.category
      : String((product?.category as { title?: string } | undefined)?.title || product?.subCategory || '').trim();
  const needsCategory =
    Boolean(categoryName) && !name.toLowerCase().includes(categoryName.toLowerCase());
  const titleBase = needsCategory
    ? `${name} – ${categoryName} | QuickBihar Buxar`
    : `${name} | QuickBihar Buxar`;

  const priceNum = Number((product as { price?: unknown })?.price);
  const pricePart = Number.isFinite(priceNum) && priceNum > 0 ? ` at ₹${priceNum}` : '';
  const baseDesc =
    seoDescription(String(product?.shortDescription || product?.description || '')) ||
    seoDescription(`${name} available on QuickBihar. Shop from local Bihar stores.`);
  const promise = 'delivered in 60–120 min in Buxar';
  const description = /60[–-]120|same-day|doorstep delivery/i.test(baseDesc)
    ? baseDesc
    : seoDescription(`${name}${pricePart} — ${promise}. ${baseDesc}`);

  return {
    title: seoTitle(titleBase),
    description,
    canonical: getCanonicalUrl(`/product/${product?.slug || ''}`),
    keywords: [name, categoryName, (product as { brand?: string })?.brand, `buy ${name} online`, `${name} price in Bihar`, DEFAULT_KEYWORDS]
      .filter(Boolean)
      .join(', '),
    image: Array.isArray(product?.images) ? product.images[0]?.url : undefined,
    robots: robotsFor(indexable),
    type: 'product',
  };
}

interface CategoryLike extends IndexableCategory {
  description?: string;
  image?: string;
  banner?: string;
}

export function categoryMeta(category: CategoryLike, productCount = 1): PageMeta {
  const indexable = isIndexableCategory(category, productCount);
  const title = String(category?.title || 'Category').trim();
  return {
    title: seoTitle(`${title} | Shop Online in Bihar | QuickBihar`),
    description:
      seoDescription(String(category && (category as { description?: string }).description || '')) ||
      seoDescription(`Shop ${title} from local Bihar stores on QuickBihar. Fast doorstep delivery & easy returns.`),
    canonical: getCanonicalUrl(`/category/${category?.slug || ''}`),
    keywords: [title, `${title} Bihar`, `buy ${title} online`, `${title} Patna`, `${title} Buxar`, DEFAULT_KEYWORDS]
      .filter(Boolean)
      .join(', '),
    image: (category as { image?: string; banner?: string })?.image || (category as { banner?: string })?.banner || DEFAULT_OG_IMAGE,
    robots: robotsFor(indexable),
  };
}

interface MallLike extends IndexableMall {
  description?: string;
  coverImageUrl?: string;
  logoUrl?: string;
  images?: Array<{ url?: string } | string>;
  address?: { city?: string };
  location?: string;
}

function mallImage(mall: MallLike): string | undefined {
  if (mall?.coverImageUrl) return mall.coverImageUrl;
  if (mall?.logoUrl) return mall.logoUrl;
  const first = Array.isArray(mall?.images) ? mall.images[0] : undefined;
  if (typeof first === 'string') return first;
  return (first as { url?: string } | undefined)?.url;
}

export function mallMeta(mall: MallLike): PageMeta {
  const indexable = isIndexableMall(mall);
  const name = String(mall?.name || 'Mall').trim();
  const city = String(mall?.address?.city || mall?.location || '').trim();
  const place = city && !name.toLowerCase().includes(city.toLowerCase()) ? `${name}, ${city}` : name;
  return {
    title: seoTitle(`${place} | Stores, Offers & Reviews | QuickBihar`),
    description:
      seoDescription(String(mall?.description || '')) ||
      seoDescription(`${place} — stores, collections and reviews on QuickBihar.`),
    canonical: getCanonicalUrl(`/mall/${mall?.slug || (mall as { _id?: string })._id || (mall as { id?: string }).id || ''}`),
    keywords: [name, `${name} ${city || 'Bihar'}`, `shopping mall ${city || 'Bihar'}`, `stores in ${name}`, DEFAULT_KEYWORDS]
      .filter(Boolean)
      .join(', '),
    image: mallImage(mall),
    robots: robotsFor(indexable),
  };
}

export function staticMeta(input: {
  title: string;
  description: string;
  path: string;
  keywords?: string;
  image?: string;
  indexable?: boolean;
}): PageMeta {
  return {
    title: seoTitle(input.title),
    description: seoDescription(input.description),
    canonical: getCanonicalUrl(input.path),
    keywords: input.keywords || DEFAULT_KEYWORDS,
    image: input.image,
    robots: robotsFor(input.indexable !== false),
  };
}

/** Drop-in meta for auth / cart / checkout / account / order screens. */
export function noIndexMeta(path = '/'): PageMeta {
  return {
    title: SITE_NAME,
    description: `${SITE_NAME} — ${'shop from local Bihar stores.'}`,
    canonical: getCanonicalUrl(path),
    robots: 'noindex, nofollow',
  };
}

/** Buxar location hub/block meta — static data only, always indexable. */
export function locationMeta(input: {
  title: string;
  metaDescription: string;
  keywords: string[];
  path: string;
  image?: string;
}): PageMeta {
  return {
    title: seoTitle(input.title),
    description: seoDescription(input.metaDescription),
    canonical: getCanonicalUrl(input.path),
    keywords: input.keywords.join(', '),
    image: input.image || DEFAULT_OG_IMAGE,
    robots: 'index, follow',
  };
}
