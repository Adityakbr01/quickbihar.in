import React from "react";
import SafeViewWrapper from "@/src/provider/SafeViewWrapper";
import { Stack } from "expo-router";
import CheckoutScreen from "@/src/features/common/order/screen/CheckoutScreen";
import { NoIndexHead } from "@/src/components/seo/SeoHead";

const CheckoutRoute = () => {
  return (
    <SafeViewWrapper>
      <Stack.Screen options={{ headerShown: false }} />
      <NoIndexHead />
      <CheckoutScreen />
    </SafeViewWrapper>
  );
};

export default CheckoutRoute;
