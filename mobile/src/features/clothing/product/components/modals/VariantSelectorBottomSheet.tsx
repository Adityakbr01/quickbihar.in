import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Theme } from "@/src/theme/Provider/ThemeProvider";
import { IProduct } from "../../types/product.types";
import { useCartStore } from "@/src/features/common/cart/store/cartStore";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import { useRouter } from "expo-router";

import SizeChartModal from "./SizeChartModal";
import { useSizeChart, useSizeCharts } from "@/src/features/clothing/sizeChart/hooks/useSizeCharts";
import {
  Sheet,
  SheetFooter,
  useSheet,
} from "@/src/components/common/BottomSheet";

interface VariantSelectorBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  product: IProduct | any;
  theme: Theme | any;
}

export const VariantSelectorBottomSheet = ({
  visible,
  onClose,
  product,
  theme,
}: VariantSelectorBottomSheetProps) => {
  const router = useRouter();
  const { addItem, isLoading: isAddingToCart, items: cartItems } = useCartStore();
  const sheet = useSheet();

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [showSizeChart, setShowSizeChart] = useState(false);

  // ── Backend Size Chart Resolution ──
  const sizeChartIdString =
    typeof product.sizeChartId === "string" ? product.sizeChartId : undefined;
  const { data: fetchedSizeChart } = useSizeChart(sizeChartIdString || "");
  const { data: allBackendSizeCharts } = useSizeCharts();

  const activeSizeChart = useMemo(() => {
    if (
      product.sizeChartId &&
      typeof product.sizeChartId === "object" &&
      product.sizeChartId.data
    ) {
      return product.sizeChartId;
    }
    if (fetchedSizeChart && fetchedSizeChart.data) {
      return fetchedSizeChart;
    }
    if (allBackendSizeCharts && allBackendSizeCharts.length > 0) {
      const categoryMatch = allBackendSizeCharts.find(
        (c: any) =>
          c.category?.toLowerCase() === product.subCategory?.toLowerCase() ||
          c.category?.toLowerCase() === product.category?.toLowerCase() ||
          c.name
            ?.toLowerCase()
            .includes(product.category?.toLowerCase() || ""),
      );
      if (categoryMatch) return categoryMatch;
      const globalChart = allBackendSizeCharts.find(
        (c: any) =>
          c.category?.toLowerCase() === "clothing" || c.scope === "GLOBAL",
      );
      if (globalChart) return globalChart;
    }
    return null;
  }, [
    product.sizeChartId,
    fetchedSizeChart,
    allBackendSizeCharts,
    product.category,
    product.subCategory,
  ]);

  // ── Derived State ──
  const uniqueColors = useMemo(() => {
    if (!product.variants) return [];
    return Array.from(
      new Set(
        product.variants.map((v: any) =>
          v?.color ? String(v.color).trim() : "",
        ).filter(Boolean),
      ),
    ) as string[];
  }, [product.variants]);

  // Set default color
  useEffect(() => {
    if (uniqueColors.length > 0 && !selectedColor) {
      setSelectedColor(uniqueColors[0]);
    }
  }, [uniqueColors, selectedColor]);

  // Sizes available for the selected color
  const sizesForColor = useMemo(() => {
    if (!product.variants || !selectedColor) return [];
    return product.variants.filter(
      (v: any) =>
        (v?.color ? String(v.color).trim() : "") === selectedColor,
    );
  }, [product.variants, selectedColor]);

  // Auto-select size if there's only one option
  useEffect(() => {
    if (sizesForColor.length === 1) {
      setSelectedSize(sizesForColor[0].size);
    } else {
      setSelectedSize(null);
    }
  }, [sizesForColor]);

  const selectedVariant = useMemo(() => {
    return product.variants?.find(
      (v: any) =>
        (!selectedColor ||
          (v?.color ? String(v.color).trim() : "") === selectedColor) &&
        (!selectedSize || String(v?.size || "") === String(selectedSize)),
    );
  }, [product.variants, selectedColor, selectedSize]);

  // Cart logic
  const hasSizes = sizesForColor.length > 0;
  const hasColors = uniqueColors.length > 0;
  const isSelectionComplete =
    (!hasSizes || selectedSize !== null) &&
    (!hasColors || selectedColor !== null);

  const isInCart = useMemo(() => {
    if (!isSelectionComplete || !selectedVariant) return false;
    return cartItems.some((item) => item.sku === selectedVariant.sku);
  }, [isSelectionComplete, selectedVariant, cartItems]);

  const isOutOfStock = useMemo(() => {
    if ((product.totalStock ?? 0) <= 0) return true;
    if (
      selectedSize &&
      selectedVariant &&
      (selectedVariant.stock ?? 0) <= 0
    )
      return true;
    return false;
  }, [product.totalStock, selectedSize, selectedVariant]);

  // Imperative present/dismiss from the parent `visible` prop.
  useEffect(() => {
    if (visible) {
      sheet.current?.present();
    } else {
      sheet.current?.dismiss();
    }
  }, [visible, sheet]);

  const handleConfirm = async () => {
    if (isInCart) {
      onClose();
      router.push("/clothing/cart");
      return;
    }

    if (!selectedSize && sizesForColor.length > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({
        type: "error",
        text1: "Select Size",
        text2: "Please select a size first",
        props: { id: Date.now() },
      });
      return;
    }

    const variant = selectedVariant || product.variants?.[0];
    const sku = variant?.sku || "default-sku";

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await addItem(product, sku, 1);
      Toast.show({
        type: "success",
        text1: "Added to Bag",
        text2: `${product.title} added to your bag`,
        props: { id: Date.now() },
      });
      onClose();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to add item to bag",
        props: { id: Date.now() },
      });
    }
  };

  const discount =
    product.discountPercentage ||
    (product.originalPrice && product.price
      ? Math.floor((1 - product.price / product.originalPrice) * 100)
      : 0);

  const productPrice = product.isGstApplicable
    ? product.price * (1 + product.gstPercentage / 100)
    : product.price;

  return (
    <>
      <Sheet
        ref={sheet}
        
        onDidDismiss={onClose}
        backgroundColor={theme.background}
      >
        {/* Product Header (custom header — has image + price) */}
        <View
          style={[
            s.header,
            { borderBottomColor: theme.border },
          ]}
        >
          <Image
            source={{
              uri: product.images?.[0]?.url || product.image,
            }}
            style={[s.productImage, { borderColor: theme.border }]}
          />
          <View style={s.headerInfo}>
            <Text
              style={[s.brand, { color: theme.secondaryText }]}
              numberOfLines={1}
            >
              {product.brand || "Brand"}
            </Text>
            <Text style={[s.title, { color: theme.text }]} numberOfLines={2}>
              {product.title}
            </Text>
            <View style={s.priceRow}>
              <Text style={[s.price, { color: theme.text }]}>
                ₹{productPrice?.toLocaleString()}
              </Text>
              {product.originalPrice &&
                product.originalPrice > product.price && (
                  <>
                    <Text style={[s.mrp, { color: theme.tertiaryText }]}>
                      ₹{product.originalPrice.toLocaleString()}
                    </Text>
                    <Text style={s.discountText}>
                      {Math.round(discount)}% OFF
                    </Text>
                  </>
                )}
            </View>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={[
              s.closeBtn,
              { backgroundColor: (theme.border ?? "#000") + "40" },
            ]}
          >
            <Ionicons name="close" size={20} color={theme.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.content}
        >
          {/* Color Selection */}
          {uniqueColors.length > 0 && (
            <View style={s.section}>
              <Text style={[s.sectionLabel, { color: theme.text }]}>
                COLOR:{" "}
                <Text
                  style={{
                    color: theme.secondaryText,
                    fontWeight: "normal",
                  }}
                >
                  {selectedColor}
                </Text>
              </Text>
              <View style={s.colorRow}>
                {uniqueColors.map((color) => {
                  const active = selectedColor === color;
                  return (
                    <TouchableOpacity
                      key={color}
                      onPress={() => {
                        setSelectedColor(color);
                        setSelectedSize(null);
                      }}
                      style={[
                        s.colorOption,
                        {
                          borderColor: active ? theme.primary : theme.border,
                          backgroundColor: active
                            ? theme.primary + "1A"
                            : theme.background,
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          s.colorText,
                          {
                            color: active ? theme.primary : theme.text,
                          },
                        ]}
                      >
                        {color}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Size Selection */}
          {sizesForColor.length > 0 && (
            <View style={s.section}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <Text
                  style={[s.sectionLabel, { color: theme.text, marginBottom: 0 }]}
                >
                  SELECT SIZE
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowSizeChart(true);
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Ionicons
                    name="resize-outline"
                    size={14}
                    color={theme.primary}
                  />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "700",
                      color: theme.primary,
                    }}
                  >
                    SIZE GUIDE
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={s.sizeRow}>
                {sizesForColor.map((v: any) => {
                  const active = selectedSize === v.size;
                  const oos = v.stock === 0;
                  return (
                    <TouchableOpacity
                      key={v.sku}
                      disabled={oos}
                      onPress={() => setSelectedSize(v.size)}
                      style={[
                        s.sizeCircle,
                        {
                          borderColor: active
                            ? theme.primary
                            : oos
                              ? theme.border
                              : theme.border,
                          backgroundColor: active
                            ? theme.primary
                            : theme.background,
                        },
                        oos && s.sizeCircleOOS,
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          s.sizeText,
                          {
                            color: active
                              ? "#fff"
                              : oos
                                ? theme.tertiaryText
                                : theme.text,
                          },
                        ]}
                      >
                        {v.size}
                      </Text>
                      {oos && (
                        <View
                          style={[
                            s.oosLine,
                            { backgroundColor: theme.tertiaryText },
                          ]}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Low Stock Warning */}
              {selectedSize &&
                sizesForColor.find((v: any) => v.size === selectedSize)
                  ?.stock! <= 5 && (
                  <View style={s.lowStockRow}>
                    <Ionicons name="flash" size={14} color={theme.warning} />
                    <Text
                      style={[s.lowStockText, { color: theme.warning }]}
                    >
                      Only{" "}
                      {
                        sizesForColor.find(
                          (v: any) => v.size === selectedSize,
                        )?.stock
                      }{" "}
                      items left!
                    </Text>
                  </View>
                )}
            </View>
          )}
        </ScrollView>

        {/* Action footer */}
        <SheetFooter>
          {(() => {
            const buttonDisabled =
              isAddingToCart ||
              !isSelectionComplete ||
              (isOutOfStock && !isInCart);

            let buttonText = "ADD TO BAG";
            let buttonIcon = "bag-handle-outline";

            if (isInCart) {
              buttonText = "GO TO CART";
              buttonIcon = "arrow-forward-outline";
            } else if (isOutOfStock) {
              buttonText = "OUT OF STOCK";
              buttonIcon = "close-circle-outline";
            } else if (!isSelectionComplete) {
              if (hasColors && !selectedColor) {
                buttonText = "SELECT COLOR";
                buttonIcon = "color-palette-outline";
              } else if (hasSizes && !selectedSize) {
                buttonText = "SELECT SIZE";
                buttonIcon = "resize-outline";
              }
            }

            return (
              <TouchableOpacity
                onPress={handleConfirm}
                disabled={buttonDisabled}
                style={[
                  s.actionBtn,
                  {
                    backgroundColor: isInCart
                      ? theme.primary
                      : buttonDisabled
                        ? theme.secondaryText || "#9ca3af"
                        : theme.primary,
                    opacity: isAddingToCart ? 0.7 : 1,
                    width: "100%",
                  },
                ]}
                activeOpacity={0.8}
              >
                {isAddingToCart ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons
                      name={buttonIcon as any}
                      size={20}
                      color="#fff"
                    />
                    <Text style={s.actionBtnText}>{buttonText}</Text>
                  </>
                )}
              </TouchableOpacity>
            );
          })()}
        </SheetFooter>
      </Sheet>

      <SizeChartModal
        visible={showSizeChart}
        onClose={() => setShowSizeChart(false)}
        sizeChart={activeSizeChart}
        selectedSize={selectedSize}
        category={product?.category || product?.subCategory}
        theme={theme}
      />
    </>
  );
};

const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 4,
    borderBottomWidth: 1,
    alignItems: "center",
  },
  productImage: {
    width: 70,
    height: 85,
    borderRadius: 8,
    borderWidth: 1,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 16,
    marginRight: 8,
    justifyContent: "center",
  },
  brand: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 2,
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 6,
    gap: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: "800",
  },
  mrp: {
    fontSize: 12,
    textDecorationLine: "line-through",
  },
  discountText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FF3B30",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 12,
  },
  colorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  colorOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  colorText: {
    fontSize: 13,
    fontWeight: "600",
  },
  sizeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  sizeCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  sizeCircleOOS: {
    opacity: 0.6,
  },
  sizeText: {
    fontSize: 14,
    fontWeight: "700",
  },
  oosLine: {
    position: "absolute",
    width: "140%",
    height: 1.5,
    transform: [{ rotate: "45deg" }],
  },
  lowStockRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 6,
  },
  lowStockText: {
    fontSize: 12,
    fontWeight: "600",
  },
  actionBtn: {
    height: 48,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  actionBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
