import React, { useMemo } from "react";
import { ChevronLeft, PackageOpen, ShoppingBag } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "@/lib/haptics";

import { goBack, toWebPath } from "@/src/utils/navigation";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { useCategoryBySlug } from "../hooks/useCategories";
import { getPublicProductsRequest } from "@/src/features/clothing/product/api/product.api";
import type { IProduct } from "@/src/features/clothing/product/types/product.types";
import { ProductCard } from "@/src/features/clothing/home/components/ProductCard";
import { ProductCardSkeleton } from "@/src/features/clothing/home/components/ProductCardSkeleton";

interface CategoryDetailScreenProps {
  slug: string;
}

const PAGE_SIZE = 24;

/**
 * Public category hub. Renders standardized header, responsive product grid,
 * and crawlable products with rich ProductCard aesthetics.
 */
const CategoryDetailScreen: React.FC<CategoryDetailScreenProps> = ({ slug }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  const categoryQuery = useCategoryBySlug(slug);
  const category: any = categoryQuery.data;

  const productsQuery = useQuery({
    queryKey: ["category-products", category?.title || slug],
    queryFn: () =>
      getPublicProductsRequest({ category: category?.title || slug, limit: PAGE_SIZE, vertical: "CLOTHING" }),
    enabled: !!category?.title,
    staleTime: 1000 * 60 * 5,
  });
  const products: IProduct[] = useMemo(() => productsQuery.data?.data ?? [], [productsQuery.data]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    goBack(navigate);
  };

  if (categoryQuery.isLoading) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-[1280px] flex-col px-4 py-8 md:px-6">
        <div className="mb-6 h-8 w-48 animate-pulse rounded-lg" style={{ backgroundColor: theme.tertiaryBackground }} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (categoryQuery.isError || !category) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-[1280px] flex-col items-center justify-center px-4 py-16 text-center">
        <div
          className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: `${theme.primary}18` }}
        >
          <PackageOpen size={32} color={theme.primary} />
        </div>
        <h1 className="mb-2 text-2xl font-black" style={{ color: theme.text }}>
          Category Not Found
        </h1>
        <p className="mb-6 max-w-md text-sm leading-5" style={{ color: theme.secondaryText }}>
          We couldn't find the requested category. It may have moved or been renamed.
        </p>
        <Link
          to={toWebPath("/(tabs)/clothing/home")}
          className="rounded-full px-6 py-2.5 text-sm font-bold text-white shadow-md transition-opacity hover:opacity-90"
          style={{ backgroundColor: theme.primary }}
        >
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: theme.background }}>
      {/* Mobile App Bar */}
      <div
        className="sticky top-0 z-20 flex h-14 w-full items-center justify-between border-b px-4 backdrop-blur-md md:hidden"
        style={{
          backgroundColor: theme.background + "F2",
          borderColor: theme.border,
        }}
      >
        <button
          type="button"
          onClick={handleBack}
          aria-label="Go back"
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full"
          style={{ backgroundColor: theme.secondaryBackground }}
        >
          <ChevronLeft size={20} color={theme.text} />
        </button>

        <h2 className="max-w-[200px] truncate text-base font-extrabold" style={{ color: theme.text }}>
          {category.title}
        </h2>

        <span className="text-xs font-semibold" style={{ color: theme.secondaryText }}>
          {products.length} items
        </span>
      </div>

      <div className="mx-auto w-full max-w-[1280px] px-4 pt-4 md:px-6 md:pt-6">
        {/* Desktop Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-4 hidden items-center gap-2 text-xs md:flex">
          <Link to="/" className="font-medium transition-colors hover:underline" style={{ color: theme.secondaryText }}>
            Home
          </Link>
          <span style={{ color: theme.secondaryText }}>›</span>
          <Link
            to="/clothing/home"
            className="font-medium transition-colors hover:underline"
            style={{ color: theme.secondaryText }}
          >
            Clothing
          </Link>
          <span style={{ color: theme.secondaryText }}>›</span>
          <span className="font-semibold" style={{ color: theme.text }}>
            {category.title}
          </span>
        </nav>

        {/* Category Header Banner */}
        <div className="mb-4 rounded-2xl border p-4 md:p-6" style={{ backgroundColor: theme.secondaryBackground, borderColor: theme.border }}>
          <div className="flex flex-col gap-1.5 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-xl font-black tracking-tight md:text-3xl" style={{ color: theme.text }}>
                {category.title}
              </h1>
              {!!category.description && (
                <p className="mt-1 max-w-2xl text-xs md:text-sm leading-5 font-medium" style={{ color: theme.secondaryText }}>
                  {category.description}
                </p>
              )}
            </div>
            <div className="mt-2 md:mt-0 flex items-center gap-1.5">
              <span
                className="rounded-full px-3 py-1 text-xs font-bold"
                style={{ backgroundColor: `${theme.primary}18`, color: theme.primary }}
              >
                {productsQuery.isLoading ? "Loading..." : `${products.length} Products`}
              </span>
            </div>
          </div>
        </div>

        {/* Category Navigation Pills */}
        <div className="mb-6 flex flex-row items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {[
            { slug: "mens-wear", title: "Men's Wear" },
            { slug: "ethnic-wear", title: "Ethnic Wear" },
            { slug: "womens-wear", title: "Women's Wear" },
            { slug: "sarees", title: "Sarees" },
            { slug: "jeans", title: "Jeans" },
            { slug: "kurtis-suits", title: "Kurtis & Suits" },
            { slug: "shirts-t-shirts", title: "Shirts & T-Shirts" },
            { slug: "kids-wear", title: "Kids Wear" },
          ].map((cat) => {
            const isActive = cat.slug === slug || cat.slug === category.slug;
            return (
              <Link
                key={cat.slug}
                to={`/category/${cat.slug}`}
                className="shrink-0 rounded-full border px-4 py-1.5 text-xs font-bold transition-all hover:opacity-90 active:scale-95"
                style={{
                  backgroundColor: isActive ? theme.primary : theme.secondaryBackground,
                  borderColor: isActive ? theme.primary : theme.border,
                  color: isActive ? "#ffffff" : theme.text,
                }}
              >
                {cat.title}
              </Link>
            );
          })}
        </div>

        {/* Product Grid */}
        {productsQuery.isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4 lg:grid-cols-5 xl:grid-cols-6 pb-28 md:pb-16">
            {Array.from({ length: 12 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4 lg:grid-cols-5 xl:grid-cols-6 pb-28 md:pb-16">
            {products.map((item) => (
              <ProductCard key={item._id} item={item} />
            ))}
          </div>
        ) : (
          <div className="flex min-h-[40vh] flex-col items-center justify-center p-8 text-center pb-28 md:pb-16">
            <div
              className="mb-4 flex h-14 w-14 items-center justify-center rounded-full"
              style={{ backgroundColor: theme.secondaryBackground }}
            >
              <ShoppingBag size={28} color={theme.secondaryText} />
            </div>
            <p className="text-base font-bold" style={{ color: theme.text }}>
              No products found in this category
            </p>
            <p className="mt-1 max-w-sm text-xs leading-5" style={{ color: theme.secondaryText }}>
              New collection items are being added soon. Check out other trending categories on QuickBihar.
            </p>
            <Link
              to="/clothing/home"
              className="mt-4 text-xs font-bold underline hover:opacity-80"
              style={{ color: theme.primary }}
            >
              Browse Home Feed
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryDetailScreen;
