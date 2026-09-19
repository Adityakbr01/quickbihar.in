import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { useColorScheme, View } from "react-native";

import { CartProvider } from "@/src/features/Jewelery/context/CartContext";
import { useColors } from "@/src/features/Jewelery/hooks/useColors";
import { NoIndexHead } from "@/src/components/seo/SeoHead";

export default function JeweleryLayout() {
  const scheme = useColorScheme();
  const colors = useColors();

  return (
    <View style={{ flex: 1, backgroundColor: colors.ivory }}>
      <CartProvider>
        <NoIndexHead />
        <StatusBar style={scheme === "dark" ? "light" : "dark"} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { flex: 1, backgroundColor: colors.ivory },
          }}
        />
      </CartProvider>
    </View>
  );
}
