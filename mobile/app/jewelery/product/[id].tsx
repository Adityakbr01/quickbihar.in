import React from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Link, Stack, useLocalSearchParams, useRouter } from "expo-router";
import JeweleryProductDetailScreen from "@/src/features/Jewelery/screens/JeweleryProductDetailScreen";
import { useProductBySlug } from "@/src/features/clothing/product/hooks/useProducts";
import { useColors } from "@/src/features/Jewelery/hooks/useColors";
import { goBack } from "@/src/utils/navigation";

/** Mongo ObjectId detector — ids stay id-fetched; anything else is treated as a canonical slug. */
const isObjectId = (value: string) => /^[0-9a-fA-F]{24}$/.test(value || "");

/**
 * /jewelery/product/:param — accepts a Mongo id OR a canonical slug
 * (mall grids, SEO links, and shared URLs use slugs).
 * Slug params resolve to the product id via GET /products/slug/:slug, then
 * the URL is normalized to the id so detail/similar/reviews stay id-keyed —
 * mirroring the clothing /product/:param route.
 */
export default function JeweleryProductDetailRoute() {
  const { id } = useLocalSearchParams();
  const param = (Array.isArray(id) ? id[0] : id) as string;
  const isId = isObjectId(param || "");
  const slugQuery = useProductBySlug(!isId ? param || "" : "");
  const colors = useColors();
  const router = useRouter();

  if (isId || !param) {
    return <JeweleryProductDetailScreen />;
  }

  if (slugQuery.isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View
          style={{
            flex: 1,
            backgroundColor: colors.ivory,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator color={colors.gold} />
        </View>
      </>
    );
  }

  const resolvedId = (slugQuery.data as any)?._id;
  if (slugQuery.isError || !resolvedId) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View
          style={{
            flex: 1,
            backgroundColor: colors.ivory,
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <Text style={{ color: colors.ink, fontSize: 16 }}>
            Product not found.
          </Text>
          <Link href="/jewelery/(tabs)" style={{ marginTop: 12 }}>
            <Text style={{ color: colors.gold, fontSize: 14 }}>
              Back to home
            </Text>
          </Link>
          <Text
            onPress={() => goBack(router)}
            style={{ color: colors.warmGray, fontSize: 13, marginTop: 8 }}
          >
            Go back
          </Text>
        </View>
      </>
    );
  }

  router.replace({
    pathname: "/jewelery/product/[id]" as any,
    params: { id: String(resolvedId) },
  });
  return null;
}
