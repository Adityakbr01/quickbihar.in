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

export const SITE_LOGO = `${SITE_ORIGIN}/favicon.svg`;
export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/favicon.svg`;

export const SITE_CONTACT_EMAIL = 'support@quickbihar.com';
export const SITE_CONTACT_PHONE = '+91 93049 22632';

/** Org / website node IDs used to link the JSON-LD graph together. */
export const ORG_ID = `${SITE_ORIGIN}/#organization`;
export const WEBSITE_ID = `${SITE_ORIGIN}/#website`;

/** Resolve the public site base (env override → production fallback). */
export function getSiteOrigin(): string {
  try {
    const env =
      (typeof process !== 'undefined' ? (process.env as Record<string, string | undefined>) : {}) ?? {};
    const fromNode =
      env.VITE_SITE_ORIGIN || env.EXPO_PUBLIC_API_ORIGIN || env.VITE_API_ORIGIN;
    if (fromNode && fromNode.trim()) return fromNode.trim().replace(/\/+$/, '');
  } catch {
    /* non-node runtime — fall through */
  }
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
