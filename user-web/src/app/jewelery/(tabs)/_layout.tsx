import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";

import { useCart } from "@/src/features/Jewelery/context/CartContext";
import { useColors } from "@/src/features/Jewelery/hooks/useColors";

export default function JeweleryTabLayout() {
  const colors = useColors();
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const { cartCount } = useCart();

  return (
    <View style={{ flex: 1, backgroundColor: colors.ivory }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.gold,
          tabBarInactiveTintColor: colors.warmGray,
          headerShown: false,
          sceneStyle: { flex: 1, backgroundColor: colors.ivory },
          tabBarStyle: {
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: isIOS ? "transparent" : colors.ivory,
            borderTopWidth: 0.5,
            borderTopColor: colors.midGray,
            elevation: 0,
            height: isWeb ? 64 : Platform.OS === "ios" ? 80 : 64,
            paddingBottom: isWeb ? 8 : Platform.OS === "ios" ? 20 : 8,
            paddingTop: 8,
          },
          tabBarBackground: () =>
            isIOS ? (
              <BlurView
                intensity={80}
                tint="light"
                style={StyleSheet.absoluteFill}
              />
            ) : (
              <View
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: colors.ivory },
                ]}
              />
            ),
          tabBarLabelStyle: {
            fontSize: 9,
            letterSpacing: 0.8,
            fontFamily: "DMSans_400Regular",
            marginBottom: isWeb ? 4 : 0,
          },
        }}
      >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Feather name="home" size={21} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="collections"
        options={{
          title: "Collections",
          tabBarIcon: ({ color }) => (
            <Feather name="grid" size={21} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: "Wishlist",
          tabBarIcon: ({ color }) => (
            <Feather name="heart" size={21} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Bag",
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.gold,
            color: colors.ivory,
            fontSize: 9,
          },
          tabBarIcon: ({ color }) => (
            <Feather name="shopping-bag" size={21} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Account",
          tabBarIcon: ({ color }) => (
            <Feather name="user" size={21} color={color} />
          ),
        }}
      />
      </Tabs>
    </View>
  );
}
