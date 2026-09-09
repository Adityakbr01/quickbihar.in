import React, { useMemo } from "react";
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";

import SafeViewWrapper from "@/src/provider/SafeViewWrapper";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { SeoHead } from "@/src/components/seo/SeoHead";
import {
  breadcrumbJsonLd,
  categoryMeta,
  isIndexableCategory,
  itemListJsonLd,
  canonicalUrl,
} from "@/src/lib/seo";
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
  const router = useRouter();

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

  const indexable = isIndexableCategory(category, products.length);
  const meta = categoryMeta({ ...(category || {}), slug });
  if (!indexable) meta.robots = "noindex, nofollow";

  const items = products.map((p) => ({
    name: p.title,
    url: canonicalUrl(`/product/${p.slug || p._id}`),
    image: p.images?.[0]?.url,
  }));
  const jsonLd = indexable
    ? [
      itemListJsonLd({ name: category?.title || slug, description: category?.description, canonical: meta.canonical, items }),
      breadcrumbJsonLd(meta.canonical, [{ name: "Home", path: "/" }, { name: category?.title || slug }]),
    ]
    : undefined;

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  if (categoryQuery.isLoading) {
    return (
      <SafeViewWrapper>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeViewWrapper>
    );
  }

  if (categoryQuery.isError || !category) {
    return (
      <SafeViewWrapper>
        <SeoHead meta={{ ...meta, robots: "noindex, nofollow" }} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: theme.text, marginBottom: 8 }}>
            Category not found
          </Text>
          <Link href="/(tabs)/clothing/home">Back to home</Link>
        </View>
      </SafeViewWrapper>
    );
  }

  return (
    <SafeViewWrapper>
      <SeoHead meta={meta} jsonLd={jsonLd} />
      <FlatList
        data={products}
        keyExtractor={(item) => item._id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
        contentContainerStyle={{ paddingBottom: 32 }}
        ListHeaderComponent={
          <View style={{ padding: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
              <TouchableOpacity
                onPress={handleBack}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Ionicons name="chevron-back" size={24} color={theme.text} />
              </TouchableOpacity>
              <View style={{ flexDirection: "row", alignItems: "center", marginLeft: 8 }}>
                <Link href="/">Home</Link>
                <Text style={{ color: theme.secondaryText }}>{"  ›  "}</Text>
                <Text style={{ color: theme.secondaryText }}>{category.title}</Text>
              </View>
            </View>
            <Text accessibilityRole="header" style={{ fontSize: 24, fontWeight: "800", color: theme.text, marginBottom: 4 }}>
              {category.title}
            </Text>
            {!!category.description && (
              <Text style={{ color: theme.secondaryText, marginBottom: 8 }}>{category.description}</Text>
            )}
            <Text style={{ color: theme.secondaryText, marginBottom: 4 }}>
              {productsQuery.isLoading ? "Loading products…" : `${products.length} product${products.length === 1 ? "" : "s"}`}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Link
            href={{ pathname: "/product/[id]", params: { id: item.slug || item._id } }}
            style={{ flex: 1, marginBottom: 12 }}
          >
            <View
              style={{
                backgroundColor: theme.background,
                borderColor: theme.border,
                borderWidth: 1,
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <ExpoImage
                source={{ uri: item.images?.[0]?.url }}
                contentFit="cover"
                style={{ width: "100%", height: 180 }}
                transition={200}
                alt={`${item.title}`}
              />
              <View style={{ padding: 8 }}>
                <Text numberOfLines={1} style={{ fontWeight: "600", color: theme.text }}>
                  {item.brand || "QuickBihar"}
                </Text>
                <Text numberOfLines={2} style={{ color: theme.text }}>
                  {item.title}
                </Text>
                <Text style={{ fontWeight: "700", color: theme.text }}>₹{item.price}</Text>
              </View>
            </View>
          </Link>
        )}
        ListEmptyComponent={
          !productsQuery.isLoading ? (
            <View style={{ alignItems: "center", padding: 24 }}>
              <Text style={{ color: theme.secondaryText }}>No products in this category yet.</Text>
              <Link href="/(tabs)/clothing/home">Browse the home feed</Link>
            </View>
          ) : null
        }
      />
    </SafeViewWrapper>
  );
};

export default CategoryDetailScreen;
