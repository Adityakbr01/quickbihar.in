import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { createCartStyles } from "../styles/cartStyles";
import { useCartStore } from "../store/cartStore";

import { Ionicons } from "@expo/vector-icons";

interface CartSummaryProps {
  subtotal: number;
  totalTax: number;
  shipping: number;
  discount: number;
  appliedCoupon?: any;
  discountAmount?: number;
}

const CartSummary = ({ 
  subtotal, 
  totalTax, 
  shipping, 
  discount = 0, 
  appliedCoupon, 
  discountAmount = 0 
}: CartSummaryProps) => {
  const theme = useTheme();
  const styles = createCartStyles(theme);
  const { appliedCoupons = [] } = useCartStore();
  
  // Total coupon discount
  const couponsTotalDiscount = appliedCoupons.length > 0
    ? appliedCoupons.reduce((sum, c) => sum + (c.appliedDiscount || 0), 0)
    : discountAmount;

  const totalDiscount = discount + couponsTotalDiscount;
  const total = Math.max(0, subtotal + shipping - totalDiscount);

  const formatPrice = (amount: number) => `₹${Math.round(amount).toLocaleString()}`;

  return (
    <View style={styles.summaryContainer}>
      <Text style={styles.summaryTitle}>Bill Summary</Text>
      
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Subtotal</Text>
        <Text style={styles.summaryValue}>{formatPrice(subtotal - totalTax)}</Text>
      </View>

      {totalTax > 0 && (
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.secondaryText }]}>
            Taxes & GST (Included)
          </Text>
          <Text style={[styles.summaryValue, { color: theme.secondaryText }]}>
            {formatPrice(totalTax)}
          </Text>
        </View>
      )}
      
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Delivery Fee</Text>
        <Text style={[styles.summaryValue, { color: shipping === 0 ? theme.primary : theme.text }]}>
          {shipping === 0 ? "FREE" : formatPrice(shipping)}
        </Text>
      </View>
      
      {discount > 0 && (
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Product Discount</Text>
          <Text style={[styles.summaryValue, { color: theme.primary }]}>
            -{formatPrice(discount)}
          </Text>
        </View>
      )}

      {appliedCoupons.map((coupon) => (
        <View key={coupon.code} style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Coupon ({coupon.code})</Text>
          <Text style={[styles.summaryValue, { color: theme.primary }]}>
            -{formatPrice(coupon.appliedDiscount || 0)}
          </Text>
        </View>
      ))}

      {appliedCoupons.length === 0 && couponsTotalDiscount > 0 && (
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>
            Coupon {appliedCoupon ? `(${appliedCoupon.code})` : ""}
          </Text>
          <Text style={[styles.summaryValue, { color: theme.primary }]}>
            -{formatPrice(couponsTotalDiscount)}
          </Text>
        </View>
      )}
      
      <View style={styles.divider} />
      
      <View style={styles.summaryRow}>
        <Text style={styles.totalLabel}>Total Amount</Text>
        <Text style={styles.totalValue}>{formatPrice(total)}</Text>
      </View>

      {totalDiscount > 0 && (
        <View style={styles.savingsBanner}>
          <Ionicons name="sparkles" size={16} color={theme.primary} />
          <Text style={styles.savingsBannerText}>
            Yay! You are saving {formatPrice(totalDiscount)} on this order.
          </Text>
        </View>
      )}
    </View>
  );
};

export default CartSummary;
