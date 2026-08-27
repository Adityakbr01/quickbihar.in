import React from "react";
import { Stack } from "expo-router";
import OrderDetailScreen from "@/src/features/common/order/screen/OrderDetailScreen";

export default function OrderDetailRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <OrderDetailScreen />
    </>
  );
}
