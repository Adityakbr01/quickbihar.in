import ProductDetailScreen from "@/src/features/clothing/product/screen/ProductDetailScreen";
import { Stack, useLocalSearchParams, Link } from "expo-router";
import React from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useProductBySlug } from "@/src/features/clothing/product/hooks/useProducts";

/** Mongo ObjectId detector — ids stay id-fetched; anything else is treated as a canonical slug. */
const isObjectId = (value: string) => /^[0-9a-fA-F]{24}$/.test(value || "");

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

  if (isId || !param) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <ProductDetailScreen id={param as string} />
      </>
    );
  }

  if (slugQuery.isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator />
        </View>
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
      <ProductDetailScreen id={resolvedId} />
    </>
  );
}
