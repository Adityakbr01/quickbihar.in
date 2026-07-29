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
  const { data: wishlistData, isLoading, refetch } = useWishlist();
  const toggleWishlist = useWishlistStore((state) => state.toggleItem);
  const wishlistIds = useWishlistStore((state) => state.items);

  const items = (wishlistData || []).filter((item: any) => {
    const id = item.product?._id || item._id;
    return wishlistIds.includes(id);
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeViewWrapper>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>My Wishlist</Text>
          </View>
          <Text style={styles.itemCount}>{items.length} Items</Text>
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
            >
              <Text style={styles.shopBtnText}>CONTINUE SHOPPING</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isLoading} onRefresh={refetch} />
            }
          >
            <View style={styles.grid}>
              {items.map((item: any) => {
                const product = item.product || item;
                // Basic check for real product vs ID fallback
                if (!product?.title && !product?._id) return null;

                return (
                  <TouchableOpacity
                    key={product._id}
                    style={styles.card}
                    onPress={() =>
                      router.push({
                        pathname: "/product/[id]",
                        params: { id: product._id },
                      })
                    }
                  >
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => toggleWishlist(product._id)}
                    >
                      <Ionicons name="close" size={18} color="#000" />
                    </TouchableOpacity>

                    <Image
                      source={{
                        uri: product.images?.[0]?.url || "https://placeholder.com/150",
                      }}
                      style={styles.image}
                      resizeMode="cover"
                    />

                    <View style={styles.info}>
                      <Text style={styles.brand} numberOfLines={1}>
                        {product.brand || "QuickBihar"}
                      </Text>
                      <Text style={styles.title} numberOfLines={1}>
                        {product.title || "Product Title"}
                      </Text>
                      <View style={styles.priceRow}>
                        <Text style={styles.price}>₹{product.price}</Text>
                        {product.originalPrice && (
                          <Text style={styles.originalPrice}>
                            ₹{product.originalPrice}
                          </Text>
                        )}
                        {product.discountPercentage > 0 && (
                          <Text style={styles.discount}>
                            ({Math.round(product.discountPercentage)}% OFF)
                          </Text>
                        )}
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
