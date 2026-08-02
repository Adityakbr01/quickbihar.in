import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { useColorScheme } from "react-native";

import { CartProvider } from "@/src/features/Jewelery/context/CartContext";

export default function JeweleryLayout() {
  const scheme = useColorScheme();
  return (
    <CartProvider>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }} />
    </CartProvider>
  );
}
