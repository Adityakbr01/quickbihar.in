import React from "react";
import SafeViewWrapper from "@/src/provider/SafeViewWrapper";
import { Stack } from "expo-router";
import CheckoutScreen from "@/src/features/Clothings/order/screen/CheckoutScreen";

const CheckoutRoute = () => {
  return (
    <SafeViewWrapper>
      <Stack.Screen options={{ headerShown: false }} />
      <CheckoutScreen />
    </SafeViewWrapper>
  );
};

export default CheckoutRoute;
