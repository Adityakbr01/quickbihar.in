import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { createProductCardStyles } from "../style/ProductCard.style";
import { IProduct } from "@/src/features/product/types/product.types";
import { Product as MockProduct } from "../lib/mockData";
import { useWishlistStore } from "../../wishlist/store/wishlistStore";
import { useCartStore } from "../../cart/store/cartStore";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import WishlistHeart from "@/src/components/common/WishlistHeart";

interface ProductCardProps {
  item: IProduct | MockProduct;
}

export const ProductCard = ({ item }: ProductCardProps) => {
  const theme = useTheme() as any;
  const styles = React.useMemo(() => createProductCardStyles(theme), [theme]);
  const router = useRouter();
  const addItem = useCartStore(state => state.addItem);

  const id = (item as IProduct)._id || 'mock';
  const isWishlisted = useWishlistStore(state => state.items.includes(id));
  const toggleWishlist = useWishlistStore(state => state.toggleItem);

  const handleAddToCart = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const sku = (item as IProduct).variants?.[0]?.sku || (item as MockProduct).id || 'default-sku';
    try {
      await addItem(item, sku, 1);
      Toast.show({
        type: 'success',
        text1: 'Added to Cart',
        text2: `${productData.name} added successfully!`,
        props: { id: Date.now() }
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to add item to cart',
        props: { id: Date.now() }
      });
    }
  };

  // Helper to handle both Mock and Real Data mapping
  const productData = {
    name: (item as IProduct).title || (item as MockProduct).name,
    image: (item as IProduct).images?.[0]?.url || (item as MockProduct).image,
    price: typeof item.price === 'number' ? `₹${item.price.toLocaleString()}` : item.price,
    originalPrice: typeof item.originalPrice === 'number' ? `₹${item.originalPrice.toLocaleString()}` : item.originalPrice,
    discount: (item as IProduct).discountLabel || (item as MockProduct).discount,
    rating: (item as IProduct).ratings?.average || (item as MockProduct).rating,
    reviews: (item as IProduct).ratings?.count || (item as MockProduct).reviews,
  };

  return (
    <TouchableOpacity
      onPress={() => {
        router.push({ pathname: "/product/[id]", params: { id } });
      }}
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
        <Image source={{ uri: productData.image }} style={styles.image} />

        {productData.discount ? (
          <View style={styles.discountBadge}>
            <Text style={styles.discountTextAbsolute}>{productData.discount}</Text>
          </View>
        ) : null}

        {/* Favorite absolute button */}
        <WishlistHeart
          isWishlisted={isWishlisted}
          onToggle={() => toggleWishlist(id)}
          size={16}
          style={styles.favoriteBtn}
        />

        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={12} color="#f59e0b" />
          <Text style={[styles.rating, { color: theme.text }]}>
            {productData.rating}{" "}
            <Text style={{ color: theme.secondaryText }}>
              | {productData.reviews ? productData.reviews : "No reviews"}
            </Text>
          </Text>
        </View>

        {/* Add to Cart absolute button (like DealProductCard) */}
        <TouchableOpacity
          style={[styles.addButton, (item as IProduct).totalStock <= 0 && { opacity: 0.5, backgroundColor: theme.secondaryText }]}
          activeOpacity={0.8}
          disabled={(item as IProduct).totalStock <= 0}
          onPress={(e) => {
            e.stopPropagation();
            handleAddToCart();
          }}
        >
          <Ionicons name={(item as IProduct).totalStock <= 0 ? "close-circle-outline" : "bag-add-outline"} size={14} color="#fff" />
          <Text style={styles.addText}>{(item as IProduct).totalStock <= 0 ? "Out of Stock" : "Add"}</Text>
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
          <Text style={[styles.originalPrice, { color: theme.secondaryText }]}>
            {productData.originalPrice}
          </Text>
          {productData.discount ? (
            <Text style={styles.discountTextInline}>{productData.discount}</Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
};

