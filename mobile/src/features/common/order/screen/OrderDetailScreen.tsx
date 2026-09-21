import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Share,
  Linking,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Ionicons,
  MaterialCommunityIcons,
  Feather,
} from "@expo/vector-icons";
import dayjs from "dayjs";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { SUPPORT_CALL_NUMBER } from "@/src/constants";
import SafeViewWrapper from "@/src/provider/SafeViewWrapper";
import { goBack } from "@/src/utils/navigation";
import { getOrderByIdRequest } from "../api/order.api";
import { useSocketStore } from "@/src/store/useSocketStore";
import { SocketEvents } from "@/src/constants/socketEvents";
import { createOrderDetailStyles } from "../style/OrderDetailScreen.style";

const ORDER_STEP_STAGES = [
  { key: "CONFIRMED", label: "Order Placed", shortLabel: "Confirmed" },
  { key: "PROCESSING", label: "Processing / Packed", shortLabel: "Packed" },
  { key: "IN_TRANSIT", label: "Out for Delivery", shortLabel: "In Transit" },
  { key: "DELIVERED", label: "Delivered", shortLabel: "Delivered" },
];

/**
 * Bulletproof helper to extract valid image URL from any product/item structure.
 */
const extractProductImageUrl = (item: any): string | null => {
  if (!item) return null;

  // 1. Direct string image on item
  if (typeof item.image === "string" && item.image.trim().startsWith("http")) {
    return item.image.trim();
  }
  if (typeof item.imageUrl === "string" && item.imageUrl.trim().startsWith("http")) {
    return item.imageUrl.trim();
  }

  // 2. Direct object on item.image
  if (item.image && typeof item.image === "object" && typeof item.image.url === "string") {
    return item.image.url.trim();
  }

  // 3. Populated productId object
  const prod = item.productId || item.product;
  if (prod && typeof prod === "object") {
    if (Array.isArray(prod.images) && prod.images.length > 0) {
      for (const img of prod.images) {
        if (typeof img === "string" && img.trim().startsWith("http")) {
          return img.trim();
        }
        if (img && typeof img === "object" && typeof img.url === "string" && img.url.trim().startsWith("http")) {
          return img.url.trim();
        }
      }
    }
    if (typeof prod.image === "string" && prod.image.trim().startsWith("http")) return prod.image.trim();
    if (typeof prod.thumbnail === "string" && prod.thumbnail.trim().startsWith("http")) return prod.thumbnail.trim();
    if (typeof prod.mainImage === "string" && prod.mainImage.trim().startsWith("http")) return prod.mainImage.trim();
  }

  // 4. Any generic non-empty image string
  if (typeof item.image === "string" && item.image.trim().length > 0) {
    return item.image.trim();
  }

  return null;
};

