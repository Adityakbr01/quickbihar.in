import React from "react";
import { Stack } from "expo-router";
import OrderDetailScreen from "@/src/features/common/order/screen/OrderDetailScreen";
import { NoIndexHead } from "@/src/components/seo/SeoHead";

/** Authenticated order detail — never indexed (plan §25). */
export default function OrderDetailRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <NoIndexHead />
      <OrderDetailScreen />
    </>
  );
}
