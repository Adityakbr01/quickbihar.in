import { Stack } from "expo-router";
import React from "react";

import { AuthProvider } from "@/src/features/Jewelery/context/AuthContext";
import { CartProvider } from "@/src/features/Jewelery/context/CartContext";

export default function JeweleryLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </CartProvider>
    </AuthProvider>
  );
}
