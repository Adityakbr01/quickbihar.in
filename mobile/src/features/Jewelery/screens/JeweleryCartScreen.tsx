import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  APP_CURRENCY,
  JEWELERY_MODULE_CONFIG,
} from "@/src/constants";
import { useTopPad } from "@/src/hooks/useTopPad";
import { useCart } from "@/src/features/Jewelery/context/CartContext";
import { useColors } from "@/src/features/Jewelery/hooks/useColors";

export default function JeweleryCartScreen() {
  const colors = useColors();
  const topPad = useTopPad();
  const { cartItems, cartCount, removeFromCart, updateQuantity, cartTotal } =
    useCart();
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleCheckout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push("/checkout" as any);
  };

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
            {
              color: colors.ink,
              fontFamily: "CormorantGaramond_600SemiBold",
            },
          ]}
        >
          Your Bag
        </Text>
        <Text
          style={[
            styles.headerCount,
            { color: colors.warmGray, fontFamily: "DMSans_400Regular" },
          ]}
        >
          {cartCount} item{cartCount !== 1 ? "s" : ""}
        </Text>
      </View>

      {cartItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="shopping-bag" size={40} color={colors.midGray} />
          <Text
            style={[
              styles.emptyTitle,
              {
                color: colors.ink,
                fontFamily: "CormorantGaramond_500Medium_Italic",
              },
            ]}
          >
            Your cart is quiet.{"\n"}Let's change that.
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
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Gift option */}
            <View
              style={[
                styles.giftOption,
                {
                  backgroundColor: colors.champagne,
                  borderColor: colors.gold,
                },
              ]}
            >
              <Feather name="gift" size={16} color={colors.gold} />
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.giftTitle,
                    {
                      color: colors.ink,
                      fontFamily: "CormorantGaramond_500Medium_Italic",
                    },
                  ]}
                >
                  Add gift packaging
                </Text>
                <Text
                  style={[
                    styles.giftSub,
                    {
                      color: colors.warmGray,
                      fontFamily: "DMSans_400Regular",
                    },
                  ]}
                >
                  Signature ivory & gold box — complimentary
                </Text>
              </View>
              <Feather name="chevron-right" size={16} color={colors.gold} />
            </View>

            {/* Cart items */}
            {cartItems.map(({ product, quantity }) => (
              <View
                key={product.id}
                style={[
                  styles.cartItem,
                  {
                    backgroundColor: colors.pearl,
                    borderBottomColor: colors.midGray,
                  },
                ]}
              >
                <Image
                  source={product.image}
                  style={styles.itemImage}
                  resizeMode="cover"
                />
                <View style={styles.itemContent}>
                  <Text
                    style={[
                      styles.itemName,
                      {
                        color: colors.ink,
                        fontFamily: "CormorantGaramond_500Medium_Italic",
                      },
                    ]}
                  >
                    {product.name}
                  </Text>
                  <Text
                    style={[
                      styles.itemSub,
                      {
                        color: colors.warmGray,
                        fontFamily: "DMSans_400Regular",
                      },
                    ]}
                  >
                    {product.metal}
                    {product.stone ? ` · ${product.stone}` : ""}
                  </Text>
                  <Text
                    style={[
                      styles.itemPrice,
                      { color: colors.ink, fontFamily: "DMSans_500Medium" },
                    ]}
                  >
                    ₹{product.price.toLocaleString("en-IN")}
                  </Text>
                  <View style={styles.qtyRow}>
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        updateQuantity(product.id, quantity - 1);
                      }}
                      style={[
                        styles.qtyBtn,
                        { borderColor: colors.midGray },
                      ]}
                      hitSlop={6}
                    >
                      <Feather name="minus" size={12} color={colors.ink} />
                    </Pressable>
                    <Text
                      style={[
                        styles.qtyText,
                        { color: colors.ink, fontFamily: "DMSans_500Medium" },
                      ]}
                    >
                      {quantity}
                    </Text>
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        updateQuantity(product.id, quantity + 1);
                      }}
                      style={[
                        styles.qtyBtn,
                        { borderColor: colors.midGray },
                      ]}
                      hitSlop={6}
                    >
                      <Feather name="plus" size={12} color={colors.ink} />
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        removeFromCart(product.id);
                      }}
                      style={{ marginLeft: "auto" }}
                      hitSlop={8}
                    >
                      <Feather
                        name="trash-2"
                        size={14}
                        color={colors.warmGray}
                      />
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}

            {/* Order summary */}
            <View
              style={[
                styles.summarySection,
                { backgroundColor: colors.champagne },
              ]}
            >
              <Text
                style={[
                  styles.summaryLabel,
                  { color: colors.gold, fontFamily: "DMSans_500Medium" },
                ]}
              >
                ORDER SUMMARY
              </Text>
              <View style={styles.summaryRow}>
                <Text
                  style={[
                    styles.summaryKey,
                    {
                      color: colors.warmGray,
                      fontFamily: "DMSans_400Regular",
                    },
                  ]}
                >
                  Subtotal
                </Text>
                <Text
                  style={[
                    styles.summaryVal,
                    { color: colors.ink, fontFamily: "DMSans_500Medium" },
                  ]}
                >
                  ₹{cartTotal.toLocaleString("en-IN")}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text
                  style={[
                    styles.summaryKey,
                    {
                      color: colors.warmGray,
                      fontFamily: "DMSans_400Regular",
                    },
                  ]}
                >
                  Shipping
                </Text>
                <Text
                  style={[
                    styles.summaryVal,
                    { color: colors.gold, fontFamily: "DMSans_400Regular" },
                  ]}
                >
                  {cartTotal >= JEWELERY_MODULE_CONFIG.freeShippingThreshold ? "Free" : `${APP_CURRENCY}199`}
                </Text>
              </View>
              <View
                style={[styles.divider, { backgroundColor: colors.midGray }]}
              />
              <View style={styles.summaryRow}>
                <Text
                  style={[
                    styles.totalKey,
                    { color: colors.ink, fontFamily: "DMSans_500Medium" },
                  ]}
                >
                  Total
                </Text>
                <Text
                  style={[
                    styles.totalVal,
                    { color: colors.ink, fontFamily: "CormorantGaramond_600SemiBold" },
                  ]}
                >
                  {APP_CURRENCY}
                  {(
                    cartTotal + (cartTotal >= JEWELERY_MODULE_CONFIG.freeShippingThreshold ? 0 : 199)
                  ).toLocaleString("en-IN")}
                </Text>
              </View>
              <Text
                style={[
                  styles.emiNote,
                  {
                    color: colors.warmGray,
                    fontFamily: "DMSans_400Regular",
                  },
                ]}
              >
                EMI available from {APP_CURRENCY}
                {Math.round(
                  (cartTotal + (cartTotal >= JEWELERY_MODULE_CONFIG.freeShippingThreshold ? 0 : 199)) / 12
                ).toLocaleString("en-IN")}
                /month
              </Text>
            </View>

            {/* Trust signals */}
            <View style={[styles.trustRow, { borderTopColor: colors.midGray }]}>
              {[
                { icon: "shield", text: "Hallmark Certified" },
                { icon: "refresh-cw", text: "Free Returns 30d" },
                { icon: "gift", text: "Gift Box Included" },
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
          </ScrollView>

          {/* Sticky checkout */}
          <View
            style={[
              styles.checkoutBar,
              {
                backgroundColor: colors.ivory,
                borderTopColor: colors.midGray,
                paddingBottom: bottomPad + 16,
              },
            ]}
          >
            <View>
              <Text
                style={[
                  styles.checkoutTotal,
                  { color: colors.ink, fontFamily: "DMSans_500Medium" },
                ]}
              >
                ₹{(cartTotal + (cartTotal >= 5000 ? 0 : 199)).toLocaleString("en-IN")}
              </Text>
              <Text
                style={[
                  styles.checkoutItems,
                  {
                    color: colors.warmGray,
                    fontFamily: "DMSans_400Regular",
                  },
                ]}
              >
                {cartItems.reduce((s, i) => s + i.quantity, 0)} item
                {cartItems.reduce((s, i) => s + i.quantity, 0) !== 1 ? "s" : ""}
              </Text>
            </View>
            <Pressable
              onPress={handleCheckout}
              style={({ pressed }) => [
                styles.checkoutBtn,
                {
                  backgroundColor: pressed ? colors.goldLight : colors.gold,
                  flex: 1,
                  marginLeft: 16,
                },
              ]}
            >
              <Text
                style={[
                  styles.checkoutBtnText,
                  { color: colors.ivory, fontFamily: "DMSans_500Medium" },
                ]}
              >
                Place Order
              </Text>
            </Pressable>
          </View>
        </>
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
  headerTitle: { fontSize: 22, letterSpacing: 3 },
  headerCount: { fontSize: 12 },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 26,
    textAlign: "center",
    lineHeight: 34,
  },
  browseBtn: {
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 1,
    marginTop: 8,
  },
  browseBtnText: { fontSize: 12, letterSpacing: 1 },
  scrollContent: { paddingBottom: 16 },
  giftOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    margin: 16,
    padding: 14,
    borderWidth: 0.5,
    borderRadius: 2,
  },
  giftTitle: { fontSize: 15 },
  giftSub: { fontSize: 11, marginTop: 2 },
  cartItem: {
    flexDirection: "row",
    padding: 16,
    gap: 14,
    borderBottomWidth: 0.5,
  },
  itemImage: {
    width: 90,
    height: 120,
    borderRadius: 2,
  },
  itemContent: { flex: 1, gap: 4 },
  itemName: { fontSize: 17, lineHeight: 22 },
  itemSub: { fontSize: 11 },
  itemPrice: { fontSize: 15, marginTop: 4 },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: { fontSize: 14, minWidth: 20, textAlign: "center" },
  summarySection: { margin: 16, padding: 16, borderRadius: 2, gap: 8 },
  summaryLabel: { fontSize: 9, letterSpacing: 2, marginBottom: 4 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryKey: { fontSize: 13 },
  summaryVal: { fontSize: 13 },
  divider: { height: 0.5, marginVertical: 4 },
  totalKey: { fontSize: 15 },
  totalVal: { fontSize: 20 },
  emiNote: { fontSize: 10, fontStyle: "italic", marginTop: 4 },
  trustRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 16,
    borderTopWidth: 0.5,
    marginHorizontal: 16,
  },
  trustItem: { alignItems: "center", gap: 4 },
  trustText: { fontSize: 9, textAlign: "center", letterSpacing: 0.3 },
  checkoutBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 0.5,
  },
  checkoutTotal: { fontSize: 18 },
  checkoutItems: { fontSize: 11 },
  checkoutBtn: {
    paddingVertical: 16,
    alignItems: "center",
    borderRadius: 1,
  },
  checkoutBtnText: { fontSize: 13, letterSpacing: 1.5 },
});
