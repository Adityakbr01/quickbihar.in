import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useNavigate } from "react-router-dom";
import { goTo } from "@/src/utils/navigation";
import * as Haptics from "@/lib/haptics";
import LazyLottie from "@/src/components/common/LazyLottie";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { createCartStyles } from "../styles/cartStyles";

import { ShoppingBag } from "lucide-react";

import cartLottie from "@/assets/lottie/shoppingCart.json";

const EmptyCart = () => {
  const theme = useTheme();
  const styles = createCartStyles(theme);
  const navigate = useNavigate();

  const handleShopNow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    goTo(navigate, "/(tabs)/clothing/home" as any);
  };

  return (
    <View style={styles.emptyContainer}>
      <LazyLottie source={cartLottie}
        autoPlay
        loop
        style={{ width: 200, height: 200 }}
        resizeMode="contain"
      />
      <Text style={styles.emptyTitle}>Your cart is empty</Text>
      <Text style={styles.emptySubtitle}>
        Looks like you haven't added anything to your cart yet. Discover trending styles and exclusive offers!
      </Text>

      <TouchableOpacity style={[styles.shopNowButton, { backgroundColor: theme.primary }]}
        onPress={handleShopNow}
        activeOpacity={0.85}
      >
        <ShoppingBag size={18} color="#fff" />
        <Text style={styles.shopNowText}>Continue Shopping</Text>
      </TouchableOpacity>
    </View>
  );
};

export default EmptyCart;
