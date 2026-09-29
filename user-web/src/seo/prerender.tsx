/**
 * @file src/prerender.tsx
 * Static Site Generation (SSG) prerender entry point for Vite.
 *
 * Invoked by `vite-prerender-plugin` at build time to produce static HTML pages.
 * Reuses existing SEO definitions from `src/seo/schemas.ts` and `src/seo/seo.tsx` without
 * adding any external files or extra dependencies.
 *
 * Workflow for each route:
 * 1. Prefetches live API data (blogs, FAQs, testimonials) into an in-memory cache.
 * 2. Seeds a scoped `QueryClient` so components render full HTML (never skeletons).
 * 3. Renders the React component tree via `StaticRouter` + `renderToString`.
 * 4. Assembles typed JSON-LD schemas and meta tags for Google Rich Results.
 * 5. Embeds dehydrated query state (`#vv-query-state`) for seamless client hydration.
 * 6. Discovers all live blog links to crawl the entire site dynamically.
 */

import { renderToString } from 'react-dom/server';
import { QueryClient, dehydrate } from '@tanstack/react-query';
import { StaticRouter } from 'react-router';
import { Routes, Route } from 'react-router-dom';

import { HomePage } from './modules/home/pages/HomePage';
import { AboutPage } from './modules/about/pages/AboutPage';
import { ServicesPage } from './modules/services/pages/ServicesPage';
import { GalleryPage } from './modules/gallery/pages/GalleryPage';
import { BlogPage } from './modules/blog/pages/BlogPage';
import { BlogDetailPage } from './modules/blog/pages/BlogDetailPage';
import { ContactPage } from './modules/contact/pages/ContactPage';

import {
  blogImageOf,
  getBlogBySlug,
  getBlogs,
  getFeaturedBlogs,
  getFrontBlogs,
} from './modules/blog/api/blogApi';
import { blogKeys } from './modules/blog/hooks/useBlogs';
import { getFaqBySlug } from './modules/faq/api/faq.api';
import { faqKeys } from './modules/faq/hooks/useFaqQuery';
import { getTestimonials } from './modules/home/api/testimonialApi';
import { testimonialKeys } from './modules/home/hooks/useTestimonials';

import { SEO_CONFIG, getCanonicalUrl, SITE_NAME, type SeoKey } from './seo/seo';
import {
  blogPostingSchema,
  breadcrumbSchema,
  createCompositeGraph,
  faqPageSchema,
  itemListSchema,
  organizationSchema,
  reviewSchema,
  webPageSchema,
  websiteSchema,
} from './seo/schemas';
import type { BlogPost, ImageUrlEntry, Testimonial } from './lib/api/types';
import type { Thing } from 'schema-dts';

/* ------------------------------------------------------------------ */
/* In-Memory Fetch Cache & Query Helpers                              */
/* ------------------------------------------------------------------ */

const dataCache = new Map<string, unknown>();

/**
 * Caches asynchronous fetch responses in memory using serialized query keys.
 *
 * @summary In-memory query cache for SSG prerendering.
 * @param key - TanStack query key identifying the query.
 * @param fn - Async fetcher function returning data.
 * @returns Cached or newly fetched data, or null on error.
 *
 * @why Prerendering multiple routes sequentially shares the same blog and FAQ data.
 *      In-memory caching prevents redundant API calls and speeds up builds.
 * @when Called during route prefetching inside `prerender()`.
 */
async function cached<T>(key: readonly unknown[], fn: () => Promise<T>): Promise<T | null> {
  const cacheKey = JSON.stringify(key);
  if (dataCache.has(cacheKey)) return (dataCache.get(cacheKey) ?? null) as T | null;
  try {
    const data = await fn();
    dataCache.set(cacheKey, data);
    return data;
  } catch {
    dataCache.set(cacheKey, null);
    return null;
  }
}

