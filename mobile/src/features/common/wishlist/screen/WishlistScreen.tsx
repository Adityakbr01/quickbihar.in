import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { createWishlistStyles } from "../styles/wishlistStyles";
import { useWishlist } from "../hooks/useWishlist";
import { useWishlistStore } from "../store/wishlistStore";
import SafeViewWrapper from "@/src/provider/SafeViewWrapper";

const WishlistScreen = () => {
  const theme = useTheme() as any;
  const styles = createWishlistStyles(theme);
  const router = useRouter();
  const { data: items = [], isLoading, refetch } = useWishlist();
  const toggleWishlist = useWishlistStore((state) => state.toggleItem);
  const wishlistIds = useWishlistStore((state) => state.items);

  const handleRemove = (productId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleWishlist(productId);
  };

  if (isLoading && items.length === 0 && wishlistIds.length > 0) {
    return (
      <SafeViewWrapper>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeViewWrapper>
    );
  }

  return (
    <SafeViewWrapper>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <TouchableOpacity
              onPress={() => router.back()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>My Wishlist</Text>
          </View>
          <Text style={styles.itemCount}>
            {items.length} {items.length === 1 ? "Item" : "Items"}
          </Text>
        </View>

        {items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-dislike-outline" size={80} color={theme.border} />
            <Text style={styles.emptyTitle}>Your Wishlist is Empty</Text>
            <Text style={styles.emptySubtitle}>
              Save items you love here and they'll be waiting for you when you're
              ready to buy.
            </Text>
            <TouchableOpacity
              style={styles.shopBtn}
              onPress={() => router.push("/")}
              activeOpacity={0.8}
            >
              <Text style={styles.shopBtnText}>CONTINUE SHOPPING</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={refetch}
                tintColor={theme.primary}
                colors={[theme.primary]}
              />
            }
          >
            <View style={styles.grid}>
              {items.map((item: any) => {
                const product = item.product || item;
                const pId = String(product._id || product.id || "");
                // Canonical slug URL for navigation (store keys stay id-based for server sync).
                const navId = String(product.slug || product._id || product.id || "");
                if (!pId) return null;

                const imageUrl =
                  product.images?.[0]?.url ||
                  (typeof product.images?.[0] === "string"
                    ? product.images[0]
                    : null) ||
                  product.image ||
                  "https://via.placeholder.com/300x400";

                const rawDiscount =
                  product.discountPercentage ||
                  (product.originalPrice && product.price && product.originalPrice > product.price
                    ? ((product.originalPrice - product.price) / product.originalPrice) * 100
                    : 0);
                const discount = Math.round(Number(rawDiscount) || 0);

                return (
                  <TouchableOpacity
                    key={pId}
                    style={styles.card}
                    activeOpacity={0.88}
                    onPress={() =>
                      router.push({
                        pathname: "/product/[id]",
                        params: { id: navId },
                      })
                    }
                  >
                    {/* Image Container with Top-Left Discount Badge & Top-Right Remove Button */}
                    <View style={styles.imageContainer}>
                      <Image
                        source={{ uri: imageUrl }}
                        style={styles.image}
                        resizeMode="cover"
                      />

                      {discount > 0 && (
                        <View style={styles.discountBadge}>
                          <Text style={styles.discountText}>{discount}% OFF</Text>
                        </View>
                      )}

                      <TouchableOpacity
                        style={styles.removeBtn}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleRemove(pId);
                        }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="close" size={16} color="#000" />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.info}>
                      <Text style={styles.brand} numberOfLines={1}>
                        {product.brand || "QuickBihar"}
                      </Text>
                      <Text style={styles.title} numberOfLines={1}>
                        {product.title || product.name || "Fashion Item"}
                      </Text>
                      <View style={styles.priceRow}>
                        <Text style={styles.price}>
                          ₹{(product.price || 0).toLocaleString()}
                        </Text>
                        {product.originalPrice &&
                        product.originalPrice > product.price ? (
                          <Text style={styles.originalPrice}>
                            ₹{product.originalPrice.toLocaleString()}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        )}
      </View>
    </SafeViewWrapper>
  );
};

export default WishlistScreen;
