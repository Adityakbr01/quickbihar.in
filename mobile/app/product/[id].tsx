import ProductDetailScreen from "@/src/features/clothing/product/screen/ProductDetailScreen";
import ProductDetailSkeleton from "@/src/features/clothing/product/screen/ProductDetail/components/ProductDetailSkeleton";
import { manifestToStaticParams } from "@/src/lib/staticManifest";
import { Stack, useLocalSearchParams, Link, useRouter } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import { useProductBySlug } from "@/src/features/clothing/product/hooks/useProducts";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import SafeViewWrapper from "@/src/provider/SafeViewWrapper";
import { goBack } from "@/src/utils/navigation";

/** Mongo ObjectId detector — ids stay id-fetched; anything else is treated as a canonical slug. */
const isObjectId = (value: string) => /^[0-9a-fA-F]{24}$/.test(value || "");

let productsManifest: Record<string, any> = {};
try {
  productsManifest = require("../../src/data/products-static.json");
} catch {
  productsManifest = {};
}

/**
 * generateStaticParams — emits one HTML file per product slug at build time.
 * Hard-fails if manifest is empty to prevent silent zero-page deploys.
 */
export async function generateStaticParams() {
  return manifestToStaticParams(productsManifest, "id", "product/[id]");
}

/**
 * /product/:param — accepts a legacy Mongo id OR a canonical slug (plan §13).
 * Slug params resolve to the product id via GET /products/slug/:slug, then render
 * the same id-based detail screen (reviews/similar/mutations stay id-keyed).
 * The canonical URL going forward is /product/:slug.
 */
export default function ProductRoute() {
  const { id } = useLocalSearchParams();
  const param = (Array.isArray(id) ? id[0] : id) as string;
  const isId = isObjectId(param || "");
  const slugQuery = useProductBySlug(!isId ? param || "" : "");
  const theme = useTheme() as any;
  const router = useRouter();

  // Manifest seed for the initial SSG render — undefined on native/client.
  const initialProduct = !isId && param ? productsManifest[param] : undefined;

  if (isId || !param) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <ProductDetailScreen id={param as string} />
      </>
    );
  }

  // Slug → id resolution shows the SAME skeleton the detail screen uses,
  // so tapping a product goes skeleton → product with no blank spinner stage.
  if (slugQuery.isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeViewWrapper>
          <ProductDetailSkeleton theme={theme} onBack={() => goBack(router)} />
        </SafeViewWrapper>
      </>
    );
  }

  const resolvedId = (slugQuery.data as any)?._id;
  if (slugQuery.isError || !resolvedId) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text>Product not found.</Text>
          <Link href="/(tabs)/clothing/home">Back to home</Link>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ProductDetailScreen id={resolvedId} initialProduct={initialProduct} />
    </>
  );
}