/**
 * Seeds a QueryClient instance with pre-fetched data.
 *
 * @summary QueryClient cache seeder.
 * @param client - The scoped QueryClient instance.
 * @param key - The cache key.
 * @param data - The data payload to populate.
 *
 * @why Allows React components using `useQuery` to read data synchronously during SSR,
 *      ensuring complete HTML content is rendered rather than loading skeletons.
 * @when Called immediately before `renderToString`.
 */
function seed<T>(client: QueryClient, key: readonly unknown[], data: T | null): void {
  if (data !== null && data !== undefined) {
    client.setQueryData(key, data);
  }
}

/**
 * Strips HTML tags and trims excess whitespace from a raw string.
 *
 * @summary HTML tag remover for plain text schemas.
 * @param value - Raw string potentially containing HTML tags.
 * @returns Clean, plain text string.
 *
 * @why Meta descriptions and schema attributes must be clean text without raw tags.
 * @when Called when parsing descriptions, quotes, and answers from API payloads.
 */
function stripHtml(value: unknown): string {
  return typeof value === 'string' ? value.replace(/<[^>]+>/g, '').trim() : '';
}

/**
 * Normalizes blog post slug strings.
 *
 * @summary Slug extractor for blog posts.
 * @param post - Blog post item.
 * @returns Clean slug string or empty string.
 *
 * @why Handles variation between `blog_slug` and `slug` property names in backend payloads.
 * @when Called during link extraction and blog detail routing.
 */
function blogSlugOf(post: BlogPost): string {
  if (typeof post.blog_slug === 'string' && post.blog_slug.trim()) return post.blog_slug.trim();
  if (typeof post.slug === 'string' && post.slug.trim()) return post.slug.trim();
  return '';
}

/**
 * Normalizes and filters customer testimonials for Schema.org Review generation.
 *
 * @summary Testimonial review parser.
 * @param rows - Raw testimonial items from API.
 * @returns Clean reviews list and optional aggregate rating object.
 *
 * @why Filters out empty reviews and calculates aggregate ratings for Google Search star snippets.
 * @when Called for static pages that display customer reviews (e.g. Home, About).
 */
function parseReviews(rows: Testimonial[]) {
  const list = (rows ?? [])
    .map((t) => ({
      name: String(t.testimonial_client_name ?? t.name ?? '').trim(),
      body: stripHtml(t.testimonial_description ?? t.quote),
      rating: Math.min(5, Math.max(1, Math.round(Number(t.testimonial_rating ?? t.rating ?? 5)))),
      date: t.testimonial_created_date ?? null,
    }))
    .filter((r) => r.name.length > 0 && r.body.length > 0);

  const avg = list.length
    ? Math.round((list.reduce((sum, r) => sum + r.rating, 0) / list.length) * 10) / 10
    : 0;

  return {
    list,
    aggregate: list.length ? { ratingValue: avg, reviewCount: list.length } : undefined,
  };
}

/* ------------------------------------------------------------------ */
/* Static Route Map                                                   */
/* ------------------------------------------------------------------ */

interface StaticRouteDef {
  path: string;
  key: SeoKey;
  label: string;
  faqSlug: string;
  testiSlug: string;
}

const STATIC_ROUTES: StaticRouteDef[] = [
  { path: '/', key: 'home', label: 'Home', faqSlug: 'home', testiSlug: 'home' },
  { path: '/about', key: 'about', label: 'About', faqSlug: 'about-us', testiSlug: 'about-us' },
  { path: '/services', key: 'services', label: 'Services', faqSlug: 'services', testiSlug: 'services' },
  { path: '/gallery', key: 'gallery', label: 'Gallery', faqSlug: 'gallery', testiSlug: 'gallery' },
  { path: '/blog', key: 'blog', label: 'Blog', faqSlug: 'blogs', testiSlug: 'blogs' },
  { path: '/contact', key: 'contact', label: 'Contact', faqSlug: 'contact', testiSlug: 'contact' },
];

/* ------------------------------------------------------------------ */
/* Head Tags Generator                                                */
/* ------------------------------------------------------------------ */

