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
import Toast from "react-native-toast-message";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import SafeViewWrapper from "@/src/provider/SafeViewWrapper";
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

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  // Real-time socket updates
  useEffect(() => {
    const socket = useSocketStore.getState().socket;
    if (!socket) return;

    const handleUpdate = (data: any) => {
      console.log("[OrderDetailScreen] Order event received:", data);
      fetchOrderDetails(false);
      Toast.show({
        type: "info",
        text1: "Order Status Updated 🚀",
        text2: data.message || `Status updated to ${data.status || "latest"}`,
      });
    };

    socket.on(SocketEvents.ORDER_STATUS_UPDATE, handleUpdate);
    socket.on(SocketEvents.FULFILLMENT_EVENT, handleUpdate);

    return () => {
      socket.off(SocketEvents.ORDER_STATUS_UPDATE, handleUpdate);
      socket.off(SocketEvents.FULFILLMENT_EVENT, handleUpdate);
    };
  }, [orderId]);

  const fetchOrderDetails = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      const res = await getOrderByIdRequest(orderId);
      const data = res?.data || res;
      setOrder(data);
    } catch (err: any) {
      console.error("[OrderDetailScreen] Fetch error:", err);
      Toast.show({
        type: "error",
        text1: "Failed to load order details",
        text2: err?.message || "Please check your network connection.",
      });
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
    Toast.show({
      type: "success",
      text1: "Order ID",
      text2: `#${order?.orderId || orderId}`,
    });
  };

  const handleShare = async () => {
    if (!order) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const itemsText = (order.items || [])
        .map((i: any) => `• ${i.title} (x${i.quantity})`)
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
          `_Track your order on Quick Bihar!_`,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleHelp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL("tel:9304922632").catch(() => {
      Toast.show({
        type: "info",
        text1: "Customer Support",
        text2: "Helpline: +91 9304922632",
      });
    });
  };

  const handleCallRider = (phone?: string) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`);
  };



  if (isLoading && !order) {
    return (
      <SafeViewWrapper>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
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
            onPress={() => router.back()}
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
            onPress={() => router.back()}
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

        {/* Multi-SubOrder Tabs (if multi-vendor package) */}
        {subOrders.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.subOrderTabsContainer}
          >
            {subOrders.map((sub: any, idx: number) => {
              const isSelected = idx === selectedSubOrderIndex;
              return (
                <TouchableOpacity
                  key={sub.subOrderId || idx}
                  style={[
                    styles.subOrderTab,
                    isSelected && styles.subOrderTabActive,
                  ]}
                  onPress={() => setSelectedSubOrderIndex(idx)}
                >
                  <Text
                    style={[
                      styles.subOrderTabText,
                      isSelected && styles.subOrderTabTextActive,
                    ]}
                  >
                    Package {idx + 1} ({sub.subOrderId || `S${idx + 1}`})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Product Items List (Matches Reference UI Image 1) */}
        {itemsToDisplay.map((item: any, idx: number) => {
          const imageUrl =
            item.productId?.images?.[0] ||
            item.productId?.thumbnail ||
            item.productId?.mainImage ||
            item.image;

          return (
            <View key={item.sku || idx} style={styles.productCard}>
              <View style={styles.productImageContainer}>
                {imageUrl ? (
                  <Image
                    source={{ uri: imageUrl }}
                    style={styles.productImage}
                    contentFit="cover"
                    transition={200}
                  />
                ) : (
                  <MaterialCommunityIcons
                    name="shopping-outline"
                    size={32}
                    color={theme.primary}
                  />
                )}
              </View>

              <View style={styles.productInfo}>
                <Text style={styles.productTitle} numberOfLines={2}>
                  {item.title}
                </Text>

                {(item.color || item.size) && (
                  <Text style={styles.productVariantText}>
                    {[
                      item.color ? `Color: ${item.color}` : null,
                      item.size ? `Size: ${item.size}` : null,
                    ]
                      .filter(Boolean)
                      .join(" • ")}
                  </Text>
                )}

                <View style={styles.productPriceRow}>
                  <Text style={styles.productPrice}>
                    ₹{item.price * (item.quantity || 1)}
                  </Text>
                  <View style={styles.productQtyBadge}>
                    <Text style={styles.productQtyText}>
                      Qty: {item.quantity || 1}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          );
        })}

        {/* Prominent Delivery OTP Card (When Active & Available) */}
        {deliveryOtp && currentStatus !== "DELIVERED" && currentStatus !== "CANCELLED" && (
          <View style={styles.otpCard}>
            <View style={styles.otpHeader}>
              <View style={styles.otpTitleContainer}>
                <Ionicons name="shield-checkmark" size={18} color="#15803d" />
                <Text style={styles.otpTitle}>Delivery OTP</Text>
              </View>
              <View style={styles.otpBadge}>
                <Text style={styles.otpBadgeText}>Required for Delivery</Text>
              </View>
            </View>

            <View style={styles.otpCodeRow}>
              {deliveryOtp.split("").map((digit: string, i: number) => (
                <View key={i} style={styles.otpDigitBox}>
                  <Text style={styles.otpDigitText}>{digit}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.otpSubtitle}>
              Please share this 6-digit secure code with the delivery partner upon arrival.
            </Text>
          </View>
        )}

        {/* Order Status & Progress Card (Matches Image 1 & Image 3) */}
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

          {/* Horizontal Stepper (Compact Mode - Image 1) */}
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

          {/* Vertical Detailed Timeline (Expanded Mode - Image 3) */}
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

          {/* Rider / Delivery Partner Card (if assigned) */}
          {assignedRider ? (
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

              {assignedRider.phone && (
                <TouchableOpacity
                  style={styles.riderCallButton}
                  onPress={() => handleCallRider(assignedRider.phone)}
                >
                  <Ionicons name="call" size={16} color="#ffffff" />
                </TouchableOpacity>
              )}
            </View>
          ) : (
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

        {/* Price Details Card (Matches Image 2 & Image 4) */}
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

              {/* Paid By Box (Matches Screenshot) */}
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

        {/* Offers Earned Box (Matches Image 4) */}
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
