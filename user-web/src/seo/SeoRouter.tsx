/**
 * @file src/seo/SeoRouter.tsx
 * Centralized route-aware SEO manager for QuickBihar.
 *
 * Mount ONCE inside <BrowserRouter> (after <HelmetProvider>).
 * It reads `useLocation()`, matches the current route, and renders
 * the correct <SeoHead> with meta + JSON-LD — so individual screens
 * never need to import anything from seo/.
 *
 * Static routes  → meta builders from `./meta` + vertical entities
 *                  (JewelryStore, Restaurant, FAQPage, CollectionPage)
 * Dynamic routes → hooks (React Query deduplicates with screens,
 *                  so NO extra API calls are made)
 * Private routes → <NoIndexHead /> (auth / cart / checkout / account)
 */

import { useLocation } from 'react-router-dom';
import { SeoHead, NoIndexHead } from './SeoHead';
import { isNoIndexPath } from './routes';
import { getCanonicalUrl } from './site';
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
  isIndexableCategory,
} from './meta';
import {
  breadcrumbSchema,
  collectionSchema,
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
import { FAQS } from '@/src/features/Jewelery/data/faqs';
import {
  ALL_BUXAR_PAGES,
  BUXAR_DISTRICT_HUB,
} from '@/src/constants/locations/buxar';

// Feature hooks — React Query deduplicates with the screens, so NO extra API calls.
import { useProductById } from '@/src/features/clothing/product/hooks/useProducts';
import { useMallDetail, usePublicMalls } from '@/src/features/clothing/home/hooks/useMalls';
import { useCategoryBySlug } from '@/src/features/common/category/hooks/useCategories';
import { useJeweleryCategories, useJeweleryProduct } from '@/src/features/Jewelery/hooks/useJeweleryCatalog';

const JEWEL_FAQS = FAQS.map((f) => ({ question: f.q, answer: f.a }));

/** Resolve a jewellery image (string | {url} | {uri}) to a URL string. */
function jewelImageUrl(img: string | { url?: unknown; uri?: unknown } | null | undefined): string {
  if (typeof img === 'string') return img;
  if (img && typeof img.url === 'string' && img.url) return img.url;
  if (img && typeof img.uri === 'string' && img.uri) return img.uri;
  return '';
}

interface SellerCarrier {
  storeId?: string | { name?: string };
  sellerId?: string | { businessName?: string; fullName?: string };
}

/** Local seller storefront name from a product's embedded store/seller. */
function sellerNameOf(product: SellerCarrier | null | undefined): string | undefined {
  if (!product) return undefined;
  const store = product.storeId;
  if (store && typeof store === 'object' && store.name) return store.name;
  const seller = product.sellerId;
  if (seller && typeof seller === 'object') return seller.businessName || seller.fullName || undefined;
  return undefined;
}

/* ── dynamic entity components (live data, same cache as screens) ─ */

function ProductSeo({ id }: { id: string }) {
  const { data: product } = useProductById(id);
  if (!product) return null;

  const meta = productMeta(product);
  const jsonLd = [
    productSchema({ ...product, sellerName: sellerNameOf(product) }, meta.canonical),
    breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: product.category || 'Fashion', path: '/clothing/home' },
      { name: product.title || 'Product' },
    ]),
  ];
  return <SeoHead meta={meta} jsonLd={jsonLd} />;
}

function JeweleryProductSeo({ id }: { id: string }) {
  const { data: piece } = useJeweleryProduct(id);
  if (!piece) return null;

  const raw: { slug?: string; brand?: string } | undefined = piece._raw;
  const images = (Array.isArray(piece.images) ? piece.images : []).map(jewelImageUrl).filter(Boolean);
  const slug = raw?.slug || piece.id;
  const name = String(piece.name || 'Jewellery');
  const meta = staticMeta({
    title: `${name} | QuickBihar Jewellery`,
    description:
      String(piece.description || piece.subtitle || '') ||
      `${name} from trusted Bihar jewellers on QuickBihar. BIS-hallmarked, certified delivery.`,
    keywords: [name, String(piece.metal || ''), String(piece.collection || ''), 'buy jewellery Bihar', 'QuickBihar Jewellery']
      .filter(Boolean)
      .join(', '),
    path: `/jewelery/product/${slug}`,
    image: images[0],
    indexable: Number(piece.price) > 0 && images.length > 0,
  });
  const jsonLd = [
    productSchema(
      {
        title: name,
        brand: raw?.brand || String(piece.metal || '') || undefined,
        description: String(piece.description || ''),
        images: images.map((url) => ({ url })),
        price: Number(piece.price),
        currency: 'INR',
        totalStock: Number(piece.inStock ?? 1),
        isActive: true,
        ratings: { average: Number(piece.rating), count: Number(piece.reviewCount) },
      },
      meta.canonical,
    ),
    faqPageSchema(JEWEL_FAQS),
    breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Jewellery', path: '/jewelery' },
      { name },
    ]),
  ];
  return <SeoHead meta={meta} jsonLd={jsonLd} />;
}

