import WishlistHeart from "@/src/components/common/WishlistHeart";
import { IProduct } from "@/src/features/product/types/product.types";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";
import { useCartStore } from "../../cart/store/cartStore";
import { useWishlistStore } from "../../wishlist/store/wishlistStore";
import { DealProduct as MockProduct } from "../lib/dealsMockData";
import { createDealProductCardStyles } from "../style/DealProductCard.style";

const cyclerLottie = require("@/assets/lottie/Cycler.json");

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
  const router = useRouter();
  const addItem = useCartStore(state => state.addItem);

  const id = (product as IProduct)._id || 'mock';
  const isWishlisted = useWishlistStore(state => state.items.includes(id));
  const toggleWishlist = useWishlistStore(state => state.toggleItem);

  const handleAddToCart = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const sku =
      (product as IProduct).variants?.[0]?.sku ||
      (product as MockProduct).id ||
      'default-sku';

    try {
      await addItem(product, sku, 1);

      Toast.show({
        type: 'success',
        text1: 'Added to Cart',
        text2: `${productData.title} added successfully!`,
        props: {
          id: Date.now(), // ✅ MOST IMPORTANT LINE
        },
      });

    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to add item to cart',
        props: {
          id: Date.now(), // ✅ consistency
        },
      });
    }
  };

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
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => {
        const id = (product as IProduct)._id || 'mock';
        router.push({ pathname: "/product/[id]", params: { id } });
      }}
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



        {/* Favorite absolute button */}
        <WishlistHeart
          isWishlisted={isWishlisted}
          onToggle={() => toggleWishlist(id)}
          size={16}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: 'rgba(255,255,255,0.8)',
            padding: 6,
            borderRadius: 20
          }}
        />

        <View style={styles.ratingPill}>
          <Ionicons name="star" size={12} color="#f59e0b" />
          <Text style={[styles.ratingText, { color: theme.secondaryText }]}>
            {productData.rating ? productData.rating : 3.5}{" "}
            <Text style={{ color: theme.secondaryText }}>
              | {productData.reviews ? productData.reviews : 123}
            </Text>
          </Text>
        </View>

        {/* Add to Cart absolute button */}
        {(product as IProduct).totalStock > 0 &&

          (
            <TouchableOpacity
              style={styles.addButton}
              activeOpacity={0.8}
              onPress={(e) => {
                e.stopPropagation();
                handleAddToCart();
              }}
            >
              <Ionicons name="bag-add-outline" size={14} color="#fff" />
              <Text style={styles.addText}>Add</Text>
            </TouchableOpacity>
          )}
      </View>

      {/* Product Info */}
      <View style={styles.productInfo}>
        <Text
          style={[styles.productTitle, { color: theme.text }]}
          numberOfLines={1}

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
            {productData.delivery.toLowerCase().includes("express") ? (
              <LottieView
                source={cyclerLottie}
                autoPlay
                loop
                style={{
                  width: 22,
                  height: 22,
                  marginLeft: -4,
                  marginRight: -2,
                }}
                resizeMode="contain"
                renderMode="SOFTWARE"
              />
            ) : (
              <Ionicons
                name="bicycle-outline"
                size={14}
                color={theme.success || "#10b981"}
              />
            )}
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
    </TouchableOpacity>
  );
};
