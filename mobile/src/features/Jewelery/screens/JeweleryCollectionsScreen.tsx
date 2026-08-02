import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ProductCard } from "@/src/features/Jewelery/components/ProductCard";
import { collections } from "@/src/features/Jewelery/data/collections";
import { products } from "@/src/features/Jewelery/data/products";
import { useColors } from "@/src/features/Jewelery/hooks/useColors";

const collectionTabs = [
  "All",
  "Bridal",
  "Everyday Luxury",
  "Festive Edit",
  "Statement Pieces",
  "Contemporary Ethnic",
];

export default function JeweleryCollectionsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState("All");
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const filtered =
    activeTab === "All"
      ? products
      : products.filter((p) => p.collection === activeTab);

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
          Collections
        </Text>
        <Pressable onPress={() => router.push("/jewelery/search" as any)} hitSlop={8}>
          <Feather name="search" size={20} color={colors.ink} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[Platform.OS === "web" && { paddingBottom: 34 }]}
      >
        {/* Collections hero grid */}
        <View style={[styles.section, { backgroundColor: colors.pearl }]}>
          <Text
            style={[
              styles.sectionLabel,
              { color: colors.gold, fontFamily: "DMSans_500Medium" },
            ]}
          >
            OUR WORLD
          </Text>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: colors.ink,
                fontFamily: "CormorantGaramond_400Regular_Italic",
              },
            ]}
          >
            Five worlds. One story.
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.collectionScroll}
          >
            {collections.map((c) => (
              <Pressable
                key={c.id}
                style={({ pressed }) => [
                  styles.collectionChip,
                  {
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
                onPress={() => setActiveTab(c.name)}
              >
                <Image
                  source={c.image}
                  style={styles.collectionChipImage}
                  resizeMode="cover"
                />
                <View style={styles.collectionChipOverlay} />
                <View style={styles.collectionChipContent}>
                  <Text
                    style={[
                      styles.collectionChipName,
                      {
                        color: "#F7F3EC",
                        fontFamily: "CormorantGaramond_500Medium_Italic",
                      },
                    ]}
                  >
                    {c.name}
                  </Text>
                  <Text
                    style={[
                      styles.collectionChipCount,
                      {
                        color: "rgba(247,243,236,0.7)",
                        fontFamily: "DMSans_400Regular",
                      },
                    ]}
                  >
                    {c.pieceCount} pieces
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Filter tabs */}
        <View
          style={[
            styles.filterBar,
            {
              backgroundColor: colors.ivory,
              borderBottomColor: colors.midGray,
            },
          ]}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {collectionTabs.map((tab) => (
              <Pressable
                key={tab}
                style={[
                  styles.filterTab,
                  {
                    borderBottomWidth: activeTab === tab ? 1.5 : 0,
                    borderBottomColor: colors.gold,
                  },
                ]}
                onPress={() => setActiveTab(tab)}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    {
                      color: activeTab === tab ? colors.gold : colors.warmGray,
                      fontFamily:
                        activeTab === tab
                          ? "DMSans_500Medium"
                          : "DMSans_400Regular",
                    },
                  ]}
                >
                  {tab}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Product grid */}
        <View
          style={[styles.productsSection, { backgroundColor: colors.ivory }]}
        >
          <View style={styles.productGrid}>
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </View>
          {filtered.length === 0 && (
            <View style={styles.emptyState}>
              <Feather name="package" size={32} color={colors.midGray} />
              <Text
                style={[
                  styles.emptyText,
                  { color: colors.warmGray, fontFamily: "DMSans_400Regular" },
                ]}
              >
                No pieces found in this collection
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
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
  section: {
    padding: 20,
    gap: 12,
  },
  sectionLabel: {
    fontSize: 9,
    letterSpacing: 2,
  },
  sectionTitle: {
    fontSize: 24,
    lineHeight: 30,
  },
  collectionScroll: {
    gap: 10,
    paddingRight: 4,
  },
  collectionChip: {
    width: 140,
    height: 180,
    borderRadius: 2,
    overflow: "hidden",
    position: "relative",
  },
  collectionChipImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  collectionChipOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(26,22,20,0.32)",
  },
  collectionChipContent: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
  },
  collectionChipName: {
    fontSize: 16,
    lineHeight: 20,
  },
  collectionChipCount: {
    fontSize: 10,
    marginTop: 2,
  },
  filterBar: {
    borderBottomWidth: 0.5,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 0,
  },
  filterTab: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginRight: 4,
  },
  filterTabText: {
    fontSize: 12,
    letterSpacing: 0.3,
  },
  productsSection: {
    padding: 16,
  },
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
  },
});
