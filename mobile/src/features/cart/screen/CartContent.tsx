import React, { useState, useMemo } from "react";
import { View, ScrollView, TouchableOpacity, Text, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { createCartStyles } from "../styles/cartStyles";
import { INITIAL_CART, CartItem as CartItemType } from "../lib/cartMockData";
import CartHeader from "../components/CartHeader";
import CartItem from "../components/CartItem";
import CartSummary from "../components/CartSummary";
import EmptyCart from "../components/EmptyCart";

const CartContent = () => {
  const theme = useTheme();
  const styles = createCartStyles(theme);
  const [cartItems, setCartItems] = useState<CartItemType[]>(INITIAL_CART);

  const parsePrice = (priceStr: string) => {
    return parseInt(priceStr.replace(/[^0-9]/g, ""));
  };

  const totals = useMemo(() => {
    const subtotal = cartItems.reduce((acc, item) => acc + (parsePrice(item.price) * item.quantity), 0);
    const shipping = subtotal > 2000 ? 0 : 99;
    const discount = subtotal > 3000 ? 500 : 0;
    return { subtotal, shipping, discount };
  }, [cartItems]);

  const updateQuantity = (id: string, delta: number) => {
    setCartItems(prev => prev.map(item =>
      item.id === id ? { ...item, quantity: item.quantity + delta } : item
    ));
  };

  const removeItem = (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const handleCheckout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Future Checkout Logic
  };

  if (cartItems.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyCart />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.mainWrapper}>
        <CartHeader itemCount={cartItems.length} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {cartItems.map(item => (
            <CartItem
              key={item.id}
              item={item}
              onUpdateQuantity={updateQuantity}
              onRemove={removeItem}
            />
          ))}

          <CartSummary
            subtotal={totals.subtotal}
            shipping={totals.shipping}
            discount={totals.discount}
          />
        </ScrollView>

        {/* Sticky Bottom Checkout */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.checkoutButton, { backgroundColor: theme.primary }]}
            onPress={handleCheckout}
            activeOpacity={0.9}
          >
            <Text style={styles.checkoutText}>Place Order</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default CartContent;
