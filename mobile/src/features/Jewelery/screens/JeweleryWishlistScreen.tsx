import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ProductCard } from "@/src/features/Jewelery/components/ProductCard";
import { products } from "@/src/features/Jewelery/data/products";
import { useCart } from "@/src/features/Jewelery/context/CartContext";
import { useColors } from "@/src/features/Jewelery/hooks/useColors";

export default function JeweleryWishlistScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { wishlist } = useCart();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const wishlisted = products.filter((p) => wishlist.includes(p.id));

  return (
    <View style={[styles.root, { backgroundColor: colors.ivory }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 12,
            backgroundColor: colors.ivory,
            borderBottomColor: colors.midGray,
          },
        ]}
      >
        <Text
          style={[
            styles.headerTitle,
            { color: colors.ink, fontFamily: "CormorantGaramond_600SemiBold" },
          ]}
        >
          Wishlist
        </Text>
        <Text
          style={[
            styles.headerCount,
            { color: colors.warmGray, fontFamily: "DMSans_400Regular" },
          ]}
        >
          {wishlisted.length} piece{wishlisted.length !== 1 ? "s" : ""}
        </Text>
      </View>

      {wishlisted.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="heart" size={40} color={colors.midGray} />
          <Text
            style={[
              styles.emptyTitle,
              {
                color: colors.ink,
                fontFamily: "CormorantGaramond_500Medium_Italic",
              },
            ]}
          >
            Save for later, dream about now.
          </Text>
          <Text
            style={[
              styles.emptyBody,
              { color: colors.warmGray, fontFamily: "DMSans_400Regular" },
            ]}
          >
            Tap the heart icon on any piece to save it here.
          </Text>
          <Pressable
            style={[styles.browseBtn, { borderColor: colors.gold }]}
            onPress={() => router.push("/jewelery/collections" as any)}
          >
            <Text
              style={[
                styles.browseBtnText,
                { color: colors.gold, fontFamily: "DMSans_400Regular" },
              ]}
            >
              Browse Collections →
            </Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            Platform.OS === "web" && { paddingBottom: 34 },
          ]}
        >
          <View style={styles.productGrid}>
            {wishlisted.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 0.5,
  },
  headerTitle: {
    fontSize: 22,
    letterSpacing: 3,
  },
  headerCount: {
    fontSize: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 14,
  },
  emptyTitle: {
    fontSize: 22,
    textAlign: "center",
    lineHeight: 30,
  },
  emptyBody: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
  browseBtn: {
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 1,
    marginTop: 8,
  },
  browseBtnText: {
    fontSize: 12,
    letterSpacing: 1,
  },
  scrollContent: {
    padding: 16,
  },
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between",
  },
});
