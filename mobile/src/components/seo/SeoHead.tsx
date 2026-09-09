import React, { useEffect } from "react";
import Head from "expo-router/head";
import { Platform } from "react-native";
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

  useEffect(() => {
    if (Platform.OS !== "web") return;
    try {
      const head = document.head;
      if (!head) return;

      // Deduplicate meta tags by name/property
      const seen = new Set<string>();
      const metas = head.querySelectorAll("meta[name], meta[property]");
      metas.forEach((el) => {
        const key = el.getAttribute("name") || el.getAttribute("property");
        if (!key) return;
        const lowerKey = key.toLowerCase();
        // Keep only the last or first occurrence
        if (seen.has(lowerKey)) {
          el.remove();
        } else {
          seen.add(lowerKey);
        }
      });

      // Deduplicate canonical links
      const canonicals = head.querySelectorAll('link[rel="canonical"]');
      if (canonicals.length > 1) {
        for (let i = 1; i < canonicals.length; i++) {
          canonicals[i].remove();
        }
      }
    } catch {
      // safe fallback on unsupported environments
    }
  }, [meta]);

  return (
    <Head>
      <title>{meta.title}</title>
      <meta data-rh="true" name="title" content={meta.title} />
      <meta data-rh="true" name="description" content={meta.description} />
      <meta data-rh="true" name="robots" content={meta.robots} />
      <meta
        data-rh="true"
        name="keywords"
        content={
          meta.keywords ||
          "QuickBihar, online shopping Bihar, clothing store Patna, ethnic wear Bihar, sarees Bihar, local store delivery Bihar"
        }
      />
      <meta data-rh="true" name="author" content={meta.author || "QuickBihar"} />
      <meta data-rh="true" name="publisher" content={meta.publisher || "QuickBihar"} />
      <link data-rh="true" rel="canonical" href={meta.canonical} />
      <link data-rh="true" rel="publisher" href="https://quickbihar.in/" title="QuickBihar Official Website" />
      {/* Open Graph */}
      <meta data-rh="true" property="og:site_name" content={siteName} />
      <meta data-rh="true" property="og:locale" content="en_IN" />
      <meta data-rh="true" property="og:type" content={meta.type === "article" ? "article" : meta.type === "product" ? "product" : "website"} />
      <meta data-rh="true" property="og:title" content={meta.title} />
      <meta data-rh="true" property="og:description" content={meta.description} />
      <meta data-rh="true" property="og:url" content={meta.canonical} />
      {meta.image ? <meta data-rh="true" property="og:image" content={meta.image} /> : null}
      {/* Twitter */}
      <meta data-rh="true" name="twitter:card" content={meta.image ? "summary_large_image" : "summary"} />
      <meta data-rh="true" name="twitter:title" content={meta.title} />
      <meta data-rh="true" name="twitter:description" content={meta.description} />
      {meta.image ? <meta data-rh="true" name="twitter:image" content={meta.image} /> : null}
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
