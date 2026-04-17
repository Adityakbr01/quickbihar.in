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

const CartContent = () => {
  const theme = useTheme();
  const styles = createCartStyles(theme);
  const { items, subtotal, itemCount, updateQuantity, removeItem, fetchCart, isLoading } = useCartStore();

  useEffect(() => {
    fetchCart();
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

  const handleCheckout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Future Checkout Logic
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
  const shipping = subtotal > 2000 ? 0 : 99;
  const discount = subtotal > 3000 ? 500 : 0;

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
                title: item.productTitle || "Product",
                price: `₹${item.price}`,
                image: item.image,
                quantity: item.quantity,
                sku: item.sku
              } as any}
              onUpdateQuantity={(id, delta) => handleUpdateQuantity(item.sku, delta)}
              onRemove={() => handleRemoveItem(item.sku)}
            />
          ))}

          <CartSummary
            subtotal={subtotal}
            shipping={shipping}
            discount={discount}
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
                Total: ₹{subtotal + shipping - discount}
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
