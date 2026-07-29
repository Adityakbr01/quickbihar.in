import React, { useEffect } from "react";
import { View, ScrollView, TouchableOpacity, Text, ActivityIndicator } from "react-native";
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

const CartContent = () => {
  const theme = useTheme();
  const styles = createCartStyles(theme);
  const {
    items,
    subtotal,
    totalTax,
    itemCount,
    updateQuantity,
    removeItem,
    fetchCart,
    isLoading,
    appliedCoupon,
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

  const handleCheckout = () => {
    if (!isAuthenticated) {
      Toast.show({
        type: "info",
        text1: "Login Required",
        text2: "Please login to place an order",
      });
      router.push("/auth");
      return;
    }
    router.push("/checkout");
  };

  if (isLoading && items.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
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

  // Calculated values for summary
  const shipping = subtotal >= shippingRules.threshold ? 0 : shippingRules.fee;
  const autoDiscount = 0; // Removed hardcoded discount
  const totalAmount = subtotal + shipping - (autoDiscount + discountAmount);

  return (
    <View style={styles.container}>
      <View style={styles.mainWrapper}>
        <CartHeader itemCount={itemCount} />

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
                price: `₹${item.price}`,
                image: item.image,
                quantity: item.quantity,
                sku: item.sku,
                selectedSize: item.selectedSize,
                selectedColor: item.selectedColor
              } as any}
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

        {/* Sticky Bottom Checkout */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.checkoutButton, { backgroundColor: theme.primary }]}
            onPress={handleCheckout}
            activeOpacity={0.9}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.checkoutText}>Place Order</Text>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
                Total: ₹{totalAmount.toLocaleString()}
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default CartContent;
