/**
 * @file src/seo/prerender.tsx
 * SSG entry for QuickBihar — called by `vite-prerender-plugin` at build time.
 *
 * What it does per route:
 *  1. Loads static catalog data (products / malls JSON) via fs — NO live API,
 *     so builds never hang on sockets or keep-alive handles.
 *  2. Builds <head> (title, meta, canonical, OG/Twitter, ONE JSON-LD graph).
 *  3. Renders a lightweight crawlable HTML shell (real h1 + <a> links),
 *     visually hidden (display:none) so users only ever see the branded
 *     boot loader until React mounts. The client app re-renders with
 *     createRoot, so shell/client mismatch is fine.
 *  4. Returns `links` so the plugin discovers + prerenders every
 *     product / mall / static page automatically.
 */

import { renderToString } from 'react-dom/server';
/* NOTE: catalog JSON is statically imported (tiny files: ~6 KB total).
   Static imports work in BOTH the client bundle and the prerender worker,
   unlike `node:fs` which the plugin externalizes for browser compatibility. */
import type { Thing } from 'schema-dts';
import productsCatalog from '../data/products-static.json';
import mallsCatalog from '../data/malls-static.json';
import categoriesCatalog from '../data/categories-static.json';
import { SITE_LANGUAGE, SITE_NAME, getCanonicalUrl } from './site';
import {
  categoryMeta,
  foodMeta,
  homeMeta,
  jeweleryCollectionsMeta,
  jeweleryMeta,
  jewelerySearchMeta,
  locationMeta,
  mallMeta,
  mallsMeta,
  productMeta,
  searchMeta,
  staticMeta,
  topSellingMeta,
  type PageMeta,
} from './meta';
import {
  breadcrumbSchema,
  collectionSchema,
  createCompositeGraph,
  faqPageSchema,
  jewelryStoreSchema,
  mallSchema,
  organizationSchema,
  productSchema,
  restaurantSchema,
  storeSchema,
  webPageSchema,
  websiteSchema,
} from './schemas';
import { STATIC_ROUTES } from './routes';
import { FAQS } from '../features/Jewelery/data/faqs';
import { ALL_BUXAR_PAGES } from '../constants/locations/buxar';

const JEWEL_FAQS = FAQS.map((f) => ({ question: f.q, answer: f.a }));

/* ── static catalog (fs, cached) ───────────────────────────────── */

interface StaticProduct {
  _id?: string;
  slug: string;
  title: string;
  price?: number;
  shortDescription?: string;
  description?: string;
  brand?: string;
  category?: string;
  subCategory?: string;
  vertical?: string;
  images?: Array<{ url?: string }>;
  isActive?: boolean;
}

interface StaticCategory {
  slug: string;
  title: string;
  description?: string;
}

interface StaticMall {
  slug: string;
  name: string;
  description?: string;
  coverImageUrl?: string;
  logoUrl?: string;
  images?: Array<{ url?: string }>;
  address?: { line1?: string; city?: string; state?: string; pincode?: string };
  location?: string;
}

let productCache: StaticProduct[] | null = null;
let mallCache: StaticMall[] | null = null;
let categoryCache: StaticCategory[] | null = null;

/** Load static catalog (static JSON imports — no fs, works everywhere). */
function loadCatalog(): void {
  if (productCache && mallCache && categoryCache) return;
  try {
    productCache = Object.values(productsCatalog);
  } catch {
    productCache = [];
  }
  try {
    mallCache = Object.values(mallsCatalog);
  } catch {
    mallCache = [];
  }
  try {
    categoryCache = Object.values(categoriesCatalog);
  } catch {
    categoryCache = [];
  }
}

function allProducts(): StaticProduct[] {
  return productCache ?? [];
}

function allMalls(): StaticMall[] {
  return mallCache ?? [];
}

function allCategories(): StaticCategory[] {
  return categoryCache ?? [];
}

