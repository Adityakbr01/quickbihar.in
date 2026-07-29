import React from "react";
import { View, Text } from "react-native";
import LottieView from "lottie-react-native";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { createCartStyles } from "../styles/cartStyles";

const walletLottie = require("@/assets/lottie/Wallet.json");

interface CartHeaderProps {
  itemCount: number;
}

const CartHeader = ({ itemCount }: CartHeaderProps) => {
  const theme = useTheme();
  const styles = createCartStyles(theme);

  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.headerTitle}>My Cart</Text>
        <Text style={styles.itemCount}>
          {itemCount} {itemCount === 1 ? "Item" : "Items"}
        </Text>
      </View>
      <LottieView
        source={walletLottie}
        autoPlay
        loop
        style={styles.walletLottie}
        renderMode="SOFTWARE"
      />
    </View>
  );
};

export default CartHeader;
