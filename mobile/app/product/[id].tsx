import ProductDetailScreen from "@/src/features/product/screen/ProductDetailScreen";
import { Stack, useLocalSearchParams } from "expo-router";
import React from "react";

export default function ProductRoute() {
  const { id } = useLocalSearchParams();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ProductDetailScreen id={id as string} />
    </>
  );
}
