/**
 * @file src/seo/site.ts
 * Single source of truth for QuickBihar site identity + URL helpers.
 *
 * Keep every hardcoded domain / brand string HERE so meta builders,
 * schemas and the prerender entry never drift apart.
 */

export const SITE_NAME = 'QuickBihar';
export const SITE_TAGLINE = 'Shop from local Bihar stores';
export const SITE_LOCALE = 'en_IN';
export const SITE_LANGUAGE = 'en';
export const SITE_REGION = 'IN-BR';

/** Canonical production origin. Same origin as the API in prod. */
export const SITE_ORIGIN = 'https://quickbihar.in';

export const SITE_LOGO = `${SITE_ORIGIN}/icon-512.png`;
export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/og-image.png`;

export const SITE_CONTACT_EMAIL = 'support@quickbihar.com';
export const SITE_CONTACT_PHONE = '+91 93049 22632';

/** Org / website node IDs used to link the JSON-LD graph together. */
export const ORG_ID = `${SITE_ORIGIN}/#organization`;
export const WEBSITE_ID = `${SITE_ORIGIN}/#website`;

/**
 * Resolve the public site base.
 *
 * ALWAYS the production apex — never a dev/LAN env URL. Canonical URLs
 * and JSON-LD @ids must be identical across prerender (build-time env)
 * and client (browser env, which often carries a LAN API origin).
 * Mixed origins produce duplicate/conflicting `url` fields that Google
 * flags in Rich Results. Dev API endpoints stay in vite.config `define`
 * where they belong — not in public SEO output.
 */
export function getSiteOrigin(): string {
  return SITE_ORIGIN;
}

/**
 * Absolute canonical URL for an internal path.
 * Always https apex, no trailing slash (except root), no query/hash.
 */
export function getCanonicalUrl(path: string): string {
  const base = getSiteOrigin().replace(/\/+$/, '');
  const raw = String(path || '/').split('?')[0].split('#')[0];
  const clean = `/${raw.replace(/^\/+/, '')}`;
  const noTrailing = clean.length > 1 ? clean.replace(/\/+$/, '') : clean;
  return `${base}${noTrailing}`;
}
