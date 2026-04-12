import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { createProductCardStyles } from "../style/ProductCard.style";
import { Product } from "../lib/mockData";

interface ProductCardProps {
  item: Product;
}

export const ProductCard = ({ item }: ProductCardProps) => {
  const theme = useTheme() as any;
  const styles = React.useMemo(() => createProductCardStyles(theme), [theme]);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: theme.background,
          borderColor: theme.border,
        },
      ]}
      activeOpacity={0.85}
    >
      {/* Image & Overlays */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.image }} style={styles.image} />

        {item.discount ? (
          <View style={styles.discountBadge}>
            <Text style={styles.discountTextAbsolute}>{item.discount}</Text>
          </View>
        ) : null}

        {/* Favorite absolute button */}
        <TouchableOpacity style={styles.favoriteBtn}>
          <Ionicons name="heart-outline" size={16} color="#020617" />
        </TouchableOpacity>

        {/* Add to Cart absolute button (like DealProductCard) */}
        <TouchableOpacity style={styles.addButton} activeOpacity={0.8}>
          <Ionicons name="bag-add-outline" size={14} color="#fff" />
          <Text style={styles.addText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Product Info */}
      <View style={styles.infoContainer}>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={12} color="#f59e0b" />
          <Text style={[styles.rating, { color: theme.text }]}>
            {item.rating}{" "}
            <Text style={{ color: theme.secondaryText }}>
              | {item.reviews}
            </Text>
          </Text>
        </View>

        <Text
          style={[styles.name, { color: theme.text }]}
          numberOfLines={2}
        >
          {item.name}
        </Text>

        <View style={styles.priceContainer}>
          <Text style={[styles.price, { color: theme.text }]}>
            {item.price}
          </Text>
          <Text style={[styles.originalPrice, { color: theme.secondaryText }]}>
            {item.originalPrice}
          </Text>
          {item.discount ? (
            <Text style={styles.discountTextInline}>{item.discount}</Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
};

