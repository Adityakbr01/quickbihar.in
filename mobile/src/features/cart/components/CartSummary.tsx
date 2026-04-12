import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { createCartStyles } from "../styles/cartStyles";

interface CartSummaryProps {
  subtotal: number;
  shipping: number;
  discount: number;
}

const CartSummary = ({ subtotal, shipping, discount }: CartSummaryProps) => {
  const theme = useTheme();
  const styles = createCartStyles(theme);
  const total = subtotal + shipping - discount;

  const formatPrice = (amount: number) => `₹${amount.toLocaleString()}`;

  return (
    <View style={styles.summaryContainer}>
      <Text style={styles.summaryTitle}>Bill Summary</Text>
      
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Subtotal</Text>
        <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
      </View>
      
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Shipping Fee</Text>
        <Text style={[styles.summaryValue, { color: shipping === 0 ? theme.primary : theme.text }]}>
          {shipping === 0 ? "FREE" : formatPrice(shipping)}
        </Text>
      </View>
      
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Discount</Text>
        <Text style={[styles.summaryValue, { color: theme.primary }]}>-{formatPrice(discount)}</Text>
      </View>
      
      <View style={styles.divider} />
      
      <View style={styles.summaryRow}>
        <Text style={styles.totalLabel}>Total Amount</Text>
        <Text style={styles.totalValue}>{formatPrice(total)}</Text>
      </View>
    </View>
  );
};

export default CartSummary;
