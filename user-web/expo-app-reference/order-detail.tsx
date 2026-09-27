import React from "react";
import { Stack } from "expo-router";
import OrderDetailScreen from "@/src/features/common/order/screen/OrderDetailScreen";
import { NoIndexHead } from "@/src/components/seo/SeoHead";

export default function OrderDetailAliasRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <NoIndexHead />
      <OrderDetailScreen />
    </>
  );
}
