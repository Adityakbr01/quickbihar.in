import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { createCartStyles } from "../styles/cartStyles";
import { useCartStore, type AppliedCoupon } from "../store/cartStore";
import { AnimatedPrice } from "@/src/components/common/AnimatedPrice";

import { Ionicons } from "@expo/vector-icons";

interface CartSummaryProps {
  subtotal: number;
  totalTax: number;
  shipping: number;
  discount: number;
  appliedCoupon?: AppliedCoupon | null;
  discountAmount?: number;
}

// Enable smooth expand/collapse on Android (iOS has it on by default).
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CartSummary = ({
  subtotal,
  totalTax,
  shipping,
  discount = 0,
  appliedCoupon,
  discountAmount = 0,
}: CartSummaryProps) => {
  const theme = useTheme();
  const styles = createCartStyles(theme);
  const { appliedCoupons = [] } = useCartStore();
  // Default closed — the sticky checkout button already surfaces the total.
  const [expanded, setExpanded] = useState(true);

  // Total coupon discount
  const couponsTotalDiscount = appliedCoupons.length > 0
    ? appliedCoupons.reduce((sum, c) => sum + (c.appliedDiscount || 0), 0)
    : discountAmount;

  const totalDiscount = discount + couponsTotalDiscount;
  const total = Math.max(0, subtotal + shipping - totalDiscount);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((p) => !p);
  };

  const renderCouponRow = (coupon: AppliedCoupon) => {
    // If we know which items this coupon covers and it's a subset of
    // the cart, surface that as a "Applies on: X, Y" hint so the
    // buyer sees exactly which lines the discount will land on.
    const coveredNames = (coupon.appliedItems || [])
      .map((m) => m.name)
      .filter(Boolean);
    const isPartial = coveredNames.length > 0 && coupon.appliesTo === "SPECIFIC";

    return (
      <View key={coupon.code} style={styles.summaryCouponBlock}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel} numberOfLines={1}>
            Coupon ({coupon.code})
          </Text>
          <AnimatedPrice
            value={-(coupon.appliedDiscount || 0)}
            showMinus
            duration={550}
            style={[styles.summaryValue, { color: theme.primary }]}
          />
        </View>
        {isPartial ? (
          <Text
            style={[
              styles.summaryHint,
              { color: theme.secondaryText, marginTop: 2 },
            ]}
            numberOfLines={2}
          >
            Applies on: {coveredNames.slice(0, 2).join(", ")}
            {coveredNames.length > 2 ? ` +${coveredNames.length - 2} more` : ""}
          </Text>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.summaryContainer}>
      <TouchableOpacity
        style={styles.summaryHeaderRow}
        onPress={toggle}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={
          expanded ? "Hide bill summary" : "Show bill summary"
        }
      >
        <Text style={styles.summaryTitle}>Bill Summary</Text>
        <View style={styles.summaryHeaderRight}>
          <AnimatedPrice
            value={total}
            style={styles.summaryHeaderTotal}
          />
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={18}
            color={theme.secondaryText}
            style={{ marginLeft: 6 }}
          />
        </View>
      </TouchableOpacity>

      {expanded ? (
        <View style={styles.summaryBody}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <AnimatedPrice
              value={subtotal - totalTax}
              style={styles.summaryValue}
            />
          </View>

          {totalTax > 0 ? (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.secondaryText }]}>
                Taxes & GST (Included)
              </Text>
              <AnimatedPrice
                value={totalTax}
                style={[styles.summaryValue, { color: theme.secondaryText }]}
              />
            </View>
          ) : null}

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            {shipping === 0 ? (
              <Text style={[styles.summaryValue, { color: theme.primary }]}>FREE</Text>
            ) : (
              <AnimatedPrice
                value={shipping}
                style={styles.summaryValue}
              />
            )}
          </View>

          {discount > 0 ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Product Discount</Text>
              <AnimatedPrice
                value={-discount}
                showMinus
                duration={550}
                style={[styles.summaryValue, { color: theme.primary }]}
              />
            </View>
          ) : null}

          {appliedCoupons.map(renderCouponRow)}

          {appliedCoupons.length === 0 && couponsTotalDiscount > 0 ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Coupon {appliedCoupon ? `(${appliedCoupon.code})` : ""}
              </Text>
              <AnimatedPrice
                value={-couponsTotalDiscount}
                showMinus
                duration={550}
                style={[styles.summaryValue, { color: theme.primary }]}
              />
            </View>
          ) : null}

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <AnimatedPrice
              value={total}
              duration={750}
              style={styles.totalValue}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
};

export default CartSummary;
