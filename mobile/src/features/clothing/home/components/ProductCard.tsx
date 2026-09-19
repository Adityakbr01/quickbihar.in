import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { createProductCardStyles } from "../style/ProductCard.style";
import { IProduct } from "@/src/features/clothing/product/types/product.types";
import { Product as MockProduct } from "../lib/mockData";
import { useWishlistStore } from "@/src/features/common/wishlist/store/wishlistStore";
import { useCartStore } from "@/src/features/common/cart/store/cartStore";
import * as Haptics from "expo-haptics";
import WishlistHeart from "@/src/components/common/WishlistHeart";
import { VariantSelectorBottomSheet } from "../../product/components/modals/VariantSelectorBottomSheet";
import { formatPrice } from "@/src/utils/formatPrice";

interface ProductCardProps {
  item: IProduct | MockProduct;
  /** Desktop grid cell width — fills parent; mobile keeps legacy 240px. */
  desktopWidth?: number;
}

export const ProductCard = ({ item, desktopWidth }: ProductCardProps) => {
  const theme = useTheme() as any;
  const styles = React.useMemo(() => createProductCardStyles(theme), [theme]);
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const id = (item as IProduct)._id || 'mock';
  const isWishlisted = useWishlistStore((state) => state.items.includes(id));
  const toggleWishlist = useWishlistStore((state) => state.toggleItem);

  const [isSheetVisible, setIsSheetVisible] = React.useState(false);

  const variants = (item as IProduct).variants || [];
  const isSelectionApplicable = variants.length > 0;
  const sku = variants[0]?.sku || (item as MockProduct).id || 'default-sku';

  const isInCart = useCartStore(
    React.useCallback(
      (state) => {
        if (isSelectionApplicable) return false;
        return state.items.some((cartItem) => cartItem.sku === sku && (cartItem.module ?? "clothing") === "clothing");
      },
      [sku, isSelectionApplicable]
    )
  );

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
      await addItem(item, sku, 1, "clothing");
    } catch {
      // silent — haptics already fired
    }
  };

  // Helper to handle both Mock and Real Data mapping.
  // Computed during render (no manual memo) so React Compiler can optimize it.
  const p = item as IProduct;
  const numPrice = typeof p.price === 'number' ? p.price : parseFloat(String(p.price || 0));
  const numOrig = typeof p.originalPrice === 'number' ? p.originalPrice : parseFloat(String(p.originalPrice || 0));
  const hasDiscount = numOrig > numPrice;

  const discount = (() => {
    if (p.discountPercentage && Number(p.discountPercentage) > 0) {
      return `${Math.round(Number(p.discountPercentage))}% OFF`;
    }
    if (hasDiscount && numOrig > 0) {
      const pct = Math.round(((numOrig - numPrice) / numOrig) * 100);
      if (pct > 0) return `${pct}% OFF`;
    }
    if (p.discountLabel) {
      const num = parseFloat(p.discountLabel);
      if (!isNaN(num) && num > 0 && !p.discountLabel.includes("%")) {
        return `${Math.round(num)}% OFF`;
      }
      return p.discountLabel;
    }
    return null;
  })();

  const resolvedTitle = p.title || (item as MockProduct).name || "Fashion Product";
  const productData = {
    title: resolvedTitle,
    name: resolvedTitle,
    image: p.images?.[0]?.url || (item as MockProduct).image || "",
    price: numPrice > 0 ? formatPrice(numPrice) : (typeof item.price === 'string' ? item.price : "₹0"),
    originalPrice: hasDiscount ? formatPrice(numOrig) : null,
    hasDiscount,
    discount,
    rating: Number(p.ratings?.average) || 0,
    reviews: Number(p.ratings?.count) || 0,
  };

  return (
    <TouchableOpacity
      accessibilityRole="link"
      accessibilityLabel={productData.title}
      {...({ title: `View ${productData.title} on QuickBihar` } as any)}
      onPress={() => {
        // Canonical slug URL for navigation (wishlist/cart keys above stay id-based).
        router.push({ pathname: "/product/[id]", params: { id: (item as IProduct).slug || id } });
      }}
      style={[
        styles.card,
        {
          backgroundColor: theme.background,
          borderColor: theme.border,
          ...(desktopWidth ? { width: "100%" as any } : null),
        },
      ]}
      activeOpacity={0.85}
    >
      {/* Image & Overlays */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: productData.image }}
          style={styles.image}
          contentFit="cover"
          alt={`${productData.title} - Shop Online in Bihar`}
          accessibilityLabel={productData.title}
          {...({ title: `${productData.title} | QuickBihar` } as any)}
        />

        {productData.discount ? (
          <View style={styles.discountBadge}>
            <Text style={styles.discountTextAbsolute}>{productData.discount}</Text>
          </View>
        ) : null}

        {/* Favorite absolute button */}
        <WishlistHeart
          isWishlisted={isWishlisted}
          onToggle={() => toggleWishlist(id, item)}
          size={16}
          style={styles.favoriteBtn}
        />

        {productData.reviews > 0 && productData.rating > 0 ? (
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={11} color="#f59e0b" />
            <Text style={styles.rating}>
              {productData.rating.toFixed(1)}{" "}
              <Text style={styles.reviews}>
                | {productData.reviews}
              </Text>
            </Text>
          </View>
        ) : null}

        {/* Add to Cart absolute button (like DealProductCard) */}
        <TouchableOpacity
          style={[
            styles.addButton,
            (item as IProduct).totalStock <= 0 && { opacity: 0.5, backgroundColor: theme.secondaryText },
            isInCart && { backgroundColor: theme.primary }
          ]}
          activeOpacity={0.8}
          disabled={(item as IProduct).totalStock <= 0}
          onPress={(e) => {
            e.stopPropagation();
            handleAddToCart();
          }}
        >
          <Ionicons
            name={
              (item as IProduct).totalStock <= 0
                ? "close-circle-outline"
                : isInCart
                ? "arrow-forward-outline"
                : "bag-add-outline"
            }
            size={14}
            color="#fff"
          />
          <Text style={styles.addText}>
            {(item as IProduct).totalStock <= 0
              ? "Out of Stock"
              : isInCart
              ? "Go to Cart"
              : "Add"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Product Info */}
      <View style={styles.infoContainer}>


        <Text
          style={[styles.name, { color: theme.text }]}
          numberOfLines={2}
        >
          {productData.name}
        </Text>

        <View style={styles.priceContainer}>
          <Text style={[styles.price, { color: theme.text }]}>
            {productData.price}
          </Text>
          {productData.hasDiscount && productData.originalPrice ? (
            <Text style={[styles.originalPrice, { color: theme.secondaryText }]}>
              {productData.originalPrice}
            </Text>
          ) : null}
        </View>
      </View>

      {isSheetVisible && (
        <VariantSelectorBottomSheet
          visible={isSheetVisible}
          onClose={() => setIsSheetVisible(false)}
          product={item}
          theme={theme}
        />
      )}
    </TouchableOpacity>
  );
};

