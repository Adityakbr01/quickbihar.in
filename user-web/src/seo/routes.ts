/**
 * @file src/seo/routes.ts
 * Route catalog for QuickBihar SEO + SSG.
 *
 * - STATIC_ROUTES: indexable static pages worth prerendering.
 * - NOINDEX_PREFIXES: transactional / private paths (never prerendered,
 *   always <NoIndexHead /> on the client).
 */

export interface StaticRoute {
  path: string;
  label: string;
}

/** Indexable static pages (crawlable, prerendered). */
export const STATIC_ROUTES: StaticRoute[] = [
  { path: '/', label: 'Home' },
  { path: '/clothing/home', label: 'Home' },
  { path: '/clothing/search', label: 'Search' },
  { path: '/top-selling', label: 'Top Selling' },
  { path: '/malls', label: 'Malls' },
  { path: '/food', label: 'Food' },
  { path: '/jewelery', label: 'Jewellery' },
  { path: '/jewelery/collections', label: 'Jewellery Collections' },
  { path: '/jewelery/search', label: 'Jewellery Search' },
  { path: '/locations/bihar/buxar', label: 'Buxar District Delivery Hub' },
  { path: '/locations/bihar/buxar/buxar-city', label: 'Buxar City Delivery' },
  { path: '/locations/bihar/buxar/dumraon', label: 'Dumraon Delivery' },
  { path: '/locations/bihar/buxar/chausa', label: 'Chausa Delivery' },
  { path: '/locations/bihar/buxar/itarhi', label: 'Itarhi Delivery' },
  { path: '/locations/bihar/buxar/rajpur', label: 'Rajpur Delivery' },
  { path: '/locations/bihar/buxar/nawanagar', label: 'Nawanagar Delivery' },
  { path: '/locations/bihar/buxar/brahampur', label: 'Brahampur Delivery' },
  { path: '/locations/bihar/buxar/simri', label: 'Simri Delivery' },
  { path: '/locations/bihar/buxar/chaugain', label: 'Chaugain Delivery' },
  { path: '/locations/bihar/buxar/kesath', label: 'Kesath Delivery' },
  { path: '/locations/bihar/buxar/chakki', label: 'Chakki Delivery' },
];

/** Client-only paths — no prerender, noindex. */
export const NOINDEX_PREFIXES = [
  '/auth',
  '/account',
  '/checkout',
  '/clothing/checkout',
  '/clothing/cart',
  '/clothing/account',
  '/clothing/rider',
  '/cart',
  '/order',
  '/rider',
  '/Onboarding',
  '/jewelry/cart',
  '/jewelry/checkout',
  '/jewelry/account',
  '/jewelry/profile',
  '/jewelry/addresses',
  '/jewelry/address-form',
  '/jewelery/cart',
  '/jewelery/checkout',
  '/jewelery/account',
  '/jewelery/profile',
  '/jewelery/addresses',
  '/jewelery/address-form',
  '/jewelery/orders',
  '/jewelery/order-detail',
  '/jewelery/order-success',
  '/jewelery/wishlist',
  '/jewelery/notifications',
  '/jewelery/auth',
  '/jewelery/try-on',
];

/** True when a path is a private/transactional screen. */
export function isNoIndexPath(pathname: string): boolean {
  const clean = `/${String(pathname || '').split('?')[0].split('#')[0].replace(/^\/+/, '')}`;
  return NOINDEX_PREFIXES.some((prefix) => clean === prefix || clean.startsWith(`${prefix}/`));
}