export default function OrderDetailScreen() {
  const theme = useTheme();
  const styles = createOrderDetailStyles(theme);
  const router = useRouter();
  const params = useLocalSearchParams();
  const orderId = String(params.id || params.orderId || "");

  const [order, setOrder] = useState<any>(null);
  const [selectedSubOrderIndex, setSelectedSubOrderIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Accordion UI State toggles (Collapsed by default as requested)
  const [isTimelineExpanded, setIsTimelineExpanded] = useState<boolean>(false);
  const [isPriceDetailsExpanded, setIsPriceDetailsExpanded] = useState<boolean>(false);
  const [isFeesExpanded, setIsFeesExpanded] = useState<boolean>(false);
  const [isDiscountExpanded, setIsDiscountExpanded] = useState<boolean>(false);

  const socket = useSocketStore((state) => state.socket);
  const isConnected = useSocketStore((state) => state.isConnected);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
      useSocketStore.getState().connect();
    }
  }, [orderId]);

  // Real-time socket updates & room subscriptions
  useEffect(() => {
    if (!socket || !isConnected || !orderId) return;

    // Join order room
    socket.emit(SocketEvents.JOIN_ORDER_ROOM, orderId);

    // Also join sub-order rooms if they exist
    if (order?.subOrders && Array.isArray(order.subOrders)) {
      order.subOrders.forEach((sub: any) => {
        if (sub.subOrderId) {
          socket.emit("join_suborder_room", sub.subOrderId);
        }
      });
    }

    const handleUpdate = (data: any) => {
      console.log("[OrderDetailScreen] Live Order event received:", data);
      fetchOrderDetails(false);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    };

    socket.on(SocketEvents.ORDER_STATUS_UPDATE, handleUpdate);
    socket.on(SocketEvents.FULFILLMENT_EVENT, handleUpdate);
    socket.on("delivery_status_updated", handleUpdate);
    socket.on("suborder_status_updated", handleUpdate);
    socket.on("order_updated", handleUpdate);

    return () => {
      socket.emit(SocketEvents.LEAVE_ORDER_ROOM, orderId);
      if (order?.subOrders && Array.isArray(order.subOrders)) {
        order.subOrders.forEach((sub: any) => {
          if (sub.subOrderId) {
            socket.emit("leave_suborder_room", sub.subOrderId);
          }
        });
      }
      socket.off(SocketEvents.ORDER_STATUS_UPDATE, handleUpdate);
      socket.off(SocketEvents.FULFILLMENT_EVENT, handleUpdate);
      socket.off("delivery_status_updated", handleUpdate);
      socket.off("suborder_status_updated", handleUpdate);
      socket.off("order_updated", handleUpdate);
    };
  }, [orderId, socket, isConnected, order?.subOrders]);

  // Active status smart polling fallback (every 10s if active)
  useEffect(() => {
    const isFinished = ["DELIVERED", "CANCELLED", "REJECTED", "REFUNDED"].includes(
      order?.status || ""
    );

    if (isFinished || !orderId) return;

    const pollInterval = setInterval(() => {
      fetchOrderDetails(false);
    }, 10000);

    return () => clearInterval(pollInterval);
  }, [orderId, order?.status]);

  const fetchOrderDetails = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      const res = await getOrderByIdRequest(orderId);
      const data = res?.data || res;
      setOrder(data);
    } catch (err: any) {
      console.error("[OrderDetailScreen] Fetch error:", err);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchOrderDetails(false);
    setIsRefreshing(false);
  };

  const subOrders = useMemo(() => {
    return (order?.subOrders && order.subOrders.length > 0)
      ? order.subOrders
      : [order];
  }, [order]);

  const currentSubOrder = useMemo(() => {
    if (!subOrders || subOrders.length === 0) return order;
    return subOrders[selectedSubOrderIndex] || subOrders[0] || order;
  }, [subOrders, selectedSubOrderIndex, order]);

  // Delivery OTP extraction
  const deliveryOtp = useMemo(() => {
    if (currentSubOrder?.delivery?.deliveryOtp) {
      return String(currentSubOrder.delivery.deliveryOtp);
    }
    if (order?.delivery?.otp?.code) {
      return String(order.delivery.otp.code);
    }
    if (order?.deliveryOtp) {
      return String(order.deliveryOtp);
    }
    return null;
  }, [currentSubOrder, order]);

  // Phase 9 — pickup OTP (rider shares it with the seller at store pickup).
  // Generated up front when the sub-order is created (finalizePendingConfirmation).
  const pickupOtp = useMemo(() => {
    if (currentSubOrder?.delivery?.pickupOtp) {
      return String(currentSubOrder.delivery.pickupOtp);
    }
    return null;
  }, [currentSubOrder]);

  // Determine current active step index for progress bar
  const currentStatus = (currentSubOrder?.status || order?.status || "CONFIRMED").toUpperCase();

  const activeStepIndex = useMemo(() => {
    switch (currentStatus) {
      case "PENDING":
      case "PENDING_PAYMENT":
      case "CONFIRMED":
        return 0;
      case "PROCESSING":
      case "PACKED":
      case "READY_FOR_PICKUP":
      case "RIDER_ASSIGNED":
      case "RIDER_ARRIVING":
      case "RIDER_REACHED_STORE":
      case "PICKED_UP":
        return 1;
      case "IN_TRANSIT":
      case "NEAR_CUSTOMER":
      case "OUT_FOR_DELIVERY":
        return 2;
      case "DELIVERED":
      case "DELIVERY_CONFIRMED":
      case "COMPLETED":
        return 3;
      case "CANCELLED":
      case "REJECTED":
      case "REFUNDED":
        return -1;
      default:
        return 0;
    }
  }, [currentStatus]);

  const handleCopyOrderId = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleShare = async () => {
    if (!order) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const itemsText = (order.items || [])
        .map((i: any) => `• ${i.title} (x${i.quantity}) - ₹${i.price * i.quantity}`)
        .join("\n");

      await Share.share({
        title: `Order Details - #${order.orderId}`,
        message:
          `📦 *Quick Bihar Order Details*\n\n` +
          `*Order ID:* #${order.orderId}\n` +
          `*Status:* ${currentStatus.replace(/_/g, " ")}\n` +
          `${deliveryOtp ? `*Delivery OTP:* ${deliveryOtp}\n` : ""}` +
          `*Total Amount:* ₹${order.payableAmount || order.totalAmount}\n\n` +
          `*Items:*\n${itemsText}\n\n` +
          `_Track and manage your order on Quick Bihar!_`,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleHelp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(`tel:${SUPPORT_CALL_NUMBER}`).catch(() => {
      // Haptic-only fallback — dialer failures are rare and the Help
      // button itself already signals the tap.
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    });
  };

  const handleCallRider = (phone?: string) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`);
  };

  const handleNavigateToProduct = (item: any) => {
    const prod =
      item.productId && typeof item.productId === "object"
        ? item.productId
        : null;
    const prodId = prod?.slug || prod?._id || item.productId || item._id;
    if (prodId && typeof prodId === "string") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // Jewelery lines open the jewelery detail screen — the clothing
      // detail screen can't render jewelery products.
      const vertical = prod?.vertical || item.vertical;
      const isJewelery =
        vertical === "JEWELERY" ||
        String(vertical || "").toLowerCase() === "jewelery" ||
        String(vertical || "").toLowerCase() === "jewellery" ||
        item.module === "jewelery" ||
        item.module === "jewellery" ||
        prod?.module === "jewelery" ||
        prod?.module === "jewellery" ||
        Boolean(prod?.jeweleryDetails) ||
        Boolean(item.jeweleryDetails) ||
        order?.module === "jewelery" ||
        order?.vertical === "JEWELERY" ||
        String(order?.module || "").toLowerCase() === "jewelery" ||
        String(order?.vertical || "").toLowerCase() === "jewelery";

      if (isJewelery) {
        const rawId = prod?._id || prodId || item.productId;
        const jeweleryId =
          typeof rawId === "object" ? rawId?._id : rawId;
        if (jeweleryId) {
          router.push({
            pathname: "/jewelery/product/[id]" as any,
            params: { id: String(jeweleryId) },
          });
          return;
        }
      }
      router.push({
        pathname: "/product/[id]" as any,
        params: { id: prodId },
      });
    }
  };

  if (isLoading && !order) {
    return (
      <SafeViewWrapper>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => goBack(router, "/account/orders")}
          >
            <Ionicons name="arrow-back" size={22} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Fetching order details...</Text>
        </View>
      </SafeViewWrapper>
    );
  }

  if (!order) {
    return (
      <SafeViewWrapper>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => goBack(router, "/account/orders")}
          >
            <Ionicons name="arrow-back" size={22} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons
            name="package-variant-closed-remove"
            size={56}
            color={theme.secondaryText}
          />
          <Text style={styles.errorTitle}>Order not found</Text>
          <Text style={styles.errorSubtitle}>
            We couldn't retrieve details for order #{orderId}.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchOrderDetails(true)}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeViewWrapper>
    );
  }

  const itemsToDisplay = currentSubOrder?.items || order?.items || [];
  const assignedRider = currentSubOrder?.delivery?.riderId || order?.delivery?.partnerUserId;
  const isCod = order?.paymentInfo?.razorpayOrderId === "COD" || currentSubOrder?.packageDetails?.isCod;
  const totalItemCount = itemsToDisplay.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0);

  const isActivelyDelivering = [
    "PICKED_UP",
    "IN_TRANSIT",
    "NEAR_CUSTOMER",
    "OUT_FOR_DELIVERY",
    "RIDER_ASSIGNED",
    "RIDER_ARRIVING",
  ].includes(currentStatus);
  const isOrderFinished = [
    "DELIVERED",
    "DELIVERY_CONFIRMED",
    "COMPLETED",
    "CANCELLED",
    "REJECTED",
    "REFUNDED",
  ].includes(currentStatus);
  const canShowRiderContact = isActivelyDelivering && !isOrderFinished && Boolean(assignedRider?.phone);

  // Status subtitle copy
  const getStatusSubtitle = () => {
    switch (currentStatus) {
      case "CONFIRMED":
        return `Order confirmed on ${dayjs(order.createdAt).format("ddd, DD MMM 'YY")}. Store is preparing your package.`;
      case "PROCESSING":
      case "PACKED":
        return "Your items have been packed by the store and are ready for pickup.";
      case "RIDER_ASSIGNED":
      case "RIDER_ARRIVING":
        return "Delivery partner assigned. Heading to the store for pickup.";
      case "PICKED_UP":
      case "IN_TRANSIT":
      case "NEAR_CUSTOMER":
      case "OUT_FOR_DELIVERY":
        return "Your order is on the way! Delivery partner is approaching your destination.";
      case "DELIVERED":
      case "COMPLETED":
        return `Delivered successfully on ${dayjs(order.updatedAt || order.createdAt).format("ddd, DD MMM 'YY - hh:mm A")}.`;
      case "CANCELLED":
        return "This order was cancelled.";
      default:
        return "Order is being processed.";
    }
  };

  return (
    <SafeViewWrapper>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => goBack(router, "/account/orders")}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.helpButton}
            onPress={handleHelp}
            activeOpacity={0.7}
          >
            <Text style={styles.helpButtonText}>Help</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleShare}
            activeOpacity={0.7}
          >
            <Feather name="send" size={17} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
          />
        }
      >
        {/* Order Meta & ID Row */}
        <View style={styles.orderIdRow}>
          <TouchableOpacity
            style={styles.orderIdContainer}
            onPress={handleCopyOrderId}
            activeOpacity={0.7}
          >
            <Text style={styles.orderIdText}>Order #{order.orderId}</Text>
            <Ionicons name="copy-outline" size={15} color={theme.primary} />
          </TouchableOpacity>
          <Text style={styles.orderDateText}>
            {dayjs(order.createdAt).format("DD MMM YYYY, hh:mm A")}
          </Text>
        </View>

        {/* Multi-SubOrder / Multi-Store Package Tabs */}
        {subOrders.length > 1 && (
          <View style={{ marginBottom: 12 }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.subOrderTabsContainer}
            >
              {subOrders.map((sub: any, idx: number) => {
                const isSelected = idx === selectedSubOrderIndex;
                const pkgItemCount = (sub.items || []).reduce((acc: number, it: any) => acc + (it.quantity || 1), 0);
                const storeName = sub.storeId?.name || `Store ${idx + 1}`;

                return (
                  <TouchableOpacity
                    key={sub.subOrderId || idx}
                    style={[
                      styles.subOrderTab,
                      isSelected && styles.subOrderTabActive,
                    ]}
                    onPress={() => setSelectedSubOrderIndex(idx)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.subOrderTabText,
                        isSelected && styles.subOrderTabTextActive,
                      ]}
                    >
                      📦 Package {idx + 1} ({pkgItemCount} {pkgItemCount === 1 ? "item" : "items"})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Items Section Header */}
        <View style={styles.itemsSectionHeader}>
          <Text style={styles.itemsSectionTitle}>
            {subOrders.length > 1
              ? `Package ${selectedSubOrderIndex + 1} Items (${itemsToDisplay.length})`
              : `Ordered Items (${itemsToDisplay.length})`}
          </Text>
          <View style={styles.itemsCountBadge}>
            <Text style={styles.itemsCountText}>
              Total Qty: {totalItemCount}
            </Text>
          </View>
        </View>

        {/* Product Items List (Handles multiple products with rich UX) */}
        {itemsToDisplay.map((item: any, idx: number) => {
          const imageUrl = extractProductImageUrl(item);
          const storeName = item.storeId?.name || currentSubOrder?.storeId?.name;

          return (
            <View key={item.sku || idx} style={styles.productCard}>
              <View style={styles.productCardTop}>
                {/* Product Image Thumbnail */}
                <TouchableOpacity
                  style={styles.productImageContainer}
                  activeOpacity={0.8}
                  onPress={() => handleNavigateToProduct(item)}
                >
                  {imageUrl ? (
                    <Image
                      source={{ uri: imageUrl }}
                      style={styles.productImage}
                      contentFit="cover"
                      transition={250}
                    />
                  ) : (
                    <MaterialCommunityIcons
                      name="shopping-outline"
                      size={32}
                      color={theme.primary}
                    />
                  )}
                </TouchableOpacity>

                {/* Product Details */}
                <View style={styles.productInfo}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleNavigateToProduct(item)}
                  >
                    <Text style={styles.productTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                  </TouchableOpacity>

                  {/* Visual Chips Row for Size, Color, SKU */}
                  <View style={styles.chipsRow}>
                    {item.color && (
                      <View style={styles.chip}>
                        <Text style={styles.chipText}>Color: {item.color}</Text>
                      </View>
                    )}
                    {item.size && (
                      <View style={styles.chip}>
                        <Text style={styles.chipText}>Size: {item.size}</Text>
                      </View>
                    )}
                    <View style={styles.chip}>
                      <Text style={styles.chipText}>Qty: {item.quantity || 1}</Text>
                    </View>
                  </View>

                  {/* Price & Unit Breakdown */}
                  <View style={styles.productPriceRow}>
                    <Text style={styles.productPrice}>
                      ₹{item.price * (item.quantity || 1)}
                    </Text>
                    {(item.quantity || 1) > 1 && (
                      <Text style={styles.productUnitPrice}>
                        (₹{item.price} each)
                      </Text>
                    )}
                  </View>
                </View>
              </View>

              {/* Product Card Footer (Store & View Product link) */}
              <View style={styles.productCardFooter}>
                <View style={styles.storeBadge}>
                  <Ionicons name="storefront-outline" size={13} color={theme.tertiaryText} />
                  <Text style={styles.storeBadgeText}>
                    {storeName ? `Sold by: ${storeName}` : "Quick Bihar Fulfilled"}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.viewProductLink}
                  onPress={() => handleNavigateToProduct(item)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewProductText}>View Item</Text>
                  <Ionicons name="chevron-forward" size={14} color={theme.primary} />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {/* Phase 9 — Prominent Delivery + Pickup OTP card.
            Generated up front when the sub-order is created; NOT sent via SMS.
            The customer shows the delivery OTP to the rider on arrival. */}
        {(deliveryOtp || pickupOtp) &&
          currentStatus !== "DELIVERED" &&
          currentStatus !== "CANCELLED" && (
            <View style={styles.otpCard}>
              <View style={styles.otpHeader}>
                <View style={styles.otpTitleContainer}>
                  <Ionicons name="shield-checkmark" size={18} color="#15803d" />
                  <Text style={styles.otpTitle}>Verification OTPs</Text>
                </View>
                <View style={styles.otpBadge}>
                  <Text style={styles.otpBadgeText}>Show to delivery person</Text>
                </View>
              </View>

              {deliveryOtp && (
                <View style={{ marginBottom: 12 }}>
                  <Text
                    style={[
                      styles.otpSubtitle,
                      { marginTop: 0, marginBottom: 6, fontWeight: "700", color: "#0f172a" },
                    ]}
                  >
                    Delivery OTP (for delivery at your door)
                  </Text>
                  <View style={styles.otpCodeRow}>
                    {deliveryOtp.split("").map((digit: string, i: number) => (
                      <View key={i} style={styles.otpDigitBox}>
                        <Text style={styles.otpDigitText}>{digit}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {pickupOtp && (
                <View>
                  <Text
                    style={[
                      styles.otpSubtitle,
                      { marginTop: 0, marginBottom: 6, fontWeight: "700", color: "#0f172a" },
                    ]}
                  >
                    Pickup OTP (rider uses at the store)
                  </Text>
                  <View style={styles.otpCodeRow}>
                    {pickupOtp.split("").map((digit: string, i: number) => (
                      <View key={i} style={styles.otpDigitBox}>
                        <Text style={styles.otpDigitText}>{digit}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <Text
                style={[
                  styles.otpSubtitle,
                  { marginTop: 12, color: "#64748b" },
                ]}
              >
                {deliveryOtp
                  ? "Share the delivery OTP only when the rider arrives at your door with your package."
                  : "The seller will share the delivery OTP with you on their confirmation call."}
              </Text>
            </View>
          )}

        {/* Order Status & Progress Card */}
        <View style={styles.statusCard}>
          <TouchableOpacity
            style={styles.statusCardHeader}
            activeOpacity={0.8}
            onPress={() => setIsTimelineExpanded(!isTimelineExpanded)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.statusCardTitle}>
                {currentStatus.replace(/_/g, " ")}
              </Text>
              <Text style={styles.statusCardSubtitle}>
                {getStatusSubtitle()}
              </Text>
            </View>
            <Ionicons
              name={isTimelineExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color={theme.secondaryText}
            />
          </TouchableOpacity>

          {/* Horizontal Stepper (Compact Mode) */}
          {!isTimelineExpanded && activeStepIndex >= 0 && (
            <View style={styles.stepperContainer}>
              <View style={styles.stepperTrack}>
                {ORDER_STEP_STAGES.map((stage, idx) => {
                  const isCompleted = idx <= activeStepIndex;
                  const isCurrent = idx === activeStepIndex;

                  return (
                    <React.Fragment key={stage.key}>
                      <View style={styles.stepperStep}>
                        <View
                          style={[
                            styles.stepperCircle,
                            isCompleted && styles.stepperCircleActive,
                            isCurrent && styles.stepperCircleCurrent,
                          ]}
                        >
                          {isCompleted ? (
                            <Ionicons name="checkmark" size={14} color="#ffffff" />
                          ) : null}
                        </View>
                      </View>
                      {idx < ORDER_STEP_STAGES.length - 1 && (
                        <View
                          style={[
                            styles.stepperLine,
                            idx < activeStepIndex && styles.stepperLineActive,
                          ]}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </View>

              <View style={styles.stepperLabelsRow}>
                {ORDER_STEP_STAGES.map((stage, idx) => (
                  <View key={stage.key} style={{ alignItems: "center" }}>
                    <Text
                      style={[
                        styles.stepperLabel,
                        idx <= activeStepIndex && styles.stepperLabelActive,
                      ]}
                      numberOfLines={1}
                    >
                      {stage.shortLabel}
                    </Text>
                    <Text style={styles.stepperSubLabel}>
                      {idx === 0
                        ? "Today"
                        : idx === activeStepIndex
                        ? "Active"
                        : ""}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Vertical Detailed Timeline (Expanded Mode) */}
          {isTimelineExpanded && (
            <View style={styles.verticalTimeline}>
              {ORDER_STEP_STAGES.map((stage, idx) => {
                const isPassed = idx <= activeStepIndex;
                const isCurrent = idx === activeStepIndex;
                const isLast = idx === ORDER_STEP_STAGES.length - 1;

                return (
                  <View
                    key={stage.key}
                    style={[styles.timelineItem, isLast && styles.timelineItemLast]}
                  >
                    {!isLast && (
                      <View
                        style={[
                          styles.timelineLine,
                          idx < activeStepIndex && styles.timelineLineActive,
                        ]}
                      />
                    )}

                    <View
                      style={[
                        styles.timelineDot,
                        isPassed && styles.timelineDotActive,
                        isCurrent && styles.timelineDotCurrent,
                      ]}
                    >
                      {isPassed && (
                        <Ionicons name="checkmark" size={12} color="#ffffff" />
                      )}
                    </View>

                    <View style={styles.timelineContent}>
                      <View style={styles.timelineTitleRow}>
                        <Text
                          style={[
                            styles.timelineTitle,
                            isPassed && { color: theme.text },
                          ]}
                        >
                          {stage.label}
                        </Text>
                        {isCurrent && (
                          <Text style={styles.timelineDate}>
                            {dayjs(order.updatedAt || order.createdAt).format("hh:mm A")}
                          </Text>
                        )}
                      </View>
                      <Text style={styles.timelineDesc}>
                        {idx === 0
                          ? `Order payment verified and order created.`
                          : idx === 1
                          ? `Seller confirmed & package ready for handover.`
                          : idx === 2
                          ? `Rider is on the way to delivery address.`
                          : `Package handed over with OTP verification.`}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Rider / Delivery Partner Card (ONLY shown when actively out for delivery, and hidden when completed/delivered) */}
          {isActivelyDelivering && assignedRider ? (
            <View style={styles.riderBox}>
              <View style={styles.riderLeft}>
                <View style={styles.riderAvatar}>
                  <MaterialCommunityIcons
                    name="motorbike"
                    size={22}
                    color={theme.primary}
                  />
                </View>
                <View>
                  <Text style={styles.riderName}>
                    {assignedRider.fullName || "Delivery Partner"}
                  </Text>
                  <Text style={styles.riderRole}>
                    {currentSubOrder?.delivery?.status?.replace(/_/g, " ") || "Out for Delivery"}
                  </Text>
                </View>
              </View>

              {canShowRiderContact && (
                <TouchableOpacity
                  style={styles.riderCallButton}
                  onPress={() => handleCallRider(assignedRider.phone)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="call" size={16} color="#ffffff" />
                </TouchableOpacity>
              )}
            </View>
          ) : isOrderFinished ? null : (
            <View style={styles.infoCallout}>
              <Ionicons
                name="information-circle-outline"
                size={18}
                color={theme.secondaryText}
              />
              <Text style={styles.infoCalloutText}>
                Delivery partner details will be available once the order is out for delivery.
              </Text>
            </View>
          )}
        </View>

        {/* Shipping Address Card */}
        {order.shippingAddress && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionCardHeader}>
              <Text style={styles.sectionTitle}>Delivery Address</Text>
              <Ionicons name="location-outline" size={20} color={theme.primary} />
            </View>

            <Text style={styles.addressName}>
              {order.shippingAddress.fullName}
            </Text>
            {order.shippingAddress.phone && (
              <Text style={styles.addressPhone}>
                +91 {order.shippingAddress.phone}
              </Text>
            )}
            <Text style={styles.addressText}>
              {[
                order.shippingAddress.street,
                order.shippingAddress.landmark,
                order.shippingAddress.city,
                order.shippingAddress.state,
                order.shippingAddress.pincode,
              ]
                .filter(Boolean)
                .join(", ")}
            </Text>
          </View>
        )}

        {/* Price Details Card (Collapsed by default, tap to expand) */}
        <View style={styles.sectionCard}>
          <TouchableOpacity
            style={styles.sectionCardHeader}
            activeOpacity={0.8}
            onPress={() => setIsPriceDetailsExpanded(!isPriceDetailsExpanded)}
          >
            <Text style={styles.sectionTitle}>Price details</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              {!isPriceDetailsExpanded && (
                <Text style={{ fontSize: 16, fontWeight: "800", color: theme.text }}>
                  ₹{order.payableAmount || order.totalAmount}
                </Text>
              )}
              <Ionicons
                name={isPriceDetailsExpanded ? "chevron-up" : "chevron-down"}
                size={20}
                color={theme.secondaryText}
              />
            </View>
          </TouchableOpacity>

          {isPriceDetailsExpanded && (
            <View style={{ marginTop: 12 }}>
              {/* Listing price (MRP) */}
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Listing price</Text>
                <Text style={styles.priceValue}>
                  ₹{order.mrpTotal || order.totalAmount}
                </Text>
              </View>

              {/* Selling price */}
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Selling price</Text>
                <Text style={styles.priceValue}>₹{order.totalAmount}</Text>
              </View>

              {/* Total fees accordion */}
              <TouchableOpacity
                style={styles.priceRow}
                activeOpacity={0.7}
                onPress={() => setIsFeesExpanded(!isFeesExpanded)}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Text style={styles.priceLabel}>Total fees</Text>
                  <Ionicons
                    name={isFeesExpanded ? "chevron-up" : "chevron-down"}
                    size={14}
                    color={theme.secondaryText}
                  />
                </View>
                <Text style={styles.priceValue}>
                  ₹{(order.shippingFee || 0) + (order.dynamicDeliverySurcharge || 0)}
                </Text>
              </TouchableOpacity>

              {isFeesExpanded && (
                <>
                  <View style={styles.priceSubRow}>
                    <Text style={styles.priceSubLabel}>Delivery Fee</Text>
                    <Text
                      style={[
                        styles.priceSubValue,
                        order.shippingFee === 0 && styles.freeValue,
                      ]}
                    >
                      {order.shippingFee === 0 ? "FREE" : `₹${order.shippingFee}`}
                    </Text>
                  </View>

                  {order.dynamicDeliverySurcharge > 0 && (
                    <View style={styles.priceSubRow}>
                      <Text style={styles.priceSubLabel}>Dynamic Delivery Surcharge</Text>
                      <Text style={styles.priceSubValue}>
                        ₹{order.dynamicDeliverySurcharge}
                      </Text>
                    </View>
                  )}
                </>
              )}

              {/* Discounts accordion */}
              {(order.productDiscount > 0 || order.discountAmount > 0) && (
                <>
                  <TouchableOpacity
                    style={styles.priceRow}
                    activeOpacity={0.7}
                    onPress={() => setIsDiscountExpanded(!isDiscountExpanded)}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Text style={styles.priceLabel}>Other discount</Text>
                      <Ionicons
                        name={isDiscountExpanded ? "chevron-up" : "chevron-down"}
                        size={14}
                        color={theme.secondaryText}
                      />
                    </View>
                    <Text style={[styles.priceValue, styles.discountValue]}>
                      -₹{(order.productDiscount || 0) + (order.discountAmount || 0)}
                    </Text>
                  </TouchableOpacity>

                  {isDiscountExpanded && (
                    <>
                      {order.productDiscount > 0 && (
                        <View style={styles.priceSubRow}>
                          <Text style={styles.priceSubLabel}>Product Discount</Text>
                          <Text style={[styles.priceSubValue, styles.discountValue]}>
                            -₹{order.productDiscount}
                          </Text>
                        </View>
                      )}

                      {order.discountAmount > 0 && (
                        <View style={styles.priceSubRow}>
                          <Text style={styles.priceSubLabel}>
                            Coupon ({order.couponCode || "Discount"})
                          </Text>
                          <Text style={[styles.priceSubValue, styles.discountValue]}>
                            -₹{order.discountAmount}
                          </Text>
                        </View>
                      )}
                    </>
                  )}
                </>
              )}

              <View style={styles.priceDivider} />

              {/* Total Amount */}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total amount</Text>
                <Text style={styles.totalValue}>
                  ₹{order.payableAmount || order.totalAmount}
                </Text>
              </View>

              {/* Paid By Box */}
              <View style={styles.paidByBox}>
                <View style={styles.paidByLeft}>
                  <Ionicons
                    name={isCod ? "cash-outline" : "card-outline"}
                    size={20}
                    color={theme.text}
                  />
                  <Text style={styles.paidByText}>
                    Paid By: {isCod ? "Cash on Delivery" : "Online (Razorpay)"}
                  </Text>
                </View>

                <View style={styles.paidStatusBadge}>
                  <Text style={styles.paidStatusText}>
                    {isCod ? "COD" : "PAID"}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Offers Earned Box */}
        {order.discountAmount > 0 && (
          <View style={styles.offersCard}>
            <View style={styles.offersLeft}>
              <Ionicons name="trophy-outline" size={20} color="#eab308" />
              <Text style={styles.offersText}>Offers applied on this order</Text>
            </View>
            <Text style={[styles.offersText, { color: "#10b981" }]}>
              Saved ₹{order.discountAmount}
            </Text>
          </View>
        )}

        {/* Action Buttons (Shop more, Support) */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.replace("/(tabs)/clothing/home")}
            activeOpacity={0.8}
          >
            <Ionicons name="bag-handle-outline" size={18} color="#ffffff" />
            <Text style={styles.primaryBtnText}>Continue Shopping</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={handleHelp}
            activeOpacity={0.8}
          >
            <Ionicons name="help-circle-outline" size={18} color={theme.text} />
            <Text style={styles.secondaryBtnText}>Need Help with this Order?</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeViewWrapper>
  );
}
