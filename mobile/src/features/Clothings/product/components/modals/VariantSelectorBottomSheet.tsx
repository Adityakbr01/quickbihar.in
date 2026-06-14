import React, { useState, useMemo, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Pressable,
  Platform,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Theme } from "@/src/theme/Provider/ThemeProvider";
import { IProduct } from "../../types/product.types";
import { useCartStore } from "../../../cart/store/cartStore";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import { useRouter } from "expo-router";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

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

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  // ── Derived State ──
  const uniqueColors = useMemo(() => {
    if (!product.variants) return [];
    return Array.from(new Set(product.variants.map((v: any) => v.color.trim()).filter(Boolean))) as string[];
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
    return product.variants.filter((v: any) => v.color.trim() === selectedColor);
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
        (!selectedColor || v.color.trim() === selectedColor) &&
        (!selectedSize || v.size === selectedSize)
    );
  }, [product.variants, selectedColor, selectedSize]);

  // Cart logic
  const hasSizes = sizesForColor.length > 0;
  const hasColors = uniqueColors.length > 0;
  const isSelectionComplete =
    (!hasSizes || selectedSize !== null) && (!hasColors || selectedColor !== null);

  const isInCart = useMemo(() => {
    if (!isSelectionComplete || !selectedVariant) return false;
    return cartItems.some((item) => item.sku === selectedVariant.sku);
  }, [isSelectionComplete, selectedVariant, cartItems]);

  const isOutOfStock = useMemo(() => {
    if ((product.totalStock ?? 0) <= 0) return true;
    if (selectedSize && selectedVariant && (selectedVariant.stock ?? 0) <= 0) return true;
    return false;
  }, [product.totalStock, selectedSize, selectedVariant]);

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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={[s.container, { backgroundColor: theme.background }]} onPress={(e) => e.stopPropagation()}>
          {/* Header handle for bottom sheet aesthetic */}
          <View style={s.handleContainer}>
            <View style={[s.handle, { backgroundColor: theme.border }]} />
          </View>

          {/* Product Header details */}
          <View style={[s.header, { borderBottomColor: theme.border }]}>
            <Image
              source={{ uri: product.images?.[0]?.url || product.image }}
              style={[s.productImage, { borderColor: theme.border }]}
            />
            <View style={s.headerInfo}>
              <Text style={[s.brand, { color: theme.secondaryText }]} numberOfLines={1}>
                {product.brand || "Brand"}
              </Text>
              <Text style={[s.title, { color: theme.text }]} numberOfLines={2}>
                {product.title}
              </Text>
              <View style={s.priceRow}>
                <Text style={[s.price, { color: theme.text }]}>
                  ₹{productPrice?.toLocaleString()}
                </Text>
                {product.originalPrice && product.originalPrice > product.price && (
                  <>
                    <Text style={[s.mrp, { color: theme.tertiaryText }]}>
                      ₹{product.originalPrice.toLocaleString()}
                    </Text>
                    <Text style={s.discountText}>{Math.round(discount)}% OFF</Text>
                  </>
                )}
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={[s.closeBtn, { backgroundColor: theme.border + "40" }]}>
              <Ionicons name="close" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
            {/* Color Selection */}
            {uniqueColors.length > 0 && (
              <View style={s.section}>
                <Text style={[s.sectionLabel, { color: theme.text }]}>
                  COLOR: <Text style={{ color: theme.secondaryText, fontWeight: "normal" }}>{selectedColor}</Text>
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
                            backgroundColor: active ? theme.primary + "1A" : theme.background,
                          },
                        ]}
                        activeOpacity={0.7}
                      >
                        <Text style={[s.colorText, { color: active ? theme.primary : theme.text }]}>
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
                <Text style={[s.sectionLabel, { color: theme.text }]}>SELECT SIZE</Text>
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
                            backgroundColor: active ? theme.primary : theme.background,
                          },
                          oos && s.sizeCircleOOS,
                        ]}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            s.sizeText,
                            {
                              color: active ? "#fff" : oos ? theme.tertiaryText : theme.text,
                            },
                          ]}
                        >
                          {v.size}
                        </Text>
                        {oos && <View style={[s.oosLine, { backgroundColor: theme.tertiaryText }]} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Low Stock Warning */}
                {selectedSize &&
                  sizesForColor.find((v: any) => v.size === selectedSize)?.stock! <= 5 && (
                    <View style={s.lowStockRow}>
                      <Ionicons name="flash" size={14} color={theme.warning} />
                      <Text style={[s.lowStockText, { color: theme.warning }]}>
                        Only {sizesForColor.find((v: any) => v.size === selectedSize)?.stock} items left!
                      </Text>
                    </View>
                  )}
              </View>
            )}
          </ScrollView>

          {/* Action button */}
          <View style={[s.footer, { borderTopColor: theme.border }]}>
            {(() => {
              const buttonDisabled = isAddingToCart || (!isSelectionComplete) || (isOutOfStock && !isInCart);

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
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  {isAddingToCart ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name={buttonIcon as any} size={20} color="#fff" />
                      <Text style={s.actionBtnText}>{buttonText}</Text>
                    </>
                  )}
                </TouchableOpacity>
              );
            })()}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  container: {
    maxHeight: SCREEN_HEIGHT * 0.75,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
  },
  handleContainer: {
    alignItems: "center",
    paddingVertical: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 16,
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
  footer: {
    padding: 20,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
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
