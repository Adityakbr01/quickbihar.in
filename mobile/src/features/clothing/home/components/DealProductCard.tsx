import WishlistHeart from "@/src/components/common/WishlistHeart";
import { IProduct } from "@/src/features/clothing/product/types/product.types";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";
import { useCartStore } from "@/src/features/common/cart/store/cartStore";
import { useWishlistStore } from "@/src/features/common/wishlist/store/wishlistStore";
import { DealProduct as MockProduct } from "../lib/dealsConfig";
import { createDealProductCardStyles } from "../style/DealProductCard.style";
import { VariantSelectorBottomSheet } from "../../product/components/modals/VariantSelectorBottomSheet";

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
  const cartItems = useCartStore(state => state.items);

  const id = (product as IProduct)._id || 'mock';
  const isWishlisted = useWishlistStore(state => state.items.includes(id));
  const toggleWishlist = useWishlistStore(state => state.toggleItem);

  const [isSheetVisible, setIsSheetVisible] = React.useState(false);

  const variants = (product as IProduct).variants || [];
  const uniqueColors = React.useMemo(() => {
    return Array.from(new Set(variants.map(v => v.color?.trim()).filter(Boolean))) as string[];
  }, [variants]);
  
  const uniqueSizes = React.useMemo(() => {
    return Array.from(new Set(variants.map(v => v.size?.trim()).filter(Boolean))) as string[];
  }, [variants]);

  const isSelectionApplicable = variants.length > 0;
  const sku = variants[0]?.sku || (product as MockProduct).id || 'default-sku';

  const isInCart = React.useMemo(() => {
    if (isSelectionApplicable) return false;
    return cartItems.some(cartItem => cartItem.sku === sku);
  }, [cartItems, sku, isSelectionApplicable]);

  const handleAddToCart = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isInCart) {
      router.push("/clothing/cart");
      return;
    }
    if (isSelectionApplicable) {
      setIsSheetVisible(true);
      return;
    }

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
  const computedDiscount = React.useMemo(() => {
    const p = product as IProduct;
    if (p.discountPercentage && Number(p.discountPercentage) > 0) {
      return `${Math.round(Number(p.discountPercentage))}% OFF`;
    }
    if (typeof p.originalPrice === 'number' && typeof p.price === 'number' && p.originalPrice > p.price) {
      const pct = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
      if (pct > 0) return `${pct}% OFF`;
    }
    if (p.discountLabel) {
      const num = parseFloat(p.discountLabel);
      if (!isNaN(num) && num > 0 && !p.discountLabel.includes("%")) {
        return `${Math.round(num)}% OFF`;
      }
      return p.discountLabel;
    }
    return (product as MockProduct).discount || null;
  }, [product]);

  const p = product as IProduct;
  const productData = {
    title: p.title || (product as MockProduct).title || "",
    image: p.images?.[0]?.url || (product as MockProduct).image || "",
    price: typeof product.price === 'number' ? `₹${product.price.toLocaleString()}` : product.price,
    originalPrice: typeof product.originalPrice === 'number' ? `₹${product.originalPrice.toLocaleString()}` : product.originalPrice,
    discount: computedDiscount,
    rating: Number(p.ratings?.average) || 0,
    reviews: Number(p.ratings?.count) || 0,
    subtitle: p.brand ? `${p.brand}${p.category ? ` • ${p.category}` : ""}` : p.category || "",
    tag: p.isTrending ? "Trending" : p.isNewArrival ? "New" : null,
    delivery: p.deliveryInfo?.isExpressAvailable
      ? "Express Delivery"
      : p.deliveryInfo?.estimatedDays
      ? `${p.deliveryInfo.estimatedDays} Days Delivery`
      : null,
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

        {/* Top-Left Discount Badge */}
        {productData.discount ? (
          <View style={styles.discountBadge}>
            <Text style={styles.discountBadgeText}>{productData.discount}</Text>
          </View>
        ) : null}

        {productData.tag ? (
          <View
            style={[
              styles.tagBadge,
              productData.discount ? { top: 34 } : null,
            ]}
          >
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

        {/* Real Rating Pill (Only shown if product has real ratings) */}
        {productData.reviews > 0 && productData.rating > 0 ? (
          <View style={styles.ratingPill}>
            <Ionicons name="star" size={12} color="#f59e0b" />
            <Text style={[styles.ratingText, { color: theme.text }]}>
              {productData.rating.toFixed(1)}{" "}
              <Text style={{ color: theme.secondaryText, fontSize: 10 }}>
                | {productData.reviews}
              </Text>
            </Text>
          </View>
        ) : null}

        {/* Add to Cart absolute button */}
        {(product as IProduct).totalStock > 0 &&

          (
            <TouchableOpacity
              style={[
                styles.addButton,
                isInCart && { backgroundColor: theme.primary }
              ]}
              activeOpacity={0.8}
              onPress={(e) => {
                e.stopPropagation();
                handleAddToCart();
              }}
            >
              <Ionicons
                name={
                  isInCart
                    ? "arrow-forward-outline"
                    : "bag-add-outline"
                }
                size={14}
                color="#fff"
              />
              <Text style={styles.addText}>
                {isInCart ? "Go to Cart" : "Add"}
              </Text>
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

        {productData.subtitle ? (
          <Text
            style={[styles.benefitsText, { color: theme.secondaryText }]}
            numberOfLines={1}
          >
            {productData.subtitle}
          </Text>
        ) : null}

        <View style={styles.priceRow}>
          <Text style={[styles.dealPrice, { color: theme.text }]}>
            {productData.price}
          </Text>
          {productData.originalPrice && productData.originalPrice !== productData.price ? (
            <Text style={[styles.originalPrice, { color: theme.secondaryText }]}>
              {productData.originalPrice}
            </Text>
          ) : null}
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

      {isSheetVisible && (
        <VariantSelectorBottomSheet
          visible={isSheetVisible}
          onClose={() => setIsSheetVisible(false)}
          product={product}
          theme={theme}
        />
      )}
    </TouchableOpacity>
  );
};
