import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import SafeViewWrapper from "@/src/provider/SafeViewWrapper";

import { jeweleryColors } from "../constants/jeweleryColors";
import { products as jeweleryProducts, Product as JeweleryProduct } from "../data/products";

export const JeweleryTryOnScreen = () => {
  const [selectedProduct, setSelectedProduct] = useState(jeweleryProducts[0]);
  const [cameraActive, setCameraActive] = useState(true);

  return (
    <SafeViewWrapper>
      <View style={[styles.root, { backgroundColor: jeweleryColors.ink }]}>
        {/* Top Header */}
        <View style={styles.header}>
          <Pressable style={styles.closeBtn} onPress={() => router.back()}>
            <Ionicons name="close" size={22} color="#FFF" />
          </Pressable>
          <Text style={styles.headerTitle}>Virtual AR Mirror 🪞</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* AR Viewport Placeholder */}
        <View style={styles.viewport}>
          <Image
            source={{ uri: selectedProduct.image }}
            style={styles.arOverlayImage}
            contentFit="contain"
          />
          <View style={styles.arFrameBadge}>
            <Ionicons
              name="sparkles"
              size={14}
              color={jeweleryColors.goldLight}
            />
            <Text style={styles.arFrameText}>AR Alignment: Live</Text>
          </View>
        </View>

        {/* Product Switcher Bar */}
        <View
          style={[
            styles.bottomPanel,
            { backgroundColor: jeweleryColors.pearl },
          ]}
        >
          <Text style={[styles.panelTitle, { color: jeweleryColors.ink }]}>
            Try On Ornaments Live
          </Text>
          <View style={styles.carouselRow}>
            {jeweleryProducts.map((p: JeweleryProduct) => {
              const isSelected = p.id === selectedProduct.id;
              return (
                <Pressable
                  key={p.id}
                  style={[
                    styles.thumbCard,
                    isSelected && {
                      borderColor: jeweleryColors.gold,
                      borderWidth: 2,
                    },
                  ]}
                  onPress={() => setSelectedProduct(p)}
                >
                  <Image
                    source={{ uri: p.image }}
                    style={styles.thumbImage}
                    contentFit="cover"
                  />
                  <Text
                    style={[styles.thumbName, { color: jeweleryColors.ink }]}
                    numberOfLines={1}
                  >
                    {p.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Action Row */}
          <View style={styles.actionRow}>
            <Pressable
              style={[styles.actionBtn, { borderColor: jeweleryColors.gold }]}
            >
              <Ionicons
                name="camera-outline"
                size={18}
                color={jeweleryColors.gold}
              />
              <Text
                style={[styles.actionBtnText, { color: jeweleryColors.gold }]}
              >
                Capture Photo
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.addBagBtn,
                { backgroundColor: jeweleryColors.gold },
              ]}
              onPress={() =>
                router.push(`/jewelery/product/${selectedProduct.id}` as any)
              }
            >
              <Text style={styles.addBagText}>View Item Details →</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeViewWrapper>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  viewport: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  arOverlayImage: {
    width: "70%",
    height: "70%",
  },
  arFrameBadge: {
    position: "absolute",
    top: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  arFrameText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "600",
  },
  bottomPanel: {
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    gap: 12,
  },
  panelTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  carouselRow: {
    flexDirection: "row",
    gap: 10,
  },
  thumbCard: {
    width: 80,
    borderRadius: 6,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "transparent",
  },
  thumbImage: {
    width: "100%",
    height: 60,
  },
  thumbName: {
    fontSize: 9,
    fontWeight: "700",
    padding: 4,
    textAlign: "center",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },
  addBagBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 6,
  },
  addBagText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700",
  },
});