/**
 * Builds the complete set of HTML `<head>` tags for a prerendered page.
 *
 * @summary Head elements builder for SSG.
 * @param title - Page title.
 * @param desc - Meta description.
 * @param kw - Meta keywords.
 * @param canonical - Full canonical URL.
 * @param schemas - Array of Schema.org `Thing` nodes.
 * @param queryState - Dehydrated TanStack Query state JSON string, or null.
 * @returns Set of head tag descriptors for injection into the document head.
 *
 * @why Gives crawlers immediate meta tags, social preview cards, and JSON-LD schemas
 *      without requiring client-side JavaScript execution.
 * @when Called for every prerendered route.
 */
function buildHeadElements(
  title: string,
  desc: string,
  kw: string,
  canonical: string,
  schemas: Thing[],
  queryState: string | null,
) {
  const rh = 'true';
  type HeadElement = { type: string; props: Record<string, string>; children?: string };
  const elements: HeadElement[] = [
    { type: 'meta', props: { name: 'description', content: desc, 'data-rh': rh } },
    { type: 'meta', props: { name: 'keywords', content: kw, 'data-rh': rh } },
    { type: 'meta', props: { name: 'robots', content: 'index, follow', 'data-rh': rh } },
    { type: 'meta', props: { name: 'author', content: SITE_NAME, 'data-rh': rh } },
    { type: 'link', props: { rel: 'canonical', href: canonical, 'data-rh': rh } },
    { type: 'meta', props: { property: 'og:type', content: 'website', 'data-rh': rh } },
    { type: 'meta', props: { property: 'og:site_name', content: SITE_NAME, 'data-rh': rh } },
    { type: 'meta', props: { property: 'og:title', content: title, 'data-rh': rh } },
    { type: 'meta', props: { property: 'og:description', content: desc, 'data-rh': rh } },
    { type: 'meta', props: { property: 'og:url', content: canonical, 'data-rh': rh } },
    { type: 'meta', props: { name: 'twitter:card', content: 'summary_large_image', 'data-rh': rh } },
    { type: 'meta', props: { name: 'twitter:title', content: title, 'data-rh': rh } },
    { type: 'meta', props: { name: 'twitter:description', content: desc, 'data-rh': rh } },
  ];

  if (queryState) {
    elements.push({
      type: 'script',
      props: { id: 'vv-query-state', type: 'application/json', 'data-rh': rh },
      children: queryState,
    });
  }

  if (schemas.length > 0) {
    elements.push({
      type: 'script',
      props: { type: 'application/ld+json', id: 'vv-rich-results', 'data-rh': rh },
      children: JSON.stringify(createCompositeGraph(schemas)),
    });
  }

  return new Set(elements);
}

/**
 * Server-renders the React application markup for a specific route.
 *
 * @summary Static HTML renderer.
 * @param url - Route URL to render.
 * @returns HTML markup string.
 *
 * @why Renders the visual page shell for crawlers and initial user display.
 * @when Called for each route during the build pass.
 */
