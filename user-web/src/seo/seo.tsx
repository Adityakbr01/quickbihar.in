/**
 * @file src/seo/seo.tsx
 * Client-side on-page SEO manager and React head updater for VV Studio.
 *
 * Provides:
 * - `SEO_CONFIG` — Central route metadata catalog (title, description, keywords, path).
 * - `useSEO(key)` — React hook called by page components to sync head metadata with route state.
 * - `<SeoHost />` — Head synchronization host component mounted once inside `<HelmetProvider>`.
 * - `injectLocalBusinessSchema()` — Idempotent client-side JSON-LD fallback for direct SPA visits.
 */

import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  SITE_NAME,
  SITE_ORIGIN,
  getCanonicalUrl,
  organizationSchema,
  createCompositeGraph,
} from './schemas';

export { SITE_NAME, SITE_ORIGIN, getCanonicalUrl };

/** Server base URL for web images. */
export const IMAGE_BASE_URL = 'https://agsdemo.in/vvsapi/public/assets/images/web_images';

/** Public images prefix / server base URL (mirrors the preloads in `index.html`). */
export const LOCAL_IMAGE_BASE = IMAGE_BASE_URL;

/**
 * Route metadata configuration specification.
 */
export interface SeoRouteConfig {
  title: string;
  description: string;
  keywords: string;
  path: string;
}

/**
 * Single source of truth for static page SEO metadata.
 *
 * Each entry specifies the exact title tag, meta description, targeted keywords,
 * and canonical route path for that section of the website.
 */
export const SEO_CONFIG = {
  home: {
    title: 'VV Studio | Luxury Salon & Spa in JP Nagar, Bangalore',
    description:
      "VV Studio is Bangalore's premier luxury beauty salon offering personalized skin treatments, expert hair care, bridal makeup, and rejuvenating spa therapies.",
    keywords:
      'luxury salon in JP Nagar, salon in JP Nagar Bangalore, spa in JP Nagar, beauty salon Bangalore, bridal makeup Bangalore, hair salon JP Nagar',
    path: '/',
  },
  about: {
    title: 'About VV Studio Luxury Salon & Spa',
    description:
      'Discover the story behind VV Studio — JP Nagar’s luxury salon & spa for skin, hair, bridal and wellness, crafted around you.',
    keywords: 'about VV Studio, luxury salon JP Nagar, beauty studio Bangalore',
    path: '/about',
  },
  services: {
    title: 'VV Studio Beauty & Spa Services',
    description:
      'Explore skin & facials, hair care, waxing & threading, bridal makeup, hand & feet care and spa rituals at VV Studio, JP Nagar Bangalore.',
    keywords: 'salon services JP Nagar, facials Bangalore, hair spa, bridal makeup, manicure pedicure',
    path: '/services',
  },
  gallery: {
    title: 'VV Studio Salon & Beauty Gallery',
    description:
      'Browse real bridal, hair, skin and nail transformations at VV Studio luxury salon & spa, JP Nagar Bangalore.',
    keywords: 'salon gallery, bridal looks, hair transformations, VV Studio work',
    path: '/gallery',
  },
  blog: {
    title: 'VV Studio Beauty & Wellness Blog',
    description:
      'Beauty tips, trends & wellness stories from VV Studio experts — skincare, haircare, bridal beauty and self-care rituals.',
    keywords: 'beauty blog, skincare tips, haircare guides, bridal beauty, VV Studio journal',
    path: '/blog',
  },
  contact: {
    title: 'VV Studio Contact Information',
    description:
      'Visit VV Studio at JP Nagar, Bangalore or call 080-48531999. Open Tue–Sun, 10 AM–8 PM for salon, spa & bridal bookings.',
    keywords: 'VV Studio contact, salon JP Nagar address, book appointment, spa booking Bangalore',
    path: '/contact',
  },
} satisfies Record<string, SeoRouteConfig>;

export type SeoKey = keyof typeof SEO_CONFIG;

interface HeadState {
  title: string;
  description: string;
  keywords: string;
  canonical: string;
}

/**
 * Resolves full HeadState values for a given route key.
 *
 * @summary Route head state resolver.
 * @param key - The route key registered in `SEO_CONFIG`.
 * @returns Complete HeadState with fully qualified canonical URL.
 *
 * @why Centralizes canonical path calculation and metadata retrieval.
 * @when Called whenever a page route changes or mounts.
 */
function headOf(key: SeoKey): HeadState {
  const cfg = SEO_CONFIG[key];
  return {
    title: cfg.title,
    description: cfg.description,
    keywords: cfg.keywords,
    canonical: getCanonicalUrl(cfg.path),
  };
}

let currentHead: HeadState = headOf('home');
const headListeners = new Set<(head: HeadState) => void>();

/**
 * React hook that binds the active route's SEO metadata to the document head.
 *
 * @summary React hook for page-level SEO synchronization.
 * @param seoKey - Key identifying the current route in `SEO_CONFIG`.
 *
 * @why When users navigate client-side in a Single Page Application, the document `<title>`,
 *      canonical tag, and `<meta name="description">` must dynamically update to match the route.
 * @when Invoked at the top of each page component (`HomePage`, `AboutPage`, `ServicesPage`, etc.).
 */
export function useSEO(seoKey: SeoKey): void {
  useEffect(() => {
    currentHead = headOf(seoKey);
    headListeners.forEach((listener) => listener(currentHead));
  }, [seoKey]);
}

/**
 * Host component mounted near the React root (inside `<HelmetProvider>`).
 *
 * Subscribes to route metadata changes and passes them to `<Helmet>` so that
 * `react-helmet-async` can reconcile the client head tags with the prerendered HTML.
 *
 * @summary Root head tag synchronization component.
 * @returns React element rendering `<Helmet>` tags.
 *
 * @why Prevents duplicate or conflicting meta tags during SPA client routing.
 * @when Mounted permanently in the root application layout.
 */
export const SeoHost: React.FC = () => {
  const [head, setHead] = useState<HeadState>(currentHead);

  useEffect(() => {
    headListeners.add(setHead);
    return () => {
      headListeners.delete(setHead);
    };
  }, []);

  return (
    <Helmet>
      <title>{head.title}</title>
      <meta name="description" content={head.description} />
      <meta name="keywords" content={head.keywords} />
      <link rel="canonical" href={head.canonical} />
      <meta name="robots" content="index, follow" />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={head.title} />
      <meta property="og:description" content={head.description} />
      <meta property="og:url" content={head.canonical} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={head.title} />
      <meta name="twitter:description" content={head.description} />
    </Helmet>
  );
};

/**
 * Injects the baseline `BeautySalon` JSON-LD schema into the document `<head>`.
 *
 * Safe and idempotent: will strictly do nothing if running on the server or if the
 * prerendered `#vv-rich-results` script tag is already present in the HTML DOM.
 *
 * @summary Fallback JSON-LD injector for client-only execution.
 *
 * @why Guarantees that even if prerendering was bypassed or pages were loaded in dynamic dev mode,
 *      valid structured data is still present for browser extensions and test tools.
 * @when Executed in `main.tsx` during initial client-side bootstrap.
 */
export function injectLocalBusinessSchema(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById('vv-rich-results')) return;
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = 'vv-rich-results';
  script.text = JSON.stringify(createCompositeGraph([organizationSchema()]));
  document.head.appendChild(script);
}
