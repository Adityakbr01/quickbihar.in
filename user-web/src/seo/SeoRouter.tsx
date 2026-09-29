/**
 * @file src/seo/SeoRouter.tsx
 * Centralized route-aware SEO manager for QuickBihar.
 *
 * Mount ONCE inside <BrowserRouter> (after <HelmetProvider>).
 * It reads `useLocation()`, matches the current route, and renders
 * the correct <SeoHead> with meta + JSON-LD — so individual screens
 * never need to import anything from seo/.
 *
 * Static routes  → meta builders from `./meta`
 * Dynamic routes → hooks (React Query deduplicates with screens,
 *                  so NO extra API calls are made)
 * Private routes → <NoIndexHead /> (auth / cart / checkout / account)
 */

import { useLocation } from 'react-router-dom';
import { SeoHead, NoIndexHead } from './SeoHead';
import { isNoIndexPath } from './routes';
import {
  categoryMeta,
  foodMeta,
  homeMeta,
  jeweleryCollectionsMeta,
  jeweleryMeta,
  jewelerySearchMeta,
  mallMeta,
  productMeta,
  searchMeta,
  staticMeta,
  topSellingMeta,
  isIndexableCategory,
} from './meta';
import {
  breadcrumbSchema,
  collectionSchema,
  mallSchema,
  organizationSchema,
  productSchema,
  webPageSchema,
  websiteSchema,
} from './schemas';

// Feature hooks — React Query deduplicates with the screens, so NO extra API calls.
import { useProductById } from '@/src/features/clothing/product/hooks/useProducts';
import { useMallDetail } from '@/src/features/clothing/home/hooks/useMalls';
import { useCategoryBySlug } from '@/src/features/common/category/hooks/useCategories';

/* ── dynamic entity components (live data, same cache as screens) ─ */

function ProductSeo({ id }: { id: string }) {
  const { data: product } = useProductById(id);
  if (!product) return null;

  const meta = productMeta(product as never);
  const jsonLd = [
    productSchema(product as never, meta.canonical),
    breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: (product as { category?: string })?.category || 'Fashion', path: '/clothing/home' },
      { name: (product as { title?: string })?.title || 'Product' },
    ]),
  ];
  return <SeoHead meta={meta} jsonLd={jsonLd} />;
}

function MallSeo({ slug }: { slug: string }) {
  const { data } = useMallDetail(slug);
  const mall = data?.mall as { name?: string } | undefined;
  if (!mall) return null;

  const meta = mallMeta(mall as never);
  const jsonLd = [
    mallSchema(mall as never, meta.canonical),
    breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Malls', path: '/clothing/home' },
      { name: String(mall?.name || 'Mall') },
    ]),
  ];
  return <SeoHead meta={meta} jsonLd={jsonLd} />;
}

function CategorySeo({ slug }: { slug: string }) {
  const { data: category } = useCategoryBySlug(slug);
  if (!category) return null;

  const indexable = isIndexableCategory(category as never, 1);
  const meta = categoryMeta({ ...((category as unknown) as Record<string, string>), slug } as never, 1);
  if (!indexable) meta.robots = 'noindex, nofollow';

  const title = String((category as { title?: string })?.title || slug);
  const description = String((category as { description?: string })?.description || '');
  const jsonLd = indexable
    ? [
        collectionSchema({ name: title, description, canonical: meta.canonical, items: [] }),
        breadcrumbSchema([{ name: 'Home', path: '/' }, { name: title }]),
      ]
    : [];

  return <SeoHead meta={meta} jsonLd={jsonLd} />;
}

/* ── main router ─────────────────────────────────────────────── */

export default function SeoRouter() {
  const { pathname, search } = useLocation();

  // 1. Private / transactional routes → always noindex
  if (isNoIndexPath(pathname)) {
    return <NoIndexHead path={pathname} />;
  }

  // 2. Dynamic entity routes
  const productMatch = pathname.match(/^\/product\/([^/]+)$/);
  if (productMatch) return <ProductSeo id={decodeURIComponent(productMatch[1])} />;

  const mallMatch = pathname.match(/^\/mall\/([^/]+)$/);
  if (mallMatch) return <MallSeo slug={decodeURIComponent(mallMatch[1])} />;

  const categoryMatch = pathname.match(/^\/category\/([^/]+)$/);
  if (categoryMatch) return <CategorySeo slug={decodeURIComponent(categoryMatch[1])} />;

  const jewProductMatch = pathname.match(/^\/jewelery\/product\/([^/]+)$/);
  if (jewProductMatch) return <ProductSeo id={decodeURIComponent(jewProductMatch[1])} />;

  // 3. Static routes
  const hasQueryParams = search.length > 1;

  switch (pathname) {
    case '/':
    case '/clothing/home':
      return (
        <SeoHead
          meta={homeMeta()}
          jsonLd={[
            organizationSchema(),
            websiteSchema(),
            webPageSchema('/clothing/home', homeMeta().title, homeMeta().description),
            breadcrumbSchema([{ name: 'Home', path: '/' }]),
          ]}
        />
      );

    case '/clothing/search':
      return <SeoHead meta={searchMeta(hasQueryParams)} />;

    case '/top-selling':
      return <SeoHead meta={topSellingMeta()} />;

    case '/food':
      return <SeoHead meta={foodMeta()} />;

    case '/jewelery':
      return <SeoHead meta={jeweleryMeta()} />;

    case '/jewelery/collections':
      return <SeoHead meta={jeweleryCollectionsMeta()} />;

    case '/jewelery/search':
      return <SeoHead meta={jewelerySearchMeta(hasQueryParams)} />;

    default:
      return (
        <SeoHead
          meta={staticMeta({
            title: 'QuickBihar — Online Shopping in Bihar',
            description: 'Shop from local Bihar stores on QuickBihar.',
            path: pathname,
          })}
        />
      );
  }
}
