/**
 * @file src/seo/SeoHead.tsx
 * Client-side `<head>` manager for QuickBihar (react-helmet-async).
 *
 * Usage:
 *   <SeoHead meta={productMeta(product)} jsonLd={[productSchema(...)]} />
 *   <NoIndexHead />  // auth / cart / checkout / account / orders
 *
 * Deepest mounted <SeoHead> wins. Keep ONE per screen, above loading guards
 * when the meta can be computed from cached data.
 */

import { Helmet } from 'react-helmet-async';
import type { Thing } from 'schema-dts';
import { DEFAULT_KEYWORDS, type PageMeta } from './meta';
import { createCompositeGraph } from './schemas';
import { SITE_LOCALE, SITE_NAME, SITE_REGION, getSiteOrigin } from './site';

interface SeoHeadProps {
  meta: PageMeta;
  /** schema-dts nodes (nulls skipped). Rendered only on indexable pages. */
  jsonLd?: Array<Thing | null | undefined>;
}

export function SeoHead({ meta, jsonLd }: SeoHeadProps) {
  const nodes = (jsonLd || []).filter((n): n is Thing => Boolean(n));
  const showJsonLd = meta.robots.startsWith('index') && nodes.length > 0;
  const ogType = meta.type === 'product' ? 'product' : meta.type === 'article' ? 'article' : 'website';

  return (
    <Helmet>
      <title>{meta.title}</title>
      <meta data-rh="true" name="description" content={meta.description} />
      <meta data-rh="true" name="robots" content={meta.robots} />
      <meta data-rh="true" name="keywords" content={meta.keywords || DEFAULT_KEYWORDS} />
      <meta data-rh="true" name="geo.region" content={SITE_REGION} />
      <meta data-rh="true" name="geo.placename" content="Bihar, India" />
      <meta data-rh="true" name="author" content={SITE_NAME} />
      <link data-rh="true" rel="canonical" href={meta.canonical} />

      {/* Open Graph */}
      <meta data-rh="true" property="og:site_name" content={SITE_NAME} />
      <meta data-rh="true" property="og:locale" content={SITE_LOCALE} />
      <meta data-rh="true" property="og:type" content={ogType} />
      <meta data-rh="true" property="og:title" content={meta.title} />
      <meta data-rh="true" property="og:description" content={meta.description} />
      <meta data-rh="true" property="og:url" content={meta.canonical} />
      {meta.image ? <meta data-rh="true" property="og:image" content={meta.image} /> : null}

      {/* Twitter */}
      <meta data-rh="true" name="twitter:card" content={meta.image ? 'summary_large_image' : 'summary'} />
      <meta data-rh="true" name="twitter:title" content={meta.title} />
      <meta data-rh="true" name="twitter:description" content={meta.description} />
      {meta.image ? <meta data-rh="true" name="twitter:image" content={meta.image} /> : null}

      {/* Structured data — single composite graph, indexable pages only */}
      {showJsonLd ? (
        <script data-rh="true" id="qb-rich-results" type="application/ld+json">
          {JSON.stringify(createCompositeGraph(nodes))}
        </script>
      ) : null}
    </Helmet>
  );
}

/** Absolute site origin (handy for OG fallbacks). */
export function siteOrigin(): string {
  return getSiteOrigin();
}

/** Drop-in head for private / transactional screens. */
export function NoIndexHead({ path = '/' }: { path?: string }) {
  return (
    <SeoHead
      meta={{
        title: SITE_NAME,
        description: `${SITE_NAME} — shop from local Bihar stores.`,
        canonical: `${getSiteOrigin()}${path}`,
        robots: 'noindex, nofollow',
      }}
    />
  );
}

export default SeoHead;
