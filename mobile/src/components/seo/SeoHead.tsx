import React from "react";
import Head from "expo-router/head";
import { getSiteBase, type PageMeta } from "@/src/lib/seo";

interface SeoHeadProps {
  meta: PageMeta;
  /** One or more JSON-LD objects (nulls are skipped). Rendered only on indexable pages. */
  jsonLd?: Array<Record<string, any> | null | undefined>;
}

/**
 * Per-route SEO head tags for Expo Web (plan §15).
 *
 * Web: tags are managed by react-helmet-async and hoisted into the prerendered
 * HTML under `web.output: "static"`. Native: `Head` is a null render — no-op.
 * Must render ONLY on the focused route (handled internally by expo-router Head).
 */
export function SeoHead({ meta, jsonLd }: SeoHeadProps) {
  const siteName = "QuickBihar";
  const structured = (jsonLd || []).filter(Boolean) as Record<string, any>[];
  const showStructured = meta.robots.startsWith("index") && structured.length > 0;

  return (
    <Head>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <meta name="robots" content={meta.robots} />
      <link rel="canonical" href={meta.canonical} />
      {/* Open Graph */}
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="en_IN" />
      <meta property="og:type" content={meta.type === "article" ? "article" : meta.type === "product" ? "product" : "website"} />
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:url" content={meta.canonical} />
      {meta.image ? <meta property="og:image" content={meta.image} /> : null}
      {/* Twitter */}
      <meta name="twitter:card" content={meta.image ? "summary_large_image" : "summary"} />
      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.description} />
      {meta.image ? <meta name="twitter:image" content={meta.image} /> : null}
      {/* Structured data — indexable pages with real data only */}
      {showStructured
        ? structured.map((node, index) => (
            <script key={index} type="application/ld+json">
              {JSON.stringify(node)}
            </script>
          ))
        : null}
    </Head>
  );
}

/** Absolute OG fallback (site root) for pages without their own image. */
export function siteOgImage(): string {
  return `${getSiteBase()}/assets/images/icons/ios-icon-default.png`;
}

const NOINDEX_META: PageMeta = {
  title: "QuickBihar",
  description: "QuickBihar — shop from local Bihar stores.",
  canonical: "https://quickbihar.in/",
  robots: "noindex, nofollow",
};

/**
 * Drop-in `<NoIndexHead />` for authenticated/transactional/thin routes
 * (auth, account, cart, checkout, orders, tracking, rider, stubs, mocks).
 * Null-render on native; `noindex, nofollow` on web (plan §25).
 */
export function NoIndexHead() {
  return <SeoHead meta={NOINDEX_META} />;
}
