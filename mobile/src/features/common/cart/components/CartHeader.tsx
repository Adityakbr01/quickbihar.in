import React from "react";
import { View, Text } from "react-native";
import LazyLottie from "@/src/components/common/LazyLottie";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { createCartStyles } from "../styles/cartStyles";

const walletLottie = require("@/assets/lottie/Wallet.json");

interface CartHeaderProps {
  productsCount: number;
  totalUnits: number;
}

const CartHeader = ({ productsCount, totalUnits }: CartHeaderProps) => {
  const theme = useTheme();
  const styles = createCartStyles(theme);

  const productLabel = productsCount === 1 ? "product" : "products";
  const itemLabel = totalUnits === 1 ? "item" : "items";

  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.headerTitle}>My Cart</Text>
        <Text style={styles.itemCount}>
          {productsCount} {productLabel} · {totalUnits} {itemLabel}
        </Text>
      </View>
      <LazyLottie
        source={walletLottie}
        autoPlay
        loop
        style={styles.walletLottie}
      />
    </View>
  );
};

export default CartHeader;
