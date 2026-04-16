import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { createDealProductCardStyles } from "../style/DealProductCard.style";
import { IProduct } from "@/src/features/product/types/product.types";
import { DealProduct as MockProduct } from "../lib/dealsMockData";

interface DealProductCardProps {
  product: IProduct | MockProduct;
  width: number;
}

export const DealProductCard = ({ product, width }: DealProductCardProps) => {
  const theme = useTheme() as any;
  const styles = React.useMemo(
    () => createDealProductCardStyles(theme),
    [theme],
  );

  // Helper to handle both Mock and Real Data mapping
  const productData = {
    title: (product as IProduct).title || (product as MockProduct).title,
    image: (product as IProduct).images?.[0]?.url || (product as MockProduct).image,
    price: typeof product.price === 'number' ? `₹${product.price.toLocaleString()}` : product.price,
    originalPrice: typeof product.originalPrice === 'number' ? `₹${product.originalPrice.toLocaleString()}` : product.originalPrice,
    discount: (product as IProduct).discountLabel || (product as MockProduct).discount,
    rating: (product as IProduct).ratings?.average || (product as MockProduct).rating,
    reviews: (product as IProduct).ratings?.count || (product as MockProduct).reviews,
    // Real world app additions
    benefits: (product as MockProduct).benefits || "Free Shipping",
    tag: (product as MockProduct).tag || ((product as IProduct).isTrending ? "Trending" : null),
    delivery: (product as MockProduct).delivery || ((product as IProduct).deliveryInfo?.isExpressAvailable ? "Express Delivery" : "Standard Delivery"),
  };

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
        <Image source={{ uri: productData.image }} style={styles.productImage} />

        {productData.tag ? (
          <View style={styles.tagBadge}>
            <Text style={styles.tagText}>{productData.tag}</Text>
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
            {productData.rating ? productData.rating : "0"}{" "}
            <Text style={{ color: theme.secondaryText }}>
              | {productData.reviews ? productData.reviews : "0"}
            </Text>
          </Text>
        </View>

        <Text
          style={[styles.productTitle, { color: theme.text }]}
          numberOfLines={2}
        >
          {productData.title}
        </Text>

        <Text
          style={[styles.benefitsText, { color: theme.secondaryText }]}
          numberOfLines={1}
        >
          {productData.benefits}
        </Text>

        <View style={styles.priceRow}>
          <Text style={[styles.dealPrice, { color: theme.text }]}>
            {productData.price}
          </Text>
          <Text style={[styles.originalPrice, { color: theme.secondaryText }]}>
            {productData.originalPrice}
          </Text>
          <Text style={styles.discountText}>{productData.discount}</Text>
        </View>

        {productData.delivery ? (
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
              {productData.delivery}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};
