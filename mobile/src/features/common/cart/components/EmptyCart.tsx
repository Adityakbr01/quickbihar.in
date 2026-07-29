import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import LottieView from "lottie-react-native";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { createCartStyles } from "../styles/cartStyles";

const cartLottie = require("@/assets/lottie/shoppingCart.json");

const EmptyCart = () => {
  const theme = useTheme();
  const styles = createCartStyles(theme);
  const router = useRouter();

  const handleShopNow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/");
  };

  return (
    <View style={styles.emptyContainer}>
      <LottieView
        source={cartLottie}
        autoPlay
        loop
        style={{ width: 220, height: 220 }}
        renderMode="SOFTWARE"
        resizeMode="contain"
      />
      <Text style={styles.emptyTitle}>Your cart is empty</Text>
      <Text style={styles.emptySubtitle}>
        Looks like you haven't added anything to your cart yet. Explore our
        latest collections!
      </Text>

      <TouchableOpacity
        style={[styles.shopNowButton, { backgroundColor: theme.primary }]}
        onPress={handleShopNow}
        activeOpacity={0.8}
      >
        <Text style={styles.shopNowText}>Start Shopping</Text>
      </TouchableOpacity>
    </View>
  );
};

export default EmptyCart;
