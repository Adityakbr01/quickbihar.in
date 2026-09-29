/**
 * @file src/seo/seo.tsx
 * Client-side facade for QuickBihar SEO.
 *
 * This is the ONLY import screens need:
 *   import { SeoHead, NoIndexHead, SEO_CONFIG, usePageSeo } from '@/src/seo/seo';
 *
 * - SEO_CONFIG: static page catalog (title/desc/keywords/path).
 * - usePageSeo(key): tiny hook that documents which static config a screen uses
 *   (head itself is rendered by <SeoHead>, no global listeners).
 * - injectOrganizationSchema(): idempotent JSON-LD fallback for direct SPA visits
 *   when the prerendered script tag is missing (dev mode / client nav).
 */

import { foodMeta, homeMeta, jeweleryMeta, searchMeta, staticMeta, topSellingMeta } from './meta';
import { SITE_NAME, SITE_ORIGIN, getCanonicalUrl, getSiteOrigin } from './site';
import { createCompositeGraph, organizationSchema } from './schemas';

export { SITE_NAME, SITE_ORIGIN, getCanonicalUrl, getSiteOrigin };
export { SeoHead, NoIndexHead } from './SeoHead';
export * from './site';
export * from './meta';
export * from './schemas';
export * from './routes';

/** Static page catalog — one entry per indexable static route. */
export const SEO_CONFIG = {
  home: {
    title: 'QuickBihar — Online Shopping in Bihar | Local Stores, Fast Delivery',
    description:
      'Shop clothes, ethnic wear, groceries & more from verified local Bihar stores on QuickBihar. 60–120 min hyperlocal delivery in Buxar & Patna.',
    keywords:
      'QuickBihar, online shopping Bihar, buy clothes Buxar, buy online Patna, local store delivery Bihar',
    path: '/clothing/home',
    build: homeMeta,
  },
  search: {
    title: 'Search Fashion Online in Bihar | QuickBihar',
    description: 'Search clothes, ethnic wear and accessories from local Bihar stores on QuickBihar.',
    keywords: 'search clothing Bihar, search products QuickBihar, buy online Patna, buy online Buxar',
    path: '/clothing/search',
    build: () => searchMeta(false),
  },
  topSelling: {
    title: 'Top Selling Products in Bihar | QuickBihar',
    description:
      'Trending fashion & bestsellers from local Bihar stores. Shop top-rated products with fast doorstep delivery.',
    keywords: 'top selling Bihar, trending fashion Bihar, bestsellers Patna, QuickBihar',
    path: '/top-selling',
    build: topSellingMeta,
  },
  food: {
    title: 'Order Food Online in Bihar | QuickBihar Food',
    description: 'Order from local restaurants & kitchens in Bihar. Hot, fast hyperlocal delivery.',
    keywords: 'order food Bihar, food delivery Buxar, food delivery Patna, QuickBihar Food',
    path: '/food',
    build: foodMeta,
  },
  jewelery: {
    title: 'Buy Jewellery Online in Bihar | QuickBihar Jewellery',
    description:
      'Shop BIS-hallmarked gold, diamond & fashion jewellery from trusted Bihar jewellers. Certified, secure delivery.',
    keywords: 'buy jewellery Bihar, gold jewellery Patna, jewellery Buxar, QuickBihar Jewellery',
    path: '/jewelery',
    build: jeweleryMeta,
  },
  jeweleryCollections: {
    title: 'Jewellery Collections | QuickBihar Jewellery',
    description: 'Explore curated gold, diamond & festive jewellery collections from Bihar jewellers.',
    keywords: 'jewellery collections Bihar, gold collections Patna, bridal jewellery Bihar',
    path: '/jewelery/collections',
    build: () =>
      staticMeta({
        title: 'Jewellery Collections | QuickBihar Jewellery',
        description: 'Explore curated gold, diamond & festive jewellery collections from Bihar jewellers.',
        path: '/jewelery/collections',
      }),
  },
} as const;

export type SeoKey = keyof typeof SEO_CONFIG;

/**
 * Documents which static SEO config a screen uses.
 * Head rendering stays in <SeoHead> — this hook is only for readability
 * and future analytics (no side effects, no listeners).
 */
export function usePageSeo(_key: SeoKey): void {
  return undefined;
}

/**
 * Idempotent Organization JSON-LD fallback for client-only visits.
 * Does nothing when the prerendered #qb-rich-results tag already exists.
 */
export function injectOrganizationSchema(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById('qb-rich-results')) return;
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = 'qb-rich-results';
  script.text = JSON.stringify(createCompositeGraph([organizationSchema()]));
  document.head.appendChild(script);
}
