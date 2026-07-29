import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { createCartStyles } from "../styles/cartStyles";
import { useCartStore } from "../store/cartStore";

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
  discount, 
  appliedCoupon, 
  discountAmount = 0 
}: CartSummaryProps) => {
  const theme = useTheme();
  const styles = createCartStyles(theme);
  const { appliedCoupons = [] } = useCartStore();
  
  // Total discount includes hardcoded discount + coupon discount
  const totalDiscount = discount + discountAmount;
  const total = subtotal + shipping - totalDiscount;

  const formatPrice = (amount: number) => `₹${amount.toLocaleString()}`;

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
            GST / Fixed Taxes (Incl.)
          </Text>
          <Text style={[styles.summaryValue, { color: theme.secondaryText }]}>
            {formatPrice(totalTax)}
          </Text>
        </View>
      )}
      
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Shipping Fee</Text>
        <Text style={[styles.summaryValue, { color: shipping === 0 ? theme.primary : theme.text }]}>
          {shipping === 0 ? "FREE" : formatPrice(shipping)}
        </Text>
      </View>
      
      {discount > 0 && (
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Discount</Text>
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

      {appliedCoupons.length === 0 && discountAmount > 0 && (
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>
            Coupon {appliedCoupon ? `(${appliedCoupon.code})` : ""}
          </Text>
          <Text style={[styles.summaryValue, { color: theme.primary }]}>
            -{formatPrice(discountAmount)}
          </Text>
        </View>
      )}
      
      <View style={styles.divider} />
      
      <View style={styles.summaryRow}>
        <Text style={styles.totalLabel}>Total Amount</Text>
        <Text style={styles.totalValue}>{formatPrice(total)}</Text>
      </View>
    </View>
  );
};

export default CartSummary;
