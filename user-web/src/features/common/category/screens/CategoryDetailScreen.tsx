import React, { useMemo } from "react";
import { ChevronLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "@/lib/haptics";

import { goBack, toWebPath } from "@/src/utils/navigation";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { useCategoryBySlug } from "../hooks/useCategories";
import { getPublicProductsRequest } from "@/src/features/clothing/product/api/product.api";
import type { IProduct } from "@/src/features/clothing/product/types/product.types";

interface CategoryDetailScreenProps {
  slug: string;
}

const PAGE_SIZE = 24;

/**
 * Public category hub (plan §12). Renders the category title/description plus its
 * public products as crawlable `<Link>` cards (anchors in static HTML).
 * Empty or inactive categories render a friendly state and are noindexed.
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
      <div className="flex flex-1 items-center justify-center">
        <span
          className="animate-spin rounded-full"
          style={{
            width: 36,
            height: 36,
            borderWidth: 3,
            borderStyle: "solid",
            borderColor: theme.primary,
            borderTopColor: "transparent",
          }}
        />
      </div>
    );
  }

  if (categoryQuery.isError || !category) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6">
          <p className="mb-2 text-lg font-bold" style={{ color: theme.text }}>
            Category not found
          </p>
          <Link to={toWebPath("/(tabs)/clothing/home")}>Back to home</Link>
        </div>
    );
  }

  return (
    <div>
        <div className="p-4">
          <div className="mb-3 flex flex-row items-center">
            <button
              type="button"
              onClick={handleBack}
              aria-label="Go back"
              className="flex items-center justify-center"
            >
              <ChevronLeft size={24} color={theme.text} />
            </button>
            <div className="ml-2 flex flex-row items-center">
              <Link to="/">Home</Link>
              <span style={{ color: theme.secondaryText }}>{"  ›  "}</span>
              <span style={{ color: theme.secondaryText }}>{category.title}</span>
            </div>
          </div>
          <h1 className="mb-1 text-2xl font-extrabold" style={{ color: theme.text }}>
            {category.title}
          </h1>
          {!!category.description && (
            <p className="mb-2" style={{ color: theme.secondaryText }}>{category.description}</p>
          )}
          <p className="mb-1" style={{ color: theme.secondaryText }}>
            {productsQuery.isLoading ? "Loading products…" : `${products.length} product${products.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 px-4 pb-8">
          {products.map((item) => (
            <Link
              key={item._id}
              to={toWebPath({ pathname: "/product/[id]", params: { id: item.slug || item._id } })}
              className="mb-3 block"
            >
              <div
                className="overflow-hidden rounded-xl border"
                style={{
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                }}
              >
                <img
                  src={item.images?.[0]?.url}
                  alt={`${item.title}`}
                  className="h-[180px] w-full object-cover"
                />
                <div className="p-2">
                  <p className="line-clamp-1 font-semibold" style={{ color: theme.text }}>
                    {item.brand || "QuickBihar"}
                  </p>
                  <p className="line-clamp-2" style={{ color: theme.text }}>
                    {item.title}
                  </p>
                  <p className="font-bold" style={{ color: theme.text }}>₹{item.price}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
        {!productsQuery.isLoading && products.length === 0 ? (
          <div className="flex flex-col items-center p-6">
            <p style={{ color: theme.secondaryText }}>No products in this category yet.</p>
            <Link to={toWebPath("/(tabs)/clothing/home")}>Browse the home feed</Link>
          </div>
        ) : null}
      </div>
  );
};

export default CategoryDetailScreen;
