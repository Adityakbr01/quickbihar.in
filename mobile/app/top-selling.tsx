import TopSellingScreen from "@/src/features/clothing/home/screens/TopSellingScreen";
import { Stack, useLocalSearchParams } from "expo-router";

export default function TopSellingRoute() {
  const { category } = useLocalSearchParams<{ category?: string }>();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <TopSellingScreen category={category} />
    </>
  );
}
