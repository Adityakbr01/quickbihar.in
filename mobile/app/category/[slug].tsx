import { Stack, useLocalSearchParams } from "expo-router";
import React from "react";
import CategoryDetailScreen from "@/src/features/common/category/screens/CategoryDetailScreen";
import { requireNonEmpty } from "@/src/lib/staticManifest";
import { unwrapList, safeFetchJson } from "@/src/lib/fetchUtils";

/**
 * Static params for prerendering every active category hub.
 * Runs only during `expo export --platform web` with static output.
 * Hard-fails on 0 categories — consistent with product/mall loud-fail contract.
 */
export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const origin = (process.env.EXPO_PUBLIC_API_ORIGIN || "https://quickbihar.in").replace(/\/+$/, "");
  const json = await safeFetchJson<any>(`${origin}/api/v1/categories/public?vertical=CLOTHING`);
  const list: Array<{ slug?: string }> = unwrapList(json);
  const slugs = list.map((c) => String(c?.slug || "").trim()).filter(Boolean);
  requireNonEmpty(
    slugs,
    "category/[slug]",
    "Check /api/v1/categories/public response shape and ensure EXPO_PUBLIC_API_ORIGIN is set."
  );
  console.log(`[category/[slug]] Generating static pages for ${slugs.length} categories.`);
  return slugs.map((slug) => ({ slug }));
}


/**
 * /category/:slug — public taxonomy hub (plan §12). Canonical slug-only URL.
 */
export default function CategoryRoute() {
  const { slug } = useLocalSearchParams();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <CategoryDetailScreen slug={(Array.isArray(slug) ? slug[0] : slug) as string} />
    </>
  );
}
