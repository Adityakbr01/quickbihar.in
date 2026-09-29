/**
 * @file src/seo/schemas.ts
 * Typed Schema.org JSON-LD graph builders for Google Rich Results.
 *
 * Utilizes `schema-dts` for compile-time type safety against official Schema.org standards.
 * Every builder produces valid, plain `Thing` nodes. The `createCompositeGraph` utility
 * combines them into a single unified `@context/@graph` script tag for crawl efficiency.
 *
 * Real VV Studio business data is used exclusively (no mocks or placeholder strings).
 */

import type {
  AggregateRating,
  BeautySalon,
  BlogPosting,
  BreadcrumbList,
  FAQPage,
  GeoCoordinates,
  ItemList,
  OpeningHoursSpecification,
  PostalAddress,
  Review,
  Thing,
  WebPage,
  WebSite,
} from 'schema-dts';

export const SITE_ORIGIN = 'https://vvs.agsdemo.in';
export const SITE_NAME = 'VV Studio';
export const SITE_LOGO = `${SITE_ORIGIN}/logo.webp`;

const ORG_ID = `${SITE_ORIGIN}/#organization`;
const WEBSITE_ID = `${SITE_ORIGIN}/#website`;

/**
 * Strips HTML tags from raw CMS strings.
 */
function stripHtml(value: unknown): string {
  return typeof value === 'string' ? value.replace(/<[^>]+>/g, '').trim() : '';
}

/**
 * Computes an absolute, normalized canonical URL for any internal route.
 *
 * @summary Canonical URL generator.
 * @param pathname - The route path (e.g. `/services` or `about`).
 * @returns Fully-qualified canonical URL with leading slash normalized.
 *
 * @why Canonical URLs prevent duplicate content penalties from protocol variations,
 *      trailing slash differences, or staging proxies.
 * @when Used across all Schema.org `@id` / `url` attributes and `<link rel="canonical">` tags.
 */
export function getCanonicalUrl(pathname: string): string {
  const clean = pathname.replace(/^\/+/, '').replace(/\/+$/, '');
  return clean ? `${SITE_ORIGIN}/${clean}` : `${SITE_ORIGIN}/`;
}

/**
 * Normalizes `YYYY-MM-DD` or raw date strings into standard ISO 8601 with an IST (+05:30) offset.
 *
 * @summary Date to ISO 8601 converter.
 * @param value - Raw date string from backend payload (e.g. `2025-03-15`).
 * @returns ISO 8601 formatted date-time string, or null if invalid.
 *
 * @why Google Rich Result validators strictly require valid ISO 8601 timestamps for `datePublished`.
 *      Specifying timezone offset (+05:30) ensures publication dates match the salon's local timezone.
 * @when Called when serializing blog posting publication dates and review submission timestamps.
 */
export function toIsoDate(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const raw = value.trim();
  if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) return raw;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (!match) {
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }
  return `${match[1]}-${match[2]}-${match[3]}T00:00:00+05:30`;
}

/**
 * Generates the central `BeautySalon` (LocalBusiness / Organization) Schema node for VV Studio.
 *
 * Includes physical address in JP Nagar, GPS coordinates, opening hours, contact phone numbers,
 * email, price range indicator, and optional aggregate customer star ratings.
 *
 * @summary Organization & BeautySalon schema builder.
 * @param aggregate - Optional aggregate rating summary with average score and count.
 * @returns Typed `BeautySalon` schema node.
 *
 * @why Enables Google Knowledge Graph entity recognition and triggers Google Local Pack / Local Business
 *      rich snippets in local search queries for salons in Bangalore.
 * @when Injected into every route as the foundational `@id: #organization` node.
 */
export function organizationSchema(
  aggregate?: {
    ratingValue: number;
    reviewCount: number;
  },
  reviews?: Review[],
): BeautySalon {
  const address: PostalAddress = {
    '@type': 'PostalAddress',
    streetAddress: '#5, 1st Floor, 24th Main, 5th Phase, JP Nagar',
    addressLocality: 'Bangalore',
    addressRegion: 'Karnataka',
    postalCode: '560078',
    addressCountry: 'IN',
  };
  const geo: GeoCoordinates = {
    '@type': 'GeoCoordinates',
    latitude: 12.9057,
    longitude: 77.5858,
  };
  const hours: OpeningHoursSpecification = {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    opens: '10:00',
    closes: '20:00',
  };
  return {
    '@type': 'BeautySalon',
    '@id': ORG_ID,
    name: SITE_NAME,
    url: `${SITE_ORIGIN}/`,
    logo: SITE_LOGO,
    image: 'https://agsdemo.in/vvsapi/public/assets/images/web_images/home/home_top_banner.webp',
    description:
      "VV Studio is Bangalore's premier luxury beauty salon offering personalized skin treatments, expert hair care, bridal makeup, and rejuvenating spa therapies.",
    telephone: ['+91-80-48531999', '+91-8310782820'],
    email: 'info@varvadhustudio.com',
    address,
    geo,
    openingHoursSpecification: hours,
    priceRange: '₹₹',
    ...(aggregate && aggregate.reviewCount > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: aggregate.ratingValue,
            reviewCount: aggregate.reviewCount,
            bestRating: 5,
          } satisfies AggregateRating,
        }
      : {}),
    ...(reviews && reviews.length > 0 ? { review: reviews } : {}),
  };
}

/**
 * Generates the Schema.org `WebSite` entity.
 *
 * @summary WebSite schema builder.
 * @returns Typed `WebSite` schema node.
 *
 * @why Defines the top-level website entity and links it to the Organization publisher node.
 * @when Injected specifically on the Home page (`/`).
 */
export function websiteSchema(): WebSite {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: `${SITE_ORIGIN}/`,
    name: SITE_NAME,
    publisher: { '@id': ORG_ID },
  };
}