function renderRouteHtml(url: string): string {
  try {
    return renderToString(
      <StaticRouter location={url}>
        <Routes>
          <Route path="/" element={<HomePage seoKey="home" />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogDetailPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="*" element={<HomePage seoKey="home" />} />
        </Routes>
      </StaticRouter>,
    );
  } catch (err) {
    console.warn(`⚠️ [SSG] render failed for ${url}:`, (err as Error)?.message ?? err);
    return '';
  }
}

/* ------------------------------------------------------------------ */
/* Main Prerender Entry Point                                         */
/* ------------------------------------------------------------------ */

/**
 * Vite prerender plugin entry point.
 *
 * @summary Core SSG route renderer called by `vite-prerender-plugin`.
 * @param data - Target URL object `{ url: string }`.
 * @returns Prerender payload with HTML body, head tags, links, and route data.
 *
 * @why Generates complete static HTML with zero layout shift, rich SEO metadata, and
 *      hydratable query state for every route on the website.
 * @when Invoked by Vite for each discovered route during `vite build`.
 */
export async function prerender(data: { url: string }) {
  const url = data.url || '/';
  const cleanPath = url.split('?')[0].split('#')[0].replace(/\/$/, '') || '/';

  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });

  let title = SEO_CONFIG.home.title;
  let description = SEO_CONFIG.home.description;
  let keywords = SEO_CONFIG.home.keywords;
  let canonicalPath = '/';
  const schemas: Thing[] = [];

  const blogMatch = cleanPath.match(/^\/blog\/([^/]+)$/);
  const staticRoute = STATIC_ROUTES.find((route) => route.path === cleanPath);

  if (blogMatch) {
    // 1. Dynamic Blog Detail Route: /blog/:slug
    const slug = decodeURIComponent(blogMatch[1]).trim();
    canonicalPath = `/blog/${slug}`;
    const live = await cached(blogKeys.detail(slug), () => getBlogBySlug(slug));
    const post = live?.data ?? null;

    if (post) {
      seed(client, blogKeys.detail(slug), live);
      const postTitle = String(post.blog_title ?? post.title ?? slug);
      const postDesc =
        (typeof post.blog_short_description === 'string' && post.blog_short_description.trim()) ||
        stripHtml(post.blog_description).slice(0, 160) ||
        postTitle;

      title = `${postTitle} | ${SITE_NAME} Beauty & Wellness Blog`;
      description = postDesc;
      keywords = `${postTitle}, beauty blog, VV Studio`;

      schemas.push(
        organizationSchema(),
        webPageSchema(canonicalPath, postTitle, postDesc),
        breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Blog', path: '/blog' },
          { name: postTitle, path: canonicalPath },
        ]),
        blogPostingSchema({
          slug,
          title: postTitle,
          description: postDesc,
          image: blogImageOf(post, live?.image_url ?? []),
          datePublished: post.blog_created_date ?? post.created_at ?? post.date ?? '',
          category:
            typeof post.categories === 'string'
              ? post.categories
              : typeof post.category === 'string'
                ? post.category
                : undefined,
        }),
      );

      const faq = faqPageSchema(live?.faq ?? []);
      if (faq) schemas.push(faq);
    }
  } else if (staticRoute) {
    // 2. Core Static Route: /, /about, /services, /gallery, /blog, /contact
    const cfg = SEO_CONFIG[staticRoute.key];
    title = cfg.title;
    description = cfg.description;
    keywords = cfg.keywords;
    canonicalPath = cfg.path;

    const [faqRes, testiRes] = await Promise.all([
      cached(faqKeys.bySlug(staticRoute.faqSlug), () => getFaqBySlug(staticRoute.faqSlug)),
      cached(testimonialKeys.bySlug(staticRoute.testiSlug), () => getTestimonials(staticRoute.testiSlug)),
    ]);
    const faqs = faqRes && Array.isArray(faqRes.data) ? faqRes.data : [];
    const testimonials = testiRes && Array.isArray(testiRes.data) ? testiRes.data : [];

    seed(client, faqKeys.bySlug(staticRoute.faqSlug), { data: faqs });
    seed(client, testimonialKeys.bySlug(staticRoute.testiSlug), { data: testimonials });

    const isHome = staticRoute.path === '/';
    const isBlog = staticRoute.path === '/blog';
    const { list: reviews, aggregate } = parseReviews(testimonials);
    const reviewNodes = reviews.map((r) =>
      reviewSchema({ name: r.name, body: r.body, rating: r.rating, datePublished: r.date }),
    );

    schemas.push(
      organizationSchema(aggregate, reviewNodes),
      webPageSchema(canonicalPath, title, description),
      breadcrumbSchema(
        isHome
          ? [{ name: 'Home', path: '/' }]
          : [{ name: 'Home', path: '/' }, { name: staticRoute.label, path: staticRoute.path }],
      ),
    );

    if (isHome) {
      schemas.push(websiteSchema());
      const [frontRes, featRes] = await Promise.all([
        cached(blogKeys.front(), getFrontBlogs),
        cached(blogKeys.featured(), getFeaturedBlogs),
      ]);
      seed(client, blogKeys.front(), frontRes);
      seed(client, blogKeys.featured(), featRes);

      const frontRows = frontRes && Array.isArray(frontRes.data) ? frontRes.data : [];
      const featRows = featRes && Array.isArray(featRes.data) ? featRes.data : [];
      const images: ImageUrlEntry[] = [
        ...(frontRes && Array.isArray(frontRes.image_url) ? frontRes.image_url : []),
        ...(featRes && Array.isArray(featRes.image_url) ? featRes.image_url : []),
      ];

      const seenSlugs = new Set<string>();
      const homeArticles: BlogPost[] = [];
      for (const p of [...featRows, ...frontRows]) {
        const s = blogSlugOf(p);
        if (s && !seenSlugs.has(s)) {
          seenSlugs.add(s);
          homeArticles.push(p);
        }
      }

      for (const p of homeArticles.slice(0, 6)) {
        const s = blogSlugOf(p);
        if (!s) continue;
        const pTitle = String(p.blog_title ?? p.title ?? 'Article');
        schemas.push(
          blogPostingSchema({
            slug: s,
            title: pTitle,
            description: stripHtml(p.blog_short_description || p.blog_description).slice(0, 160) || pTitle,
            image: blogImageOf(p, images),
            datePublished: p.blog_created_date ?? p.created_at ?? p.date ?? '',
          }),
        );
      }
    }

    if (isBlog) {
      const allRes = await cached(blogKeys.list(), getBlogs);
      seed(client, blogKeys.list(), allRes);

      const allRows = allRes && Array.isArray(allRes.data) ? allRes.data : [];
      const seen = new Set<string>();
      const items: Array<{ name: string; path: string }> = [];
      for (const p of allRows) {
        const s = blogSlugOf(p);
        if (s && !seen.has(s)) {
          seen.add(s);
          items.push({ name: String(p.blog_title ?? p.title ?? 'Article'), path: `/blog/${s}` });
        }
      }
      if (items.length > 0) schemas.push(itemListSchema(items));
    }

    const faq = faqPageSchema(faqs);
    if (faq) schemas.push(faq);
  }

  // Render static HTML body
  const html = renderRouteHtml(url);

  // Dehydrate QueryClient state & clear cache to free timers
  const dehydrated = JSON.stringify(dehydrate(client)).replace(/</g, '\\u003c');
  const queryState = dehydrated.includes('"queries":[]') ? null : dehydrated;
  client.clear();

  // Harvest live blog slugs from all 3 APIs to ensure all dynamic articles are crawled and emitted
  const [blogsRes, featRes, frontRes] = await Promise.all([
    cached(blogKeys.list(), getBlogs),
    cached(blogKeys.featured(), getFeaturedBlogs),
    cached(blogKeys.front(), getFrontBlogs),
  ]);
  const blogRows = [
    ...(blogsRes && Array.isArray(blogsRes.data) ? blogsRes.data : []),
    ...(featRes && Array.isArray(featRes.data) ? featRes.data : []),
    ...(frontRes && Array.isArray(frontRes.data) ? frontRes.data : []),
  ];
  const articleSlugs = Array.from(new Set(blogRows.map((p) => blogSlugOf(p)).filter(Boolean)));

  const links = new Set<string>([
    ...STATIC_ROUTES.map((r) => r.path),
    ...articleSlugs.map((slug) => `/blog/${slug}`),
  ]);

  return {
    html,
    head: {
      lang: 'en',
      title,
      elements: buildHeadElements(title, description, keywords, getCanonicalUrl(canonicalPath), schemas, queryState),
    },
    links,
    data: { url },
  };
}
