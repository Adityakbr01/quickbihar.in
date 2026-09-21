import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  Dimensions,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useCart } from "@/src/features/Jewelery/context/CartContext";
import { Product } from "@/src/features/Jewelery/data/products";
import { useColors } from "@/src/features/Jewelery/hooks/useColors";
import { APP_CURRENCY } from "@/src/constants";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2;

interface ProductCardProps {
  product: Product;
  style?: object;
}

function Stars({ rating }: { rating: number }) {
  const colors = useColors();
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Feather
          key={s}
          name="star"
          size={9}
          color={s <= Math.round(rating) ? colors.gold : colors.midGray}
          style={{ marginRight: 1 }}
        />
      ))}
    </View>
  );
}

export function ProductCard({ product, style }: ProductCardProps) {
  const colors = useColors();
  const { toggleWishlist, isWishlisted, addToCart } = useCart();
  const wishlisted = isWishlisted(product.id);
  const [justAdded, setJustAdded] = React.useState(false);
  const addedTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(
    () => () => {
      if (addedTimer.current) clearTimeout(addedTimer.current);
    },
    [],
  );

  const handleWishlist = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleWishlist(product);
  };

  const handleAddToCart = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const ok = await addToCart(product);
    if (!ok) return;
    setJustAdded(true);
    if (addedTimer.current) clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setJustAdded(false), 1500);
  };

  const handlePress = () => {
    router.push(`/jewelery/product/${product.id}` as any);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.pearl, width: CARD_WIDTH },
        pressed && { opacity: 0.92 },
        style,
      ]}
    >
      <View style={styles.imageContainer}>
        {product.image ? (
          <Image
            source={product.image}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.image, styles.imageFallback, { backgroundColor: colors.champagne }]}>
            <Feather name="image" size={28} color={colors.gold} />
          </View>
        )}
        {product.badge && (
          <View
            style={[styles.badge, { backgroundColor: colors.gold }]}
          >
            <Text style={[styles.badgeText, { color: colors.onBrand }]}>
              {product.badge.toUpperCase()}
            </Text>
          </View>
        )}
        <Pressable
          style={styles.wishlistBtn}
          onPress={handleWishlist}
          hitSlop={8}
        >
          <Feather
            name="heart"
            size={16}
            color={wishlisted ? colors.gold : colors.warmGray}
            style={wishlisted ? { opacity: 1 } : { opacity: 0.7 }}
          />
        </Pressable>
        {product.inStock <= 5 && (
          <View style={[styles.stockBadge, { backgroundColor: colors.maroon }]}>
            <Text style={[styles.stockText, { color: "#fff" }]}>
              Only {product.inStock} left
            </Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text
          style={[styles.name, { color: colors.ink, fontFamily: "CormorantGaramond_500Medium_Italic" }]}
          numberOfLines={1}
        >
          {product.name}
        </Text>
        <Text
          style={[styles.subtitle, { color: colors.warmGray, fontFamily: "DMSans_400Regular" }]}
          numberOfLines={1}
        >
          {product.metal}{product.stone ? ` · ${product.stone}` : ""}
        </Text>
        <View style={styles.ratingRow}>
          <Stars rating={product.rating} />
          <Text style={[styles.reviewCount, { color: colors.warmGray, fontFamily: "DMSans_400Regular" }]}>
            ({product.reviewCount})
          </Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={[styles.price, { color: colors.ink, fontFamily: "DMSans_500Medium" }]}>
            {APP_CURRENCY}{product.price.toLocaleString("en-IN")}
          </Text>
          {product.originalPrice && (
            <Text style={[styles.originalPrice, { color: colors.warmGray, fontFamily: "DMSans_400Regular" }]}>
              {APP_CURRENCY}{product.originalPrice.toLocaleString("en-IN")}
            </Text>
          )}
        </View>
        <Pressable
          onPress={handleAddToCart}
          style={({ pressed }) => [
            styles.addBtn,
            {
              borderColor: colors.gold,
              backgroundColor:
                justAdded || pressed ? colors.champagne : "transparent",
            },
          ]}
        >
          <Text style={[styles.addBtnText, { color: justAdded ? colors.ink : colors.gold, fontFamily: "DMSans_400Regular" }]}>
            {justAdded ? "Added ✓" : "Add to Bag"}
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 16,
  },
  imageContainer: {
    position: "relative",
    aspectRatio: 3 / 4,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 1,
  },
  badgeText: {
    fontSize: 8,
    letterSpacing: 1.2,
  },
  wishlistBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(247,243,236,0.85)",
    borderRadius: 15,
  },
  stockBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 1,
  },
  stockText: {
    fontSize: 8,
    letterSpacing: 0.5,
  },
  info: {
    padding: 10,
    gap: 3,
  },
  name: {
    fontSize: 15,
    lineHeight: 19,
  },
  subtitle: {
    fontSize: 11,
    letterSpacing: 0.2,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  stars: {
    flexDirection: "row",
  },
  reviewCount: {
    fontSize: 10,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  price: {
    fontSize: 14,
  },
  originalPrice: {
    fontSize: 11,
    textDecorationLine: "line-through",
  },
  addBtn: {
    borderWidth: 1,
    paddingVertical: 7,
    alignItems: "center",
    marginTop: 6,
    borderRadius: 1,
  },
  addBtnText: {
    fontSize: 10,
    letterSpacing: 1.5,
  },
});