/**
 * Generates the Schema.org `WebPage` entity for a specific route.
 *
 * @summary WebPage schema builder.
 * @param path - Current route pathname.
 * @param title - Page title.
 * @param description - Meta description of the page.
 * @returns Typed `WebPage` schema node.
 *
 * @why Establishes the relationship between individual URLs and the overarching website graph.
 * @when Included on all prerendered pages.
 */
export function webPageSchema(path: string, title: string, description: string): WebPage {
  return {
    '@type': 'WebPage',
    url: getCanonicalUrl(path),
    name: title,
    description,
    isPartOf: { '@id': WEBSITE_ID },
  };
}

/**
 * Generates a `BreadcrumbList` schema showing the site navigation hierarchy.
 *
 * @summary Breadcrumb navigation schema builder.
 * @param items - Ordered array of navigation steps (name and route path).
 * @returns Typed `BreadcrumbList` schema node.
 *
 * @why Search engines render breadcrumb trails instead of raw URLs in search results,
 *      improving click-through rates and clarity.
 * @when Included on every page with its respective hierarchical crumb trail.
 */
export function breadcrumbSchema(items: { name: string; path: string }[]): BreadcrumbList {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: getCanonicalUrl(item.path),
    })),
  };
}

export interface FaqRowInput {
  faq_que?: unknown;
  faq_ans?: unknown;
  faq_question?: unknown;
  faq_answer?: unknown;
}

/**
 * Generates a `FAQPage` schema from dynamic question-and-answer pairs.
 *
 * Automatically filters out empty rows.
 *
 * @summary FAQ accordion schema builder.
 * @param rows - Array of question-and-answer records from the API.
 * @returns Typed `FAQPage` schema node, or null if no valid Q&A items remain.
 *
 * @why Powers interactive FAQ accordion dropdowns directly within Google Search results.
 * @when Emitted on any route that features an active FAQ section with valid questions.
 */
export function faqPageSchema(rows: FaqRowInput[]): FAQPage | null {
  const usable = (rows ?? [])
    .map((row) => ({
      question: stripHtml(row.faq_que ?? row.faq_question),
      answer: stripHtml(row.faq_ans ?? row.faq_answer),
    }))
    .filter((row) => row.question.length > 0 && row.answer.length > 0);
  if (usable.length === 0) return null;
  return {
    '@type': 'FAQPage',
    mainEntity: usable.map((row) => ({
      '@type': 'Question',
      name: row.question,
      acceptedAnswer: { '@type': 'Answer', text: row.answer },
    })),
  };
}

export interface BlogPostingInput {
  slug: string;
  title: string;
  description: string;
  image: string;
  datePublished: unknown;
  category?: string;
}

/**
 * Generates a `BlogPosting` schema node for an article.
 *
 * @summary Blog article schema builder.
 * @param post - Article details including slug, headline, summary, image, and publication date.
 * @returns Typed `BlogPosting` schema node.
 *
 * @why Enables Google Article rich results, author attributions, and Google Discover visibility.
 * @when Injected on `/blog/:slug` detail pages and for featured front articles on the Home page.
 */
export function blogPostingSchema(post: BlogPostingInput): BlogPosting {
  const url = getCanonicalUrl(`/blog/${post.slug}`);
  const datePublished = toIsoDate(post.datePublished) ?? undefined;
  return {
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    image: post.image,
    url,
    mainEntityOfPage: url,
    ...(datePublished ? { datePublished } : {}),
    author: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: `${SITE_ORIGIN}/`,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: SITE_LOGO,
    },
  };
}

/**
 * Wraps individual schema nodes into a unified Schema.org `@graph` container.
 *
 * @summary Composite graph wrapper.
 * @param nodes - Array of Schema.org `Thing` instances.
 * @returns Root JSON-LD object with `@context: 'https://schema.org'` and `@graph: [...]`.
 *
 * @why Google recommends bundling multiple schemas into a single composite `@graph` script tag
 *      rather than multiple fragmented script tags, ensuring clean cross-entity references.
 * @when Called whenever emitting the `<script type="application/ld+json">` tag.
 */
export function createCompositeGraph(nodes: Thing[]): Record<string, unknown> {
  return { '@context': 'https://schema.org', '@graph': nodes };
}

export interface ReviewInput {
  name: string;
  body: string;
  rating: number;
  datePublished: unknown;
}

/**
 * Generates a standalone Schema.org `Review` node for customer feedback.
 *
 * @summary Customer review schema builder.
 * @param review - Review details with reviewer name, comment body, rating, and date.
 * @returns Typed `Review` schema node linked to the organization.
 *
 * @why Enables star ratings and review excerpts to display in organic Google Search snippets.
 * @when Injected for verified customer testimonials on pages showcasing reviews.
 */
export function reviewSchema(review: ReviewInput): Review {
  const datePublished = toIsoDate(review.datePublished) ?? undefined;
  return {
    '@type': 'Review',
    author: { '@type': 'Person', name: review.name },
    reviewBody: review.body,
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.rating,
      bestRating: 5,
    },
    ...(datePublished ? { datePublished } : {}),
    itemReviewed: { '@id': ORG_ID },
  };
}

/**
 * Generates an `ItemList` schema for ordered article listings.
 *
 * @summary Article item list schema builder.
 * @param items - Array of article objects containing title and path.
 * @returns Typed `ItemList` schema node.
 *
 * @why Tells search engines that the page functions as an index/collection of specific article entities.
 * @when Injected on the Blog listing page (`/blog`).
 */
export function itemListSchema(items: { name: string; path: string }[]): ItemList {
  return {
    '@type': 'ItemList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: getCanonicalUrl(item.path),
    })),
  };
}