function MallSeo({ slug }: { slug: string }) {
  const { data } = useMallDetail(slug);
  const mall = data?.mall;
  if (!mall) return null;

  const reviews = Array.isArray(data?.reviews) ? data.reviews : [];
  const products = Array.isArray(data?.products) ? data.products : [];
  const meta = mallMeta(mall);
  const items = products.slice(0, 10).map((p: { name?: string; title?: string; slug?: string; id?: string; image?: string | { url?: string } }) => ({
    name: String(p.name || p.title || 'Product'),
    url: getCanonicalUrl(`/product/${p.slug || p.id || ''}`),
    image: typeof p.image === 'string' ? p.image : p.image?.url,
  }));
  const jsonLd = [
    mallSchema({ ...mall, rating: mall.rating, reviewCount: reviews.length }, meta.canonical),
    collectionSchema({ name: `${mall.name} — products`, description: meta.description, canonical: meta.canonical, items }),
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

  const indexable = isIndexableCategory(category, 1);
  const meta = categoryMeta({ ...category, slug }, 1);
  if (!indexable) meta.robots = 'noindex, nofollow';

  const title = String(category.title || slug);
  const rawDescription: unknown = 'description' in category ? category.description : undefined;
  const description = typeof rawDescription === 'string' ? rawDescription : '';
  const jsonLd = indexable
    ? [
        collectionSchema({ name: title, description, canonical: meta.canonical, items: [] }),
        breadcrumbSchema([{ name: 'Home', path: '/' }, { name: title }]),
      ]
    : [];

  return <SeoHead meta={meta} jsonLd={jsonLd} />;
}

function MallsSeo() {
  // Same queryKey (["publicMalls"]) as MallsListScreen — zero extra API calls.
  const { data: malls } = usePublicMalls();
  const meta = mallsMeta();
  const items = (malls || []).map((m: { name?: string; slug?: string; _id?: string; id?: string }) => ({
    name: String(m?.name || 'Mall'),
    url: getCanonicalUrl(`/mall/${m?.slug || m?._id || m?.id || ''}`),
  }));
  const jsonLd = [
    organizationSchema(),
    webPageSchema('/malls', meta.title, meta.description),
    collectionSchema({ name: 'Shopping Malls in Bihar', description: meta.description, canonical: meta.canonical, items }),
    breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Malls', path: '/malls' },
    ]),
  ];
  return <SeoHead meta={meta} jsonLd={jsonLd} />;
}

function CollectionsSeo() {  const { data: cats } = useJeweleryCategories();
  const meta = jeweleryCollectionsMeta();
  const items = (cats || []).map((c: { title?: string; slug?: string }) => ({
    name: String(c?.title || 'Collection'),
    url: getCanonicalUrl('/jewelery/collections'),
  }));
  const jsonLd = [
    webPageSchema('/jewelery/collections', meta.title, meta.description),
    collectionSchema({ name: 'Jewellery Collections', description: meta.description, canonical: meta.canonical, items }),
    faqPageSchema(JEWEL_FAQS),
    breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Jewellery', path: '/jewelery' },
      { name: 'Collections' },
    ]),
  ];
  return <SeoHead meta={meta} jsonLd={jsonLd} />;
}

function LocationSeo({ slug }: { slug: string }) {
  const location =
    ALL_BUXAR_PAGES.find((loc) => loc.slug === slug) || BUXAR_DISTRICT_HUB;
  const pagePath =
    location.slug === 'buxar'
      ? '/locations/bihar/buxar'
      : `/locations/bihar/buxar/${location.slug}`;
  const meta = locationMeta({
    title: location.title,
    metaDescription: location.metaDescription,
    keywords: location.keywords,
    path: pagePath,
    image: location.image,
  });
  const jsonLd = [
    organizationSchema(),
    storeSchema({
      name: location.name,
      canonical: meta.canonical,
      description: location.metaDescription,
      image: location.image,
      pins: location.pins,
    }),
    faqPageSchema(
      location.faqs.map((f) => ({ question: f.question, answer: f.answer })),
    ),
    webPageSchema(pagePath, meta.title, meta.description),
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
  ];
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
  if (jewProductMatch) return <JeweleryProductSeo id={decodeURIComponent(jewProductMatch[1])} />;

  const locationHubMatch = pathname.match(/^\/locations\/bihar\/buxar\/?$/);
  if (locationHubMatch) return <LocationSeo slug="buxar" />;

  const locationMatch = pathname.match(/^\/locations\/bihar\/buxar\/([^/]+)$/);
  if (locationMatch)
    return <LocationSeo slug={decodeURIComponent(locationMatch[1])} />;

  // 3. Static routes
  const hasQueryParams = search.length > 1;

  switch (pathname) {
    case '/':
    case '/clothing/home': {
      const home = homeMeta();
      return (
        <SeoHead
          meta={home}
          jsonLd={[
            organizationSchema(),
            websiteSchema(),
            webPageSchema('/clothing/home', home.title, home.description),
            breadcrumbSchema([{ name: 'Home', path: '/' }]),
          ]}
        />
      );
    }

    case '/clothing/search':
      return <SeoHead meta={searchMeta(hasQueryParams)} />;

    case '/top-selling': {
      const top = topSellingMeta();
      return (
        <SeoHead
          meta={top}
          jsonLd={[
            organizationSchema(),
            webPageSchema('/top-selling', top.title, top.description),
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Top Selling', path: '/top-selling' },
            ]),
          ]}
        />
      );
    }

    case '/malls':
      return <MallsSeo />;

    case '/food': {      const food = foodMeta();
      return (
        <SeoHead
          meta={food}
          jsonLd={[
            organizationSchema(),
            restaurantSchema(food.canonical),
            webPageSchema('/food', food.title, food.description),
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Food', path: '/food' },
            ]),
          ]}
        />
      );
    }

    case '/jewelery': {
      const jewel = jeweleryMeta();
      return (
        <SeoHead
          meta={jewel}
          jsonLd={[
            organizationSchema(),
            jewelryStoreSchema(jewel.canonical),
            faqPageSchema(JEWEL_FAQS),
            webPageSchema('/jewelery', jewel.title, jewel.description),
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Jewellery', path: '/jewelery' },
            ]),
          ]}
        />
      );
    }

    case '/jewelery/collections':
      return <CollectionsSeo />;

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
