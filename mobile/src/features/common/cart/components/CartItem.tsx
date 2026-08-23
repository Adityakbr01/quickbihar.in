import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { createCartStyles } from "../styles/cartStyles";
import { CartItem as CartItemType } from "../lib/cartData";

interface ExtendedCartItem extends CartItemType {
  unitPrice?: number;
  originalPrice?: number;
}

interface CartItemProps {
  item: ExtendedCartItem;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
}

const CartItem = ({ item, onUpdateQuantity, onRemove }: CartItemProps) => {
  const theme = useTheme();
  const styles = createCartStyles(theme);

  // Extract raw numeric price
  const numericPrice = typeof item.unitPrice === "number"
    ? item.unitPrice
    : (typeof item.price === "number"
      ? item.price
      : Number(String(item.price).replace(/[^0-9.]/g, "")) || 0);

  const itemTotal = numericPrice * item.quantity;
  const isMinQuantity = item.quantity <= 1;

  const handleDecrement = () => {
    if (!isMinQuantity) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onUpdateQuantity(item.id, -1);
    }
  };

  const handleIncrement = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onUpdateQuantity(item.id, 1);
  };

  const handleRemove = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRemove(item.id);
  };

  return (
    <View style={styles.card}>
      <Image
        source={{ uri: item.image || "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&q=80" }}
        style={styles.image}
        resizeMode="cover"
      />

      <View style={styles.itemDetails}>
        <View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", position: "relative" }}>
            <Text style={styles.itemName} numberOfLines={2} ellipsizeMode="tail">
              {item.name}
            </Text>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleRemove}
              activeOpacity={0.6}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="trash-outline" size={18} color={theme.secondaryText} />
            </TouchableOpacity>
          </View>

          {(item.selectedSize || item.selectedColor) ? (
            <Text style={styles.itemVariant} numberOfLines={1}>
              {[
                item.selectedSize ? `Size: ${item.selectedSize}` : null,
                item.selectedColor ? `Color: ${item.selectedColor}` : null,
              ].filter(Boolean).join("  •  ")}
            </Text>
          ) : null}
        </View>

        <View style={styles.priceRow}>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>₹{numericPrice.toLocaleString()}</Text>
            {item.quantity > 1 ? (
              <Text style={styles.itemSubtotal}>
                Item Total: ₹{itemTotal.toLocaleString()}
              </Text>
            ) : item.originalPrice && item.originalPrice > numericPrice ? (
              <Text style={styles.originalPriceStrikethrough}>
                ₹{item.originalPrice.toLocaleString()}
              </Text>
            ) : null}
          </View>

          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={[styles.qtyButton, isMinQuantity && styles.qtyButtonDisabled]}
              onPress={handleDecrement}
              disabled={isMinQuantity}
              activeOpacity={0.6}
            >
              <Ionicons
                name="remove"
                size={16}
                color={isMinQuantity ? theme.secondaryText : theme.text}
              />
            </TouchableOpacity>

            <Text style={styles.qtyText}>{item.quantity}</Text>

            <TouchableOpacity
              style={styles.qtyButton}
              onPress={handleIncrement}
              activeOpacity={0.6}
            >
              <Ionicons name="add" size={16} color={theme.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export default CartItem;
