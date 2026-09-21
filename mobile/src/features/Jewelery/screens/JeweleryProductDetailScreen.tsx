import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { goBack } from "@/src/utils/navigation";

import { APP_CURRENCY, JEWELERY_MODULE_CONFIG } from "@/src/constants";
import { ImageCarousel } from "@/src/features/Jewelery/components/ImageCarousel";
import { ProductCard } from "@/src/features/Jewelery/components/ProductCard";
import type { Product as JeweleryProduct } from "@/src/features/Jewelery/data/products";
import { useJeweleryProduct, useSimilarJewelery } from "@/src/features/Jewelery/hooks/useJeweleryCatalog";
import { useCart } from "@/src/features/Jewelery/context/CartContext";
import { useColors } from "@/src/features/Jewelery/hooks/useColors";

function Stars({ rating, count }: { rating: number; count: number }) {
  const colors = useColors();
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Feather
          key={s}
          name="star"
          size={12}
          color={s <= Math.round(rating) ? colors.gold : colors.midGray}
        />
      ))}
      <Text
        style={[
          styles.ratingText,
          { color: colors.warmGray, fontFamily: "DMSans_400Regular" },
        ]}
      >
        {rating} ({count} reviews)
      </Text>
    </View>
  );
}

export default function JeweleryProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addToCart, toggleWishlist, isWishlisted, cartItems } = useCart();
  const [addedToCart, setAddedToCart] = useState(false);

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const { data: product, isLoading } = useJeweleryProduct(id);
  const { data: related = [] } = useSimilarJewelery(id, 4);

  const isInCart = Boolean(
    product && cartItems.some((item) => item.product.id === product.id)
  );

  if (isLoading) {
    return (
      <View style={[styles.root, { backgroundColor: colors.ivory, alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.root, { backgroundColor: colors.ivory }]}>
        <Text style={[styles.notFound, { color: colors.warmGray }]}>
          Product not found
        </Text>
      </View>
    );
  }

  const wishlisted = isWishlisted(product.id);
  const tryOnConfig = product.tryOn;
  const canTryOn = Boolean(tryOnConfig?.modelUrl);

  const handleAddToCart = async () => {
    // Haptics come from the bridge (success/error) — don't pre-fire here.
    const ok = await addToCart(product);
    if (!ok) return;
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 1500);
  };

  const handleTryOn = () => {
    if (!tryOnConfig) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const tryOnParams: Record<string, string> = {
      productId: product.id,
      jewelryType: tryOnConfig.jewelryType,
      modelUrl: tryOnConfig.modelUrl,
      variants: JSON.stringify(tryOnConfig.variants ?? []),
      productName: product.name,
    };
    const defaultVariantId = tryOnConfig.variants?.[0]?.id;
    if (defaultVariantId) tryOnParams.variantId = defaultVariantId;
    router.push({ pathname: "/jewelery/try-on" as any, params: tryOnParams });
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.ivory }]}>
      {/* Back button overlay */}
      <View
        style={[
          styles.backBtn,
          { top: (Platform.OS === "web" ? 16 : insets.top) + 10 },
        ]}
      >
        <Pressable
          onPress={() => goBack(router)}
          style={[
            styles.backBtnInner,
            { backgroundColor: colors.card, borderColor: colors.midGray, borderWidth: 0.5 },
          ]}
          hitSlop={8}
        >
          <Feather name="arrow-left" size={18} color={colors.ink} />
        </Pressable>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            toggleWishlist(product);
          }}
          style={[
            styles.backBtnInner,
            { backgroundColor: colors.card, borderColor: colors.midGray, borderWidth: 0.5 },
          ]}
          hitSlop={8}
        >
          <Feather
            name="heart"
            size={18}
            color={wishlisted ? colors.gold : colors.ink}
          />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image carousel */}
        <ImageCarousel images={product.images} />

        {/* Content */}
        <View style={[styles.content, { backgroundColor: colors.ivory }]}>
          {/* Breadcrumb */}
          <Text
            style={[
              styles.breadcrumb,
              { color: colors.warmGray, fontFamily: "DMSans_400Regular" },
            ]}
          >
            {product.collection} · Rings
          </Text>

          {/* Name & rating */}
          <Text
            style={[
              styles.productName,
              {
                color: colors.ink,
                fontFamily: "CormorantGaramond_500Medium_Italic",
              },
            ]}
          >
            {product.name}
          </Text>
          <Stars rating={product.rating} count={product.reviewCount} />

          {/* Price */}
          <View style={styles.priceRow}>
            <Text
              style={[
                styles.price,
                { color: colors.ink, fontFamily: "DMSans_500Medium" },
              ]}
            >
              {APP_CURRENCY}{product.price.toLocaleString("en-IN")}
            </Text>
            {product.originalPrice && (
              <Text
                style={[
                  styles.originalPrice,
                  {
                    color: colors.warmGray,
                    fontFamily: "DMSans_400Regular",
                  },
                ]}
              >
                {APP_CURRENCY}{product.originalPrice.toLocaleString("en-IN")}
              </Text>
            )}
          </View>

          {/* Description */}
          <Text
            style={[
              styles.description,
              {
                color: colors.warmGray,
                fontFamily: "CormorantGaramond_400Regular_Italic",
              },
            ]}
          >
            {product.description}
          </Text>

          {/* Occasions */}
          <View style={styles.occasionRow}>
            {product.occasions.map((o) => (
              <View
                key={o}
                style={[
                  styles.occasionTag,
                  {
                    backgroundColor: colors.champagne,
                    borderColor: colors.midGray,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.occasionTagText,
                    { color: colors.warmGray, fontFamily: "DMSans_400Regular" },
                  ]}
                >
                  {o}
                </Text>
              </View>
            ))}
          </View>

          {/* Delivery & trust */}
          <View
            style={[
              styles.trustSection,
              { backgroundColor: colors.pearl, borderColor: colors.midGray },
            ]}
          >
            {[
              { icon: "truck", text: "Ships in 3–5 days" },
              { icon: "refresh-cw", text: `Free returns ${JEWELERY_MODULE_CONFIG.returnPolicyDays} days` },
              { icon: "award", text: "Hallmark certified" },
              { icon: "gift", text: "Gift box included" },
            ].map((t) => (
              <View key={t.text} style={styles.trustItem}>
                <Feather name={t.icon as any} size={13} color={colors.gold} />
                <Text
                  style={[
                    styles.trustText,
                    {
                      color: colors.warmGray,
                      fontFamily: "DMSans_400Regular",
                    },
                  ]}
                >
                  {t.text}
                </Text>
              </View>
            ))}
          </View>

          {/* Craftsmanship */}
          <View
            style={[styles.craftSection, { borderTopColor: colors.midGray }]}
          >
            <Text
              style={[
                styles.craftLabel,
                { color: colors.gold, fontFamily: "DMSans_500Medium" },
              ]}
            >
              CRAFTSMANSHIP DETAILS
            </Text>
            <View style={styles.specGrid}>
              {[
                { key: "Metal", val: product.metal },
                product.stone ? { key: "Stone", val: product.stone } : null,
                product.weight ? { key: "Weight", val: product.weight } : null,
                { key: "Purity", val: product.purity ?? "22K BIS Hallmarked" },
              ]
                .filter(Boolean)
                .map((spec) => (
                  <View key={spec!.key} style={styles.specItem}>
                    <Text
                      style={[
                        styles.specKey,
                        {
                          color: colors.warmGray,
                          fontFamily: "DMSans_400Regular",
                        },
                      ]}
                    >
                      {spec!.key}
                    </Text>
                    <Text
                      style={[
                        styles.specVal,
                        { color: colors.ink, fontFamily: "DMSans_500Medium" },
                      ]}
                    >
                      {spec!.val}
                    </Text>
                  </View>
                ))}
            </View>
            <Text
              style={[
                styles.craftDetail,
                {
                  color: colors.warmGray,
                  fontFamily: "CormorantGaramond_400Regular_Italic",
                },
              ]}
            >
              {product.craftDetail}
            </Text>
          </View>

          {/* Related products */}
          {related.length > 0 && (
            <View style={styles.relatedSection}>
              <Text
                style={[
                  styles.relatedLabel,
                  { color: colors.gold, fontFamily: "DMSans_500Medium" },
                ]}
              >
                YOU MAY ALSO LOVE
              </Text>
              <Text
                style={[
                  styles.relatedTitle,
                  {
                    color: colors.ink,
                    fontFamily: "CormorantGaramond_500Medium_Italic",
                  },
                ]}
              >
                Complete the Look
              </Text>
              <View style={styles.relatedGrid}>
                {related.map((p: JeweleryProduct) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </View>
            </View>
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Sticky bottom bar */}
      <View
        style={[
          styles.stickyBar,
          {
            backgroundColor: colors.ivory,
            borderTopColor: colors.midGray,
            paddingBottom: bottomPad + 12,
          },
        ]}
      >
        <Pressable
          style={[styles.wishlistStickyBtn, { borderColor: colors.midGray }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            toggleWishlist(product);
          }}
        >
          <Feather
            name="heart"
            size={18}
            color={wishlisted ? colors.gold : colors.ink}
          />
        </Pressable>
        {canTryOn && (
          <Pressable
            onPress={handleTryOn}
            style={({ pressed }) => [
              styles.tryOnBtn,
              {
                borderColor: colors.gold,
                backgroundColor: pressed ? colors.champagne : "transparent",
              },
            ]}
          >
            <Feather name="camera" size={16} color={colors.gold} />
            <Text
              style={[
                styles.tryOnText,
                { color: colors.gold, fontFamily: "DMSans_500Medium" },
              ]}
            >
              Try Live
            </Text>
          </Pressable>
        )}
        <Pressable
          onPress={
            isInCart
              ? () => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/jewelery/(tabs)/cart" as any);
                }
              : handleAddToCart
          }
          style={({ pressed }) => [
            styles.addToCartBtn,
            {
              backgroundColor: isInCart
                ? pressed
                  ? colors.goldLight
                  : colors.emerald
                : addedToCart
                  ? colors.emerald
                  : pressed
                    ? colors.goldLight
                    : colors.gold,
            },
          ]}
        >
          <Feather
            name={isInCart ? "arrow-right" : addedToCart ? "check" : "shopping-bag"}
            size={16}
            color={colors.onBrand}
          />
          <Text
            style={[
              styles.addToCartText,
              { color: colors.onBrand, fontFamily: "DMSans_500Medium" },
            ]}
          >
            {isInCart
              ? "Go to Cart →"
              : addedToCart
                ? "Added to Bag"
                : "Add to Bag"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  notFound: { textAlign: "center", marginTop: 100, fontSize: 16 },
  backBtn: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 10,
  },
  backBtnInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 20,
    gap: 14,
  },
  breadcrumb: { fontSize: 10, letterSpacing: 0.5 },
  productName: {
    fontSize: 30,
    lineHeight: 36,
  },
  starsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: { fontSize: 11, marginLeft: 4 },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  price: { fontSize: 24 },
  originalPrice: {
    fontSize: 14,
    textDecorationLine: "line-through",
  },
  description: { fontSize: 16, lineHeight: 26 },
  occasionRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  occasionTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 0.5,
  },
  occasionTagText: { fontSize: 10, letterSpacing: 0.3 },
  trustSection: {
    borderWidth: 0.5,
    borderRadius: 2,
    padding: 14,
    gap: 10,
  },
  trustItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  trustText: { fontSize: 12 },
  craftSection: {
    borderTopWidth: 0.5,
    paddingTop: 16,
    gap: 12,
  },
  craftLabel: { fontSize: 9, letterSpacing: 2 },
  specGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  specItem: { width: "47%" },
  specKey: { fontSize: 10, letterSpacing: 0.5 },
  specVal: { fontSize: 13, marginTop: 2 },
  craftDetail: { fontSize: 14, lineHeight: 22 },
  relatedSection: { gap: 10 },
  relatedLabel: { fontSize: 9, letterSpacing: 2 },
  relatedTitle: { fontSize: 22, lineHeight: 28 },
  relatedGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between",
  },
  stickyBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 14,
    gap: 12,
    borderTopWidth: 0.5,
  },
  wishlistStickyBtn: {
    width: 48,
    height: 52,
    borderWidth: 1,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  tryOnBtn: {
    height: 52,
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  tryOnText: { fontSize: 12, letterSpacing: 1.1 },
  addToCartBtn: {
    flex: 1,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 2,
  },
  addToCartText: { fontSize: 13, letterSpacing: 1.5 },
});
