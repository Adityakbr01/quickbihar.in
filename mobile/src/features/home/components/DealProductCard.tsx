import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { createDealProductCardStyles } from "../style/DealProductCard.style";
import { DealProduct } from "../lib/dealsMockData";

interface DealProductCardProps {
  product: DealProduct;
  width: number;
}

export const DealProductCard = ({ product, width }: DealProductCardProps) => {
  const theme = useTheme() as any;
  const styles = React.useMemo(
    () => createDealProductCardStyles(theme),
    [theme],
  );

  return (
    <View
      style={[
        styles.productCard,
        {
          backgroundColor: theme.background,
          borderColor: theme.border,
          width,
        },
      ]}
    >
      {/* Image & Overlays */}
      <View style={styles.productImageContainer}>
        <Image source={{ uri: product.image }} style={styles.productImage} />

        {product.tag ? (
          <View style={styles.tagBadge}>
            <Text style={styles.tagText}>{product.tag}</Text>
          </View>
        ) : null}

        {/* Add to Cart absolute button */}
        <TouchableOpacity style={styles.addButton} activeOpacity={0.8}>
          <Ionicons name="bag-add-outline" size={14} color="#fff" />
          <Text style={styles.addText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Product Info */}
      <View style={styles.productInfo}>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={12} color="#f59e0b" />
          <Text style={[styles.ratingText, { color: theme.text }]}>
            {product.rating}{" "}
            <Text style={{ color: theme.secondaryText }}>
              | {product.reviews}
            </Text>
          </Text>
        </View>

        <Text
          style={[styles.productTitle, { color: theme.text }]}
          numberOfLines={2}
        >
          {product.title}
        </Text>

        <Text
          style={[styles.benefitsText, { color: theme.secondaryText }]}
          numberOfLines={1}
        >
          {product.benefits}
        </Text>

        <View style={styles.priceRow}>
          <Text style={[styles.dealPrice, { color: theme.text }]}>
            {product.price}
          </Text>
          <Text style={[styles.originalPrice, { color: theme.secondaryText }]}>
            {product.originalPrice}
          </Text>
          <Text style={styles.discountText}>{product.discount}</Text>
        </View>

        {product.delivery ? (
          <View style={styles.deliveryRow}>
            <Ionicons
              name="bicycle-outline"
              size={14}
              color={theme.success || "#10b981"}
            />
            <Text
              style={[
                styles.deliveryText,
                { color: theme.success || "#10b981" },
              ]}
            >
              {product.delivery}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};
