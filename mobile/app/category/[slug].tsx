import { Stack, useLocalSearchParams } from "expo-router";
import React from "react";
import CategoryDetailScreen from "@/src/features/common/category/screens/CategoryDetailScreen";

/**
 * Static params for prerendering every active category hub (plan §14).
 * Runs only during `expo export --platform web` with static output; on failure
 * (API unreachable) returns [] so the build degrades instead of failing (plan §28).
 */
export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  try {
    const origin = (process.env.EXPO_PUBLIC_API_ORIGIN || "https://quickbihar.in").replace(/\/+$/, "");
    const res = await fetch(`${origin}/api/v1/categories/public?vertical=CLOTHING`);
    if (!res.ok) return [];
    const json = await res.json();
    const list: Array<{ slug?: string }> = Array.isArray(json?.data) ? json.data : [];
    return list
      .map((c) => String(c?.slug || "").trim())
      .filter(Boolean)
      .map((slug) => ({ slug }));
  } catch {
    return [];
  }
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