function titleizeSlug(slug: string): string {
  return decodeURIComponent(slug || '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ── head elements ─────────────────────────────────────────────── */

type HeadElement = { type: string; props: Record<string, string>; children?: string };

function buildHeadElements(meta: PageMeta, schemas: Thing[]): Set<HeadElement> {
  const rh = 'true';
  const elements: HeadElement[] = [
    { type: 'meta', props: { name: 'description', content: meta.description, 'data-rh': rh } },
    { type: 'meta', props: { name: 'robots', content: meta.robots, 'data-rh': rh } },
    ...(meta.keywords
      ? [{ type: 'meta', props: { name: 'keywords', content: meta.keywords, 'data-rh': rh } }]
      : []),
    { type: 'link', props: { rel: 'canonical', href: meta.canonical, 'data-rh': rh } },
    { type: 'meta', props: { property: 'og:type', content: meta.type === 'product' ? 'product' : 'website', 'data-rh': rh } },
    { type: 'meta', props: { property: 'og:site_name', content: SITE_NAME, 'data-rh': rh } },
    { type: 'meta', props: { property: 'og:title', content: meta.title, 'data-rh': rh } },
    { type: 'meta', props: { property: 'og:description', content: meta.description, 'data-rh': rh } },
    { type: 'meta', props: { property: 'og:url', content: meta.canonical, 'data-rh': rh } },
    ...(meta.image
      ? [{ type: 'meta', props: { property: 'og:image', content: meta.image, 'data-rh': rh } }]
      : []),
    { type: 'meta', props: { name: 'twitter:card', content: meta.image ? 'summary_large_image' : 'summary', 'data-rh': rh } },
    { type: 'meta', props: { name: 'twitter:title', content: meta.title, 'data-rh': rh } },
    { type: 'meta', props: { name: 'twitter:description', content: meta.description, 'data-rh': rh } },
  ];
  if (schemas.length > 0) {
    elements.push({
      type: 'script',
      props: { type: 'application/ld+json', id: 'qb-rich-results', 'data-rh': rh },
      children: JSON.stringify(createCompositeGraph(schemas)),
    });
  }
  return new Set(elements);
}

/* ── lightweight crawlable shell (no App providers — never hangs) ───────
 *
 * Visibility contract:
 * - `#qb-boot` is the ONLY visible thing before JS loads (single spinner).
 *   Its CSS lives once in index.html <head> (#qb-boot-css) — the plugin
 *   preserves template head, so every prerendered page already has it.
 * - `#qb-seo-shell` is `display:none` + aria-hidden: crawlers still parse the
 *   h1 + links + head meta/JSON-LD, but users never see the raw text dump.
 * - React createRoot replaces #root on commit, removing both.
 *   Shell/client mismatch is fine (no hydration — full client render).
 */
function BootLoader() {
  return (
    <div id="qb-boot" aria-hidden="true">
      <div className="qb-ring" />
    </div>
  );
}

/* ── lightweight crawlable shell (no App providers — never hangs) ─ */

function Shell({
  meta,
  heading,
  intro,
  links,
}: {
  meta: PageMeta;
  heading: string;
  intro: string;
  links: Array<{ href: string; label: string }>;
}) {
  return (
    <>
      <BootLoader />
      <div id="qb-seo-shell" style={{ display: 'none' }} aria-hidden="true">
      <main>
        <h1>{heading}</h1>
        <p>{intro}</p>
        <p>
          <a href="/clothing/home">Home</a> · <a href="/top-selling">Top Selling</a> ·{' '}
          <a href="/food">Food</a> · <a href="/jewelery">Jewellery</a>
        </p>
        {links.length > 0 ? (
          <ul>
            {links.slice(0, 40).map((l) => (
              <li key={l.href}>
                <a href={l.href}>{l.label}</a>
              </li>
            ))}
          </ul>
        ) : null}
        <p style={{ display: 'none' }}>{meta.description}</p>
      </main>
      </div>
    </>
  );
}

/* ── main entry ────────────────────────────────────────────────── */

export async function prerender(data: { url: string }) {
  const url = data.url || '/';
  const cleanPath = url.split('?')[0].split('#')[0].replace(/\/$/, '') || '/';

  loadCatalog();
  const products = allProducts();
  const malls = allMalls();
  const categories = allCategories();

  let meta: PageMeta = homeMeta();
  let schemas: Thing[] = [organizationSchema()];
  let heading = 'QuickBihar — Online Shopping in Bihar';
  let intro = meta.description;
  let shellLinks: Array<{ href: string; label: string }> = [];

  const productMatch = cleanPath.match(/^\/product\/([^/]+)$/);
  const mallMatch = cleanPath.match(/^\/mall\/([^/]+)$/);
  const categoryMatch = cleanPath.match(/^\/category\/([^/]+)$/);
  const jewelProductMatch = cleanPath.match(/^\/jewelery\/product\/([^/]+)$/);
  const locationHubMatch = cleanPath.match(/^\/locations\/bihar\/buxar\/?$/);
  const locationMatch = cleanPath.match(/^\/locations\/bihar\/buxar\/([^/]+)$/);

  const locationBySlug = (slug: string) =>
    ALL_BUXAR_PAGES.find((l) => l.slug === slug);

  if (jewelProductMatch) {
    const id = decodeURIComponent(jewelProductMatch[1]).trim();
    const product =
      products.find((p) => p._id === id) ||
      products.find((p) => p.slug === id);
    // Canonical jewellery PDPs only — clothing must not duplicate here.
    // products-static.json now carries `vertical`; older JSON falls back to
    // the Jewellery category label so rebuilds never 404 indexed PDPs.
    const isJewel =
      String(product?.vertical || '').toUpperCase() === 'JEWELERY' ||
      String(product?.category || '').toLowerCase().includes('jewel');
    if (product && isJewel && product.images?.[0]?.url && Number(product.price) > 0) {
      const slug = String(product.slug || id);
      meta = staticMeta({
        title: `${String(product.title)} | QuickBihar Jewellery`,
        description:
          String(product.shortDescription || product.description || '').slice(0, 150) ||
          `${String(product.title)} from trusted Bihar jewellers on QuickBihar. BIS-hallmarked, certified delivery.`,
        keywords: [
          String(product.title),
          String(product.category || ''),
          'buy jewellery Bihar',
          'QuickBihar Jewellery',
        ]
          .filter(Boolean)
          .join(', '),
        path: `/jewelery/product/${product._id || slug}`,
        image: product.images?.[0]?.url,
      });
      heading = String(product.title);
      intro = String(product.shortDescription || product.description || meta.description);
      schemas.push(
        webPageSchema(`/jewelery/product/${product._id || slug}`, meta.title, meta.description),
        breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Jewellery', path: '/jewelery' },
          { name: String(product.title) },
        ]),
      );
      const node = productSchema(product, meta.canonical);
      if (node) schemas.push(node);
      const faq = faqPageSchema(JEWEL_FAQS);
      if (faq) schemas.push(faq);
      const isJewelRow = (p: StaticProduct) =>
        String(p.vertical || '').toUpperCase() === 'JEWELERY' ||
        String(p.category || '').toLowerCase().includes('jewel');
      shellLinks = products
        .filter((p) => isJewelRow(p) && p.slug !== slug)
        .slice(0, 12)
        .map((p) => ({
          href: p._id ? `/jewelery/product/${p._id}` : `/product/${p.slug}`,
          label: String(p.title),
        }));
    } else {
      meta = { ...homeMeta(), robots: 'noindex, nofollow' };
    }
  } else if (locationHubMatch || locationMatch) {
    const slug = locationHubMatch ? 'buxar' : decodeURIComponent(locationMatch![1]).trim();
    const location = locationBySlug(slug);
    if (location) {
      const pagePath =
        location.slug === 'buxar'
          ? '/locations/bihar/buxar'
          : `/locations/bihar/buxar/${location.slug}`;
      meta = locationMeta({
        title: location.title,
        metaDescription: location.metaDescription,
        keywords: location.keywords,
        path: pagePath,
        image: location.image,
      });
      heading = `Online Fashion & Clothes Delivery in ${location.name}`;
      intro = location.metaDescription;
      schemas.push(
        storeSchema({
          name: location.name,
          canonical: meta.canonical,
          description: location.metaDescription,
          image: location.image,
          pins: location.pins,
        }),
        webPageSchema(
          pagePath,
          meta.title,
          meta.description,
        ),
        breadcrumbSchema(
          location.slug === 'buxar'
            ? [
                { name: 'Home', path: '/' },
                { name: 'Buxar', path: pagePath },
              ]
            : [
                { name: 'Home', path: '/' },
                { name: 'Buxar', path: '/locations/bihar/buxar' },
                { name: location.name },
              ],
        ),
      );
      const faq = faqPageSchema(
        location.faqs.map((f) => ({ question: f.question, answer: f.answer })),
      );
      if (faq) schemas.push(faq);
      shellLinks = [
        ...ALL_BUXAR_PAGES.filter((l) => l.slug !== location.slug).map((l) => ({
          href: l.slug === 'buxar' ? '/locations/bihar/buxar' : `/locations/bihar/buxar/${l.slug}`,
          label: l.name,
        })),
        ...products.slice(0, 12).map((p) => ({ href: `/product/${p.slug}`, label: String(p.title) })),
      ];
    } else {
      meta = { ...homeMeta(), robots: 'noindex, nofollow' };
    }
  } else if (productMatch) {
    const slug = decodeURIComponent(productMatch[1]).trim();
    const product = products.find((p) => p.slug === slug);
    if (product) {
      meta = productMeta(product);
      heading = String(product.title);
      intro = String(product.shortDescription || product.description || meta.description);
      schemas.push(
        webPageSchema(`/product/${slug}`, meta.title, meta.description),
        breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: String(product.category || 'Fashion'), path: '/clothing/home' },
          { name: String(product.title) },
        ]),
      );
      const node = productSchema(product, meta.canonical);
      if (node) schemas.push(node);
      shellLinks = products
        .filter((p) => p.slug !== slug)
        .slice(0, 12)
        .map((p) => ({ href: `/product/${p.slug}`, label: String(p.title) }));
    } else {
      meta = { ...homeMeta(), robots: 'noindex, nofollow' };
    }
  } else if (mallMatch) {
    const slug = decodeURIComponent(mallMatch[1]).trim();
    const mall = malls.find((m) => m.slug === slug);
    if (mall) {
      meta = mallMeta(mall);
      heading = String(mall.name);
      intro = String(mall.description || meta.description);
      schemas.push(
        webPageSchema(`/mall/${slug}`, meta.title, meta.description),
        breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Malls', path: '/clothing/home' },
          { name: String(mall.name) },
        ]),
      );
      const node = mallSchema(mall, meta.canonical);
      if (node) schemas.push(node);
      shellLinks = malls
        .filter((m) => m.slug !== slug)
        .map((m) => ({ href: `/mall/${m.slug}`, label: String(m.name) }));
    } else {
      meta = { ...homeMeta(), robots: 'noindex, nofollow' };
    }
  } else if (categoryMatch) {
    const slug = decodeURIComponent(categoryMatch[1]).trim().toLowerCase();
    const known = categories.find((c) => c.slug.toLowerCase() === slug);
    const title = String(known?.title || titleizeSlug(slug));
    const description = String(known?.description || '');
    meta = categoryMeta({ slug, title, isActive: true, description }, Math.max(products.length, 1));
    heading = `${title} | Shop Online in Bihar`;
    intro = meta.description;
    const items = products.slice(0, 20).map((p) => ({
      name: String(p.title),
      url: getCanonicalUrl(`/product/${p.slug}`),
      image: p.images?.[0]?.url,
    }));
    schemas.push(
      webPageSchema(`/category/${slug}`, meta.title, meta.description),
      breadcrumbSchema([{ name: 'Home', path: '/' }, { name: title }]),
    );
    const list = collectionSchema({ name: title, description: meta.description, canonical: meta.canonical, items });
    if (list) schemas.push(list);
    shellLinks = products.slice(0, 12).map((p) => ({ href: `/product/${p.slug}`, label: String(p.title) }));
  } else {
    // Static pages
    switch (cleanPath) {
      case '/':
      case '/clothing/home':
        meta = homeMeta();
        heading = 'QuickBihar — Online Shopping in Bihar';
        schemas.push(
          websiteSchema(),
          webPageSchema('/clothing/home', meta.title, meta.description),
          breadcrumbSchema([{ name: 'Home', path: '/' }]),
        );
        break;
      case '/clothing/search':
        meta = searchMeta(false);
        heading = 'Search Fashion Online in Bihar';
        schemas.push(webPageSchema('/clothing/search', meta.title, meta.description));
        break;
      case '/top-selling':
        meta = topSellingMeta();
        heading = 'Top Selling Products in Bihar';
        schemas.push(webPageSchema('/top-selling', meta.title, meta.description));
        break;
      case '/malls': {
        const mallsMetaData = mallsMeta();
        meta = mallsMetaData;
        heading = 'Shopping Malls in Bihar';
        const mallItems = malls.map((m) => ({
          name: String(m.name),
          url: getCanonicalUrl(`/mall/${m.slug}`),
        }));
        schemas.push(
          webPageSchema('/malls', meta.title, meta.description),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Malls', path: '/malls' },
          ]),
        );
        const mallList = collectionSchema({ name: heading, description: meta.description, canonical: meta.canonical, items: mallItems });
        if (mallList) schemas.push(mallList);
        break;
      }
      case '/food':
        meta = foodMeta();
        heading = 'Order Food Online in Bihar';
        schemas.push(
          restaurantSchema(meta.canonical),
          webPageSchema('/food', meta.title, meta.description),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Food', path: '/food' },
          ]),
        );
        break;
      case '/jewelery':
        meta = jeweleryMeta();
        heading = 'Buy Jewellery Online in Bihar';
        {
          const faq = faqPageSchema(JEWEL_FAQS);
          schemas.push(jewelryStoreSchema(meta.canonical));
          if (faq) schemas.push(faq);
          schemas.push(
            webPageSchema('/jewelery', meta.title, meta.description),
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Jewellery', path: '/jewelery' },
            ]),
          );
        }
        break;
      case '/jewelery/collections': {
        const collMeta = jeweleryCollectionsMeta();
        meta = collMeta;
        heading = 'Jewellery Collections';
        const faq = faqPageSchema(JEWEL_FAQS);
        if (faq) schemas.push(faq);
        schemas.push(
          webPageSchema('/jewelery/collections', meta.title, meta.description),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Jewellery', path: '/jewelery' },
            { name: 'Collections' },
          ]),
        );
        break;
      }
      case '/jewelery/search': {
        const sMeta = jewelerySearchMeta(false);
        meta = sMeta;
        heading = 'Search Jewellery Online in Bihar';
        schemas.push(webPageSchema('/jewelery/search', meta.title, meta.description));
        break;
      }
      default:
        meta = staticMeta({ title: meta.title, description: meta.description, path: cleanPath });
        heading = meta.title;
        schemas.push(webPageSchema(cleanPath, meta.title, meta.description));
        break;
    }
    intro = meta.description;
    shellLinks = [
      ...products.slice(0, 20).map((p) => ({ href: `/product/${p.slug}`, label: String(p.title) })),
      ...malls.map((m) => ({ href: `/mall/${m.slug}`, label: String(m.name) })),
      ...categories.slice(0, 12).map((c) => ({ href: `/category/${c.slug}`, label: String(c.title) })),
      ...ALL_BUXAR_PAGES.slice(0, 12).map((l) => ({
        href: l.slug === 'buxar' ? '/locations/bihar/buxar' : `/locations/bihar/buxar/${l.slug}`,
        label: l.name,
      })),
    ];
    // Collection graph on listing pages (top-selling / home)
    if (cleanPath === '/top-selling' || cleanPath === '/' || cleanPath === '/clothing/home') {
      const items = products.slice(0, 20).map((p) => ({
        name: String(p.title),
        url: getCanonicalUrl(`/product/${p.slug}`),
        image: p.images?.[0]?.url,
      }));
      const list = collectionSchema({ name: heading, description: meta.description, canonical: meta.canonical, items });
      if (list) schemas.push(list);
    }
  }

  let html = '';
  try {
    html = renderToString(<Shell meta={meta} heading={heading} intro={intro} links={shellLinks} />);
  } catch (err) {
    console.warn(`[SSG] render failed for ${url}:`, err instanceof Error ? err.message : err);
  }

  const links = new Set<string>([
    ...STATIC_ROUTES.map((r) => r.path),
    ...products.map((p) => `/product/${p.slug}`),
    ...products
      .filter(
        (p) =>
          String(p.vertical || '').toUpperCase() === 'JEWELERY' ||
          String(p.category || '').toLowerCase().includes('jewel'),
      )
      .filter((p) => p._id)
      .map((p) => `/jewelery/product/${p._id}`),
    ...malls.map((m) => `/mall/${m.slug}`),
    ...categories.map((c) => `/category/${c.slug}`),
    ...ALL_BUXAR_PAGES.map((l) =>
      l.slug === 'buxar' ? '/locations/bihar/buxar' : `/locations/bihar/buxar/${l.slug}`,
    ),
  ]);

  return {
    html,
    head: {
      lang: SITE_LANGUAGE,
      title: meta.title,
      elements: buildHeadElements(meta, schemas),
    },
    links,
    data: { url },
  };
}
