import TopSellingScreen from "@/src/features/clothing/home/screens/TopSellingScreen";
import { Stack, useLocalSearchParams } from "expo-router";
import { SeoHead } from "@/src/components/seo/SeoHead";
import { staticPageMeta } from "@/src/lib/seo";

export default function TopSellingRoute() {
  const { category } = useLocalSearchParams<{ category?: string }>();
  // Filtered ?category= variants are thin duplicates — canonicalize to the clean
  // hub and keep only the clean hub indexable.
  const meta = staticPageMeta({
    title: category
      ? `Top Selling ${category} | QuickBihar`
      : "Top Selling Products in Bihar | QuickBihar",
    description: category
      ? `Discover the top selling ${category} products from local Bihar stores on QuickBihar.`
      : "Discover the most loved products from local Bihar stores — top rated, trending and best sellers on QuickBihar.",
    path: "/top-selling",
  });
  if (category) meta.robots = "noindex, nofollow";

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SeoHead meta={meta} />
      <TopSellingScreen category={category} />
    </>
  );
}
