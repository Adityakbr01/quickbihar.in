import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { createCartStyles } from "../styles/cartStyles";
import { CartItem as CartItemType } from "../lib/cartMockData";

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
}

const CartItem = ({ item, onUpdateQuantity, onRemove }: CartItemProps) => {
  const theme = useTheme();
  const styles = createCartStyles(theme);

  const handleUpdate = (delta: number) => {
    if (item.quantity + delta > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onUpdateQuantity(item.id, delta);
    } else {
      onRemove(item.id);
    }
  };

  return (
    <View style={styles.card}>
      <Image source={{ uri: item.image }} style={styles.image} />

      <View style={styles.itemDetails}>
        <View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Text style={styles.itemName} numberOfLines={2} ellipsizeMode="tail">{item.name}</Text>
            <TouchableOpacity style={styles.closeBTN} onPress={() => onRemove(item.id)}>
              <Ionicons name="close" size={20} color={theme.secondaryText} />
            </TouchableOpacity>
          </View>

          <Text style={styles.itemVariant}>
            Size: {item.selectedSize}  •  Color: {item.selectedColor}
          </Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.price}>{item.price}</Text>

          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.qtyButton}
              onPress={() => handleUpdate(-1)}
            >
              <Ionicons name="remove" size={16} color={theme.text} />
            </TouchableOpacity>

            <Text style={styles.qtyText}>{item.quantity}</Text>

            <TouchableOpacity
              style={styles.qtyButton}
              onPress={() => handleUpdate(1)}
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
