import { Link, Stack } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import { SeoHead } from "@/src/components/seo/SeoHead";
import { staticPageMeta } from "@/src/lib/seo";

/**
 * Catch-all 404 route (plan §21). Renders for unknown paths on all platforms;
 * under `web.output: "static"` the host must also return a real 404 status
 * (see mobile/Dockerfile `error_page 404 /404.html` in Phase 1.4).
 * Never indexed, never in sitemap.
 */
export default function NotFoundScreen() {
  const meta = staticPageMeta({
    title: "Page Not Found | QuickBihar",
    description: "The page you are looking for does not exist on QuickBihar.",
    path: "/404",
    indexable: false,
  });

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SeoHead meta={meta} />
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 8 }}>Page not found</Text>
        <Text style={{ marginBottom: 16, textAlign: "center" }}>
          This link may be broken or the product may no longer be available.
        </Text>
        <Link href="/(tabs)/clothing/home">Back to home</Link>
      </View>
    </>
  );
}
