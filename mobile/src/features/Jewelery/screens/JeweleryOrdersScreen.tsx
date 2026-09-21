import { Feather, Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { APP_CURRENCY } from "@/src/constants";
import { SocketEvents } from "@/src/constants/socketEvents";
import { getMyOrdersRequest } from "@/src/features/common/order/api/order.api";
import { useColors } from "@/src/features/Jewelery/hooks/useColors";
import { useTopPad } from "@/src/hooks/useTopPad";
import { socketClient } from "@/src/lib/socket";

export default function JeweleryOrdersScreen() {
  const colors = useColors();
  const router = useRouter();
  const topPad = useTopPad();
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 34 : Math.max(insets.bottom, 20);

  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const res = await getMyOrdersRequest();
      setOrders(res.data || []);
    } catch (e) {
      console.error("Failed to fetch jewelry orders:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    socketClient.on(SocketEvents.ORDER_STATUS_UPDATE, () => {
      fetchOrders();
    });

    return () => {
      socketClient.off(SocketEvents.ORDER_STATUS_UPDATE);
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchOrders();
    setIsRefreshing(false);
  };

  const getStatusBadge = (status: string) => {
    const s = (status || "PENDING").toUpperCase();
    switch (s) {
      case "CONFIRMED":
      case "PROCESSING":
        return {
          bg: colors.champagne,
          color: colors.gold,
          icon: "check-circle",
          label: s === "PROCESSING" ? "Crafting / Packed" : "Confirmed",
        };
      case "IN_TRANSIT":
      case "SHIPPED":
        return {
          bg: colors.pearl,
          color: colors.gold,
          icon: "truck",
          label: "In Transit",
        };
      case "DELIVERED":
        return {
          bg: "#f0fdf4",
          color: "#166534",
          icon: "shield",
          label: "Delivered",
        };
      case "CANCELLED":
      case "REJECTED":
        return {
          bg: "#fef2f2",
          color: "#991b1b",
          icon: "x-circle",
          label: "Cancelled",
        };
      default:
        return {
          bg: colors.pearl,
          color: colors.warmGray,
          icon: "clock",
          label: "Processing",
        };
    }
  };

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
            else router.replace("/jewelery/(tabs)/profile" as any);
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
            YOUR ORDERS
          </Text>
          <Text
            style={[
              styles.headerSubtitle,
              { color: colors.warmGray, fontFamily: "DMSans_400Regular" },
            ]}
          >
            {orders.length > 0
              ? `${orders.length} order${orders.length === 1 ? "" : "s"} on record`
              : "Track and manage your pieces"}
          </Text>
        </View>

        <Feather name="package" size={16} color={colors.gold} />
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
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.gold} />
            <Text
              style={[
                styles.loadingText,
                { color: colors.warmGray, fontFamily: "DMSans_400Regular" },
              ]}
            >
              Loading your orders...
            </Text>
          </View>
        ) : orders.length > 0 ? (
          <View style={styles.ordersList}>
            {orders.map((order) => {
              const statusMeta = getStatusBadge(order.status);
              const totalItems = (order.items || []).reduce(
                (sum: number, it: any) => sum + (it.quantity || 1),
                0
              );

              return (
                <TouchableOpacity
                  key={order._id || order.orderId}
                  style={[
                    styles.orderCard,
                    {
                      backgroundColor: colors.cardBg,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push({
                      pathname: "/jewelery/orders/[id]" as any,
                      params: { id: order.orderId },
                    });
                  }}
                  activeOpacity={0.88}
                >
                  {/* Top Bar */}
                  <View style={styles.cardTop}>
                    <View>
                      <Text
                        style={[
                          styles.orderIdText,
                          {
                            color: colors.ink,
                            fontFamily: "DMSans_700Bold",
                          },
                        ]}
                      >
                        ORDER #{order.orderId}
                      </Text>
                      <Text
                        style={[
                          styles.orderDate,
                          {
                            color: colors.warmGray,
                            fontFamily: "DMSans_400Regular",
                          },
                        ]}
                      >
                        {dayjs(order.createdAt).format("DD MMM YYYY, hh:mm A")}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: statusMeta.bg,
                          borderColor: statusMeta.color,
                        },
                      ]}
                    >
                      <Feather
                        name={statusMeta.icon as any}
                        size={10}
                        color={statusMeta.color}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          {
                            color: statusMeta.color,
                            fontFamily: "DMSans_600SemiBold",
                          },
                        ]}
                      >
                        {statusMeta.label}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.cardDivider,
                      { backgroundColor: colors.border },
                    ]}
                  />

                  {/* Items Preview */}
                  <View style={styles.itemsPreview}>
                    <View
                      style={[
                        styles.packageIconWrap,
                        { backgroundColor: colors.champagne },
                      ]}
                    >
                      <Feather name="gift" size={16} color={colors.gold} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.itemsPreviewTitle,
                          {
                            color: colors.ink,
                            fontFamily: "CormorantGaramond_500Medium_Italic",
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {order.items?.[0]?.title ||
                          order.items?.[0]?.productTitle ||
                          "Jewellery Creation"}
                        {order.items?.length > 1
                          ? ` & ${order.items.length - 1} other piece${order.items.length > 2 ? "s" : ""}`
                          : ""}
                      </Text>
                      <Text
                        style={[
                          styles.itemsCount,
                          {
                            color: colors.warmGray,
                            fontFamily: "DMSans_400Regular",
                          },
                        ]}
                      >
                        {totalItems} piece{totalItems !== 1 ? "s" : ""} ·{" "}
                        {order.paymentMethod === "COD" ? "Cash on Delivery" : "Online Payment"}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.cardDivider,
                      { backgroundColor: colors.border },
                    ]}
                  />

                  {/* Footer */}
                  <View style={styles.cardFooter}>
                    <View>
                      <Text
                        style={[
                          styles.totalLabel,
                          {
                            color: colors.warmGray,
                            fontFamily: "DMSans_400Regular",
                          },
                        ]}
                      >
                        Total Amount
                      </Text>
                      <Text
                        style={[
                          styles.totalAmount,
                          {
                            color: colors.ink,
                            fontFamily: "DMSans_700Bold",
                          },
                        ]}
                      >
                        {APP_CURRENCY}
                        {(order.payableAmount || 0).toLocaleString("en-IN")}
                      </Text>
                    </View>

                    <View style={styles.viewDetailsRow}>
                      <Text
                        style={[
                          styles.viewDetailsText,
                          {
                            color: colors.gold,
                            fontFamily: "DMSans_600SemiBold",
                          },
                        ]}
                      >
                        VIEW DETAILS
                      </Text>
                      <Feather
                        name="chevron-right"
                        size={14}
                        color={colors.gold}
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyWrap}>
            <View
              style={[
                styles.emptyIconWrap,
                {
                  backgroundColor: colors.champagne,
                  borderColor: colors.gold,
                },
              ]}
            >
              <Feather name="gift" size={32} color={colors.gold} />
            </View>
            <Text
              style={[
                styles.emptyTitle,
                {
                  color: colors.ink,
                  fontFamily: "CormorantGaramond_600SemiBold",
                },
              ]}
            >
              No Jewellery Orders Yet
            </Text>
            <Text
              style={[
                styles.emptySub,
                {
                  color: colors.warmGray,
                  fontFamily: "DMSans_400Regular",
                },
              ]}
            >
              Explore our handcrafted collections and acquire your first signature piece.
            </Text>
            <TouchableOpacity
              style={[
                styles.emptyBtn,
                { backgroundColor: colors.gold },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.replace("/jewelery/(tabs)/collections" as any);
              }}
              activeOpacity={0.88}
            >
              <Text
                style={[
                  styles.emptyBtnText,
                  {
                    color: colors.onBrand,
                    fontFamily: "DMSans_600SemiBold",
                  },
                ]}
              >
                EXPLORE COLLECTIONS
              </Text>
              <Feather name="arrow-right" size={14} color={colors.onBrand} />
            </TouchableOpacity>
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
    fontSize: 18,
    letterSpacing: 1.5,
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
  },
  ordersList: {
    gap: 14,
  },
  orderCard: {
    borderRadius: 3,
    borderWidth: 1,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  orderIdText: {
    fontSize: 13,
    letterSpacing: 0.8,
  },
  orderDate: {
    fontSize: 11,
    marginTop: 3,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 2,
    borderWidth: 0.5,
  },
  statusText: {
    fontSize: 10,
    letterSpacing: 0.4,
  },
  cardDivider: {
    height: 0.5,
    marginVertical: 12,
  },
  itemsPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  packageIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  itemsPreviewTitle: {
    fontSize: 15,
    marginBottom: 2,
  },
  itemsCount: {
    fontSize: 11.5,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 10.5,
    letterSpacing: 0.5,
  },
  totalAmount: {
    fontSize: 15,
    marginTop: 2,
  },
  viewDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 11,
    letterSpacing: 1,
  },
  emptyWrap: {
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyIconWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 28,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 2,
  },
  emptyBtnText: {
    fontSize: 12,
    letterSpacing: 1.2,
  },
});
