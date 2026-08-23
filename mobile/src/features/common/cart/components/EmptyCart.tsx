import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import LottieView from "lottie-react-native";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { createCartStyles } from "../styles/cartStyles";

import { Ionicons } from "@expo/vector-icons";

const cartLottie = require("@/assets/lottie/shoppingCart.json");

const EmptyCart = () => {
  const theme = useTheme();
  const styles = createCartStyles(theme);
  const router = useRouter();

  const handleShopNow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/(tabs)/clothing/home" as any);
  };

  return (
    <View style={styles.emptyContainer}>
      <LottieView
        source={cartLottie}
        autoPlay
        loop
        style={{ width: 200, height: 200 }}
        renderMode="SOFTWARE"
        resizeMode="contain"
      />
      <Text style={styles.emptyTitle}>Your cart is empty</Text>
      <Text style={styles.emptySubtitle}>
        Looks like you haven't added anything to your cart yet. Discover trending styles and exclusive offers!
      </Text>

      <TouchableOpacity
        style={[styles.shopNowButton, { backgroundColor: theme.primary }]}
        onPress={handleShopNow}
        activeOpacity={0.85}
      >
        <Ionicons name="bag-handle-outline" size={18} color="#fff" />
        <Text style={styles.shopNowText}>Continue Shopping</Text>
      </TouchableOpacity>
    </View>
  );
};

export default EmptyCart;
