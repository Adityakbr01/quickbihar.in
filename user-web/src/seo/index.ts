/**
 * @file src/seo/index.ts
 * Barrel — import SEO from ONE place.
 *
 *   import { SeoHead, homeMeta, productMeta } from '@/src/seo';
 */

export * from './site';
export * from './meta';
export * from './schemas';
export * from './routes';
export { SeoHead, NoIndexHead, siteOrigin } from './SeoHead';
export { SEO_CONFIG, usePageSeo, injectOrganizationSchema, type SeoKey } from './seo';
export { default as SeoRouter } from './SeoRouter';
