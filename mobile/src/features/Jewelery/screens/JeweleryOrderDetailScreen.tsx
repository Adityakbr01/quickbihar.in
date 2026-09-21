import { Feather, Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { APP_CURRENCY } from "@/src/constants";
import { SocketEvents } from "@/src/constants/socketEvents";
import { getOrderByIdRequest } from "@/src/features/common/order/api/order.api";
import { useColors } from "@/src/features/Jewelery/hooks/useColors";
import { useTopPad } from "@/src/hooks/useTopPad";
import { socketClient } from "@/src/lib/socket";

const ORDER_TIMELINE = [
  { key: "CONFIRMED", title: "Order Confirmed", sub: "Order verified & logged" },
  { key: "PROCESSING", title: "Crafting & Packing", sub: "Artisanal prep & inspection" },
  { key: "IN_TRANSIT", title: "Out for Delivery", sub: "Secured courier dispatched" },
  { key: "DELIVERED", title: "Hand Delivered", sub: "Safely received" },
];

export default function JeweleryOrderDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const topPad = useTopPad();
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 34 : Math.max(insets.bottom, 20);

  const params = useLocalSearchParams<{ id?: string; orderId?: string }>();
  const orderId = String(params.id || params.orderId || "");

  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchOrderDetail = async () => {
    if (!orderId) return;
    try {
      setIsLoading(true);
      const res = await getOrderByIdRequest(orderId);
      setOrder(res.data);
    } catch (e) {
      console.error("Failed to load jewelry order detail:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();

    socketClient.on(SocketEvents.ORDER_STATUS_UPDATE, (data) => {
      if (data?.orderId === orderId) {
        fetchOrderDetail();
      }
    });

    return () => {
      socketClient.off(SocketEvents.ORDER_STATUS_UPDATE);
    };
  }, [orderId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchOrderDetail();
    setIsRefreshing(false);
  };

  const handleShare = async () => {
    if (!order) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const itemsText = (order.items || [])
        .map(
          (i: any) =>
            `• ${i.title || i.productTitle || "Jewellery Piece"} (x${i.quantity}) - ${APP_CURRENCY}${(
              (i.price || 0) * (i.quantity || 1)
            ).toLocaleString("en-IN")}`
        )
        .join("\n");

      await Share.share({
        title: `Receipt - Order #${order.orderId}`,
        message:
          `👑 QuickBihar Jewellery\n` +
          `Order #${order.orderId}\n` +
          `Status: ${order.status}\n\n` +
          `Items:\n${itemsText}\n\n` +
          `Total Paid: ${APP_CURRENCY}${(order.payableAmount || 0).toLocaleString("en-IN")}\n` +
          `Thank you for acquiring our fine jewellery.`,
      });
    } catch {}
  };

  const handleNavigateToProduct = (item: any) => {
    const prod =
      item.productId && typeof item.productId === "object"
        ? item.productId
        : null;
    const prodId = prod?.slug || prod?._id || item.productId || item._id;
    if (prodId && typeof prodId === "string") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push({
        pathname: "/jewelery/product/[id]" as any,
        params: { id: prodId },
      });
    }
  };

  const getCurrentStepIndex = (status: string) => {
    const s = (status || "").toUpperCase();
    if (s === "DELIVERED") return 3;
    if (s === "IN_TRANSIT" || s === "SHIPPED") return 2;
    if (s === "PROCESSING") return 1;
    return 0; // CONFIRMED or PENDING
  };

  const activeStep = getCurrentStepIndex(order?.status);

  return (
    <View style={[styles.root, { backgroundColor: colors.ivory }]}>
      {/* Header */}
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
        <Pressable
          style={styles.backBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (router.canGoBack()) router.back();
            else router.replace("/jewelery/orders" as any);
          }}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Feather name="arrow-left" size={18} color={colors.ink} />
        </Pressable>

        <View style={styles.headerTitleWrap}>
          <Text
            style={[
              styles.headerTitle,
              {
                color: colors.ink,
                fontFamily: "CormorantGaramond_600SemiBold",
              },
            ]}
          >
            {order ? `ORDER #${order.orderId}` : "ORDER DETAILS"}
          </Text>
          {order && (
            <Text
              style={[
                styles.headerSubtitle,
                { color: colors.warmGray, fontFamily: "DMSans_400Regular" },
              ]}
            >
              Placed on {dayjs(order.createdAt).format("DD MMMM YYYY")}
            </Text>
          )}
        </View>

        <TouchableOpacity
          onPress={handleShare}
          style={styles.shareBtn}
          hitSlop={8}
        >
          <Feather name="share-2" size={16} color={colors.gold} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomPad + 40 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.gold}
          />
        }
      >
        {isLoading && !order ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={colors.gold} />
            <Text
              style={[
                styles.loadingText,
                { color: colors.warmGray, fontFamily: "DMSans_400Regular" },
              ]}
            >
              Loading order details...
            </Text>
          </View>
        ) : order ? (
          <View style={{ gap: 16 }}>
            {/* Status Timeline */}
            <View
              style={[
                styles.sectionCard,
                {
                  backgroundColor: colors.cardBg,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color: colors.ink,
                    fontFamily: "CormorantGaramond_600SemiBold",
                  },
                ]}
              >
                DELIVERY PROGRESS
              </Text>

              <View style={styles.timelineList}>
                {ORDER_TIMELINE.map((step, idx) => {
                  const isDone = idx <= activeStep;
                  const isCurrent = idx === activeStep;

                  return (
                    <View key={step.key} style={styles.timelineRow}>
                      <View style={styles.nodeColumn}>
                        <View
                          style={[
                            styles.nodeCircle,
                            {
                              backgroundColor: isDone ? colors.gold : colors.pearl,
                              borderColor: isDone ? colors.gold : colors.midGray,
                            },
                          ]}
                        >
                          {isDone ? (
                            <Feather name="check" size={10} color={colors.onBrand} />
                          ) : (
                            <View
                              style={[
                                styles.nodeDot,
                                { backgroundColor: colors.warmGray },
                              ]}
                            />
                          )}
                        </View>
                        {idx < ORDER_TIMELINE.length - 1 && (
                          <View
                            style={[
                              styles.nodeLine,
                              {
                                backgroundColor:
                                  idx < activeStep ? colors.gold : colors.midGray,
                              },
                            ]}
                          />
                        )}
                      </View>

                      <View style={styles.nodeContent}>
                        <Text
                          style={[
                            styles.nodeTitle,
                            {
                              color: isCurrent ? colors.gold : colors.ink,
                              fontFamily: isCurrent
                                ? "DMSans_700Bold"
                                : "DMSans_500Medium",
                            },
                          ]}
                        >
                          {step.title}
                        </Text>
                        <Text
                          style={[
                            styles.nodeSub,
                            {
                              color: colors.warmGray,
                              fontFamily: "DMSans_400Regular",
                            },
                          ]}
                        >
                          {step.sub}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Pieces in Order */}
            <View
              style={[
                styles.sectionCard,
                {
                  backgroundColor: colors.cardBg,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color: colors.ink,
                    fontFamily: "CormorantGaramond_600SemiBold",
                  },
                ]}
              >
                YOUR ACQUISITIONS ({(order.items || []).length})
              </Text>

              <View style={{ gap: 12 }}>
                {(order.items || []).map((item: any, idx: number) => {
                  const imgUri =
                    typeof item.image === "string"
                      ? item.image
                      : item.image?.url ||
                        item.productId?.images?.[0] ||
                        item.productId?.image;

                  return (
                    <TouchableOpacity
                      key={item.sku || idx}
                      style={[
                        styles.itemCard,
                        {
                          borderBottomColor: colors.border,
                          borderBottomWidth:
                            idx < (order.items || []).length - 1 ? 0.5 : 0,
                        },
                      ]}
                      onPress={() => handleNavigateToProduct(item)}
                      activeOpacity={0.8}
                    >
                      {imgUri ? (
                        <Image
                          source={{ uri: imgUri }}
                          style={styles.itemImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View
                          style={[
                            styles.itemImage,
                            styles.itemImgPlaceholder,
                            { backgroundColor: colors.champagne },
                          ]}
                        >
                          <Feather name="gift" size={20} color={colors.gold} />
                        </View>
                      )}

                      <View style={{ flex: 1, gap: 3 }}>
                        <Text
                          style={[
                            styles.itemTitle,
                            {
                              color: colors.ink,
                              fontFamily: "CormorantGaramond_600SemiBold",
                            },
                          ]}
                          numberOfLines={2}
                        >
                          {item.title || item.productTitle || "Fine Jewellery Piece"}
                        </Text>

                        {item.sku && (
                          <Text
                            style={[
                              styles.itemSku,
                              {
                                color: colors.warmGray,
                                fontFamily: "DMSans_400Regular",
                              },
                            ]}
                          >
                            SKU: {item.sku}
                          </Text>
                        )}

                        <View style={styles.itemPriceRow}>
                          <Text
                            style={[
                              styles.itemQty,
                              {
                                color: colors.warmGray,
                                fontFamily: "DMSans_400Regular",
                              },
                            ]}
                          >
                            Qty: {item.quantity || 1}
                          </Text>
                          <Text
                            style={[
                              styles.itemPrice,
                              {
                                color: colors.ink,
                                fontFamily: "DMSans_600SemiBold",
                              },
                            ]}
                          >
                            {APP_CURRENCY}
                            {(
                              (item.price || 0) * (item.quantity || 1)
                            ).toLocaleString("en-IN")}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Delivery Address */}
            {order.shippingAddress && (
              <View
                style={[
                  styles.sectionCard,
                  {
                    backgroundColor: colors.cardBg,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.sectionHeaderRow}>
                  <Text
                    style={[
                      styles.sectionTitle,
                      {
                        color: colors.ink,
                        fontFamily: "CormorantGaramond_600SemiBold",
                      },
                    ]}
                  >
                    DESTINATION
                  </Text>
                  <Ionicons
                    name="location-sharp"
                    size={14}
                    color={colors.gold}
                  />
                </View>

                <Text
                  style={[
                    styles.addressName,
                    {
                      color: colors.ink,
                      fontFamily: "DMSans_600SemiBold",
                    },
                  ]}
                >
                  {order.shippingAddress.fullName}
                </Text>
                <Text
                  style={[
                    styles.addressText,
                    {
                      color: colors.warmGray,
                      fontFamily: "DMSans_400Regular",
                    },
                  ]}
                >
                  {order.shippingAddress.street}
                  {order.shippingAddress.landmark
                    ? `, Near ${order.shippingAddress.landmark}`
                    : ""}
                  {"\n"}
                  {order.shippingAddress.city}, {order.shippingAddress.state} —{" "}
                  {order.shippingAddress.pincode}
                </Text>
                <View style={styles.phoneBadge}>
                  <Feather name="phone" size={11} color={colors.gold} />
                  <Text
                    style={[
                      styles.phoneText,
                      {
                        color: colors.ink,
                        fontFamily: "DMSans_500Medium",
                      },
                    ]}
                  >
                    {order.shippingAddress.phone}
                  </Text>
                </View>
              </View>
            )}

            {/* Payment & Charges Summary */}
            <View
              style={[
                styles.sectionCard,
                {
                  backgroundColor: colors.cardBg,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color: colors.ink,
                    fontFamily: "CormorantGaramond_600SemiBold",
                  },
                ]}
              >
                PAYMENT BREAKDOWN
              </Text>

              <View style={styles.breakdownRow}>
                <Text
                  style={[
                    styles.breakdownKey,
                    {
                      color: colors.warmGray,
                      fontFamily: "DMSans_400Regular",
                    },
                  ]}
                >
                  Payment Method
                </Text>
                <Text
                  style={[
                    styles.breakdownVal,
                    {
                      color: colors.ink,
                      fontFamily: "DMSans_500Medium",
                    },
                  ]}
                >
                  {order.paymentMethod === "COD" ? "Cash on Delivery" : "Online Gateway (Razorpay)"}
                </Text>
              </View>

              <View style={styles.breakdownRow}>
                <Text
                  style={[
                    styles.breakdownKey,
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
                    styles.breakdownVal,
                    {
                      color: colors.ink,
                      fontFamily: "DMSans_500Medium",
                    },
                  ]}
                >
                  {APP_CURRENCY}
                  {(order.subtotal || order.payableAmount || 0).toLocaleString("en-IN")}
                </Text>
              </View>

              <View style={styles.breakdownRow}>
                <Text
                  style={[
                    styles.breakdownKey,
                    {
                      color: colors.warmGray,
                      fontFamily: "DMSans_400Regular",
                    },
                  ]}
                >
                  Insured Delivery
                </Text>
                <Text
                  style={[
                    styles.breakdownVal,
                    {
                      color: colors.gold,
                      fontFamily: "DMSans_600SemiBold",
                    },
                  ]}
                >
                  {order.shippingFee === 0 || !order.shippingFee
                    ? "Complimentary"
                    : `${APP_CURRENCY}${order.shippingFee}`}
                </Text>
              </View>

              {order.discountAmount > 0 && (
                <View style={styles.breakdownRow}>
                  <Text
                    style={[
                      styles.breakdownKey,
                      {
                        color: colors.warmGray,
                        fontFamily: "DMSans_400Regular",
                      },
                    ]}
                  >
                    Privilege Savings
                  </Text>
                  <Text
                    style={[
                      styles.breakdownVal,
                      {
                        color: colors.gold,
                        fontFamily: "DMSans_600SemiBold",
                      },
                    ]}
                  >
                    -{APP_CURRENCY}
                    {(order.discountAmount || 0).toLocaleString("en-IN")}
                  </Text>
                </View>
              )}

              <View
                style={[
                  styles.divider,
                  { backgroundColor: colors.border },
                ]}
              />

              <View style={styles.totalRow}>
                <Text
                  style={[
                    styles.totalKey,
                    {
                      color: colors.ink,
                      fontFamily: "DMSans_700Bold",
                    },
                  ]}
                >
                  Total Paid
                </Text>
                <Text
                  style={[
                    styles.totalVal,
                    {
                      color: colors.gold,
                      fontFamily: "DMSans_700Bold",
                    },
                  ]}
                >
                  {APP_CURRENCY}
                  {(order.payableAmount || 0).toLocaleString("en-IN")}
                </Text>
              </View>
            </View>

            {/* Assistance & Concierge Card */}
            <View
              style={[
                styles.conciergeCard,
                {
                  backgroundColor: colors.champagne,
                  borderColor: colors.gold,
                },
              ]}
            >
              <Feather name="shield" size={20} color={colors.gold} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text
                  style={[
                    styles.conciergeTitle,
                    {
                      color: colors.ink,
                      fontFamily: "CormorantGaramond_600SemiBold",
                    },
                  ]}
                >
                  Jewellery Concierge
                </Text>
                <Text
                  style={[
                    styles.conciergeSub,
                    {
                      color: colors.warmGray,
                      fontFamily: "DMSans_400Regular",
                    },
                  ]}
                >
                  Every piece is certified, insured, and handled with white-glove delivery care.
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.emptyWrap}>
            <Text style={{ color: colors.warmGray, fontSize: 13 }}>
              Order could not be located.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 0.5,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    letterSpacing: 1.2,
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  shareBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    padding: 16,
  },
  loadingWrap: {
    paddingVertical: 80,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
  },
  sectionCard: {
    borderRadius: 3,
    borderWidth: 1,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    letterSpacing: 1,
    marginBottom: 12,
  },
  timelineList: {
    gap: 4,
  },
  timelineRow: {
    flexDirection: "row",
    gap: 12,
  },
  nodeColumn: {
    alignItems: "center",
    width: 20,
  },
  nodeCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  nodeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  nodeLine: {
    width: 1.5,
    height: 28,
    marginVertical: 2,
  },
  nodeContent: {
    flex: 1,
    paddingBottom: 16,
  },
  nodeTitle: {
    fontSize: 13,
  },
  nodeSub: {
    fontSize: 11,
    marginTop: 2,
  },
  itemCard: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 10,
  },
  itemImage: {
    width: 64,
    height: 80,
    borderRadius: 2,
  },
  itemImgPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  itemTitle: {
    fontSize: 15,
    letterSpacing: 0.3,
  },
  itemSku: {
    fontSize: 10.5,
  },
  itemPriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  itemQty: {
    fontSize: 11.5,
  },
  itemPrice: {
    fontSize: 14,
  },
  addressName: {
    fontSize: 14,
    marginBottom: 4,
  },
  addressText: {
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 10,
  },
  phoneBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  phoneText: {
    fontSize: 12,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  breakdownKey: {
    fontSize: 12,
  },
  breakdownVal: {
    fontSize: 12.5,
  },
  divider: {
    height: 0.5,
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalKey: {
    fontSize: 14,
  },
  totalVal: {
    fontSize: 16,
  },
  conciergeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 2,
    borderWidth: 0.5,
  },
  conciergeTitle: {
    fontSize: 15,
  },
  conciergeSub: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  emptyWrap: {
    paddingVertical: 60,
    alignItems: "center",
  },
});
