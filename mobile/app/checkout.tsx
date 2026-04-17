import React from "react";
import SafeViewWrapper from "@/src/provider/SafeViewWrapper";
import CheckoutScreen from "@/src/features/order/screen/CheckoutScreen";
import { Stack } from "expo-router";

const CheckoutRoute = () => {
  return (
    <SafeViewWrapper>
      <Stack.Screen options={{ headerShown: false }} />
      <CheckoutScreen />
    </SafeViewWrapper>
  );
};

export default CheckoutRoute;
