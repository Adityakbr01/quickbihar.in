import React, { useEffect } from "react";
import { Platform, View, ScrollView, TouchableOpacity, Text, ActivityIndicator, useWindowDimensions } from "react-native";
import { BREAKPOINTS, DESKTOP } from "@/src/utils/responsive";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { createCartStyles } from "../styles/cartStyles";
import { useCartStore } from "../store/cartStore";
import CartHeader from "../components/CartHeader";
import CartItem from "../components/CartItem";
import CartSummary from "../components/CartSummary";
import EmptyCart from "../components/EmptyCart";
import CouponInput from "../components/CouponInput";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { useAuthStore } from "@/src/features/common/auth/store/authStore";
import { AnimatedPrice } from "@/src/components/common/AnimatedPrice";

const CartContent = () => {
  const theme = useTheme();
  const styles = createCartStyles(theme);
  const {
    items,
    subtotal,
    totalTax,
    updateQuantity,
    removeItem,
    fetchCart,
    isLoading,
    appliedCoupon,
    appliedCoupons = [],
    discountAmount,
    shippingRules,
    fetchShippingConfig
  } = useCartStore();

  useEffect(() => {
    fetchCart();
    fetchShippingConfig();
  }, []);

  const handleUpdateQuantity = (sku: string, delta: number) => {
    const item = items.find(i => i.sku === sku);
    if (item) {
      const newQty = item.quantity + delta;
      if (newQty > 0) {
        updateQuantity(sku, newQty);
      } else {
        handleRemoveItem(sku);
      }
    }
  };

  const handleRemoveItem = (sku: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    removeItem(sku);
  };

  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { width: winW } = useWindowDimensions();
  // Desktop web (clothing catalog): wider centered column + footer docks
  // to the viewport bottom since bottom tabs are hidden there.
  const isDesktop = Platform.OS === "web" && winW >= BREAKPOINTS.desktopMin;

  const handleCheckout = () => {
    if (!isAuthenticated) {
      Toast.show({
        type: "info",
        text1: "Login Required",
        text2: "Please login to place an order",
      });
      router.push("/auth" as any);
      return;
    }
    router.push("/checkout" as any);
  };

  if (isLoading && items.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyCart />
      </View>
    );
  }

  // Calculate distinct products and total units
  const productsCount = items.length;
  const totalUnits = items.reduce((sum, i) => sum + (i.quantity || 1), 0);

  // Calculated values for summary & checkout
  const shipping = subtotal >= shippingRules.threshold ? 0 : shippingRules.fee;
  const autoDiscount = 0;
  const couponsTotalDiscount = appliedCoupons.length > 0
    ? appliedCoupons.reduce((sum, c) => sum + (c.appliedDiscount || 0), 0)
    : (discountAmount || 0);

  const totalDiscount = autoDiscount + couponsTotalDiscount;
  const totalAmount = Math.max(0, subtotal + shipping - totalDiscount);

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.mainWrapper,
          isDesktop && {
            maxWidth: DESKTOP.narrowMaxWidth,
            paddingHorizontal: DESKTOP.gutter,
          },
        ]}
      >
        <CartHeader productsCount={productsCount} totalUnits={totalUnits} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {items.map(item => (
            <CartItem
              key={item.sku}
              item={{
                id: item.sku,
                name: item.productTitle || "Product",
                price: item.price,
                unitPrice: item.price,
                originalPrice: item.originalPrice,
                image: item.image,
                quantity: item.quantity,
                sku: item.sku,
                selectedSize: item.selectedSize,
                selectedColor: item.selectedColor
              }}
              onUpdateQuantity={(id, delta) => handleUpdateQuantity(item.sku, delta)}
              onRemove={() => handleRemoveItem(item.sku)}
            />
          ))}

          <CouponInput />

          <CartSummary
            subtotal={subtotal}
            totalTax={totalTax}
            shipping={shipping}
            discount={autoDiscount}
            appliedCoupon={appliedCoupon}
            discountAmount={discountAmount}
          />
        </ScrollView>

        {/* Sticky Bottom Checkout CTA */}
        <View
          style={[
            styles.footer,
            isDesktop && {
              bottom: 0,
              maxWidth: DESKTOP.narrowMaxWidth - DESKTOP.gutter * 2,
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.checkoutButton, { backgroundColor: theme.primary }]}
            onPress={handleCheckout}
            activeOpacity={0.88}
          >
            <View style={styles.checkoutTotalInfo}>
              <Text style={styles.checkoutTotalLabel}>
                {totalDiscount > 0
                  ? "Total · You save"
                  : "Total Amount"}
              </Text>
              <View style={styles.checkoutTotalRow}>
                <AnimatedPrice
                  value={totalAmount}
                  duration={700}
                  style={styles.checkoutTotalAmount}
                />
                {totalDiscount > 0 ? (
                  <AnimatedPrice
                    value={totalDiscount}
                    duration={700}
                    noPulse
                    style={styles.checkoutSavingsAmount}
                  />
                ) : null}
              </View>
            </View>
            <View style={styles.checkoutActionRow}>
              <Text style={styles.checkoutText}>Place Order</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default CartContent;
