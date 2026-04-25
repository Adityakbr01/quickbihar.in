import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  BackHandler,
  ScrollView,
  Share,
  ActivityIndicator,
  Platform
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { createOrderStyles } from "../style/orderStyles";
import * as Haptics from "expo-haptics";
import { getOrderByIdRequest } from "../api/order.api";

const OrderSuccessScreen = () => {
  const theme = useTheme();
  const styles = createOrderStyles(theme);
  const router = useRouter();
  const { orderId } = useLocalSearchParams();

  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Play haptic feedback on mount
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Fetch Order Details for the Receipt
    fetchOrderDetails();

    // Prevent back navigation to checkout
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      router.replace("/(tabs)/home");
      return true;
    });

    return () => backHandler.remove();
  }, []);

  const fetchOrderDetails = async () => {
    try {
      setIsLoading(true);
      if (typeof orderId === "string") {
        const response = await getOrderByIdRequest(orderId);
        setOrder(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch order details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (!order) return;

    try {
      const itemsList = order.items
        .map((item: any) => `• ${item.title} (x${item.quantity}) - ₹${item.price * item.quantity}`)
        .join("\n");

      const message = `🛍️ *Order Receipt - Quick Bihar*\n\n` +
        `*Order ID:* #${order.orderId}\n` +
        `*Status:* ${order.status}\n\n` +
        `*Items:*\n${itemsList}\n\n` +
        `*Bill Summary:*\n` +
        `Item Total: ₹${order.mrpTotal}\n` +
        `Discount: -₹${order.productDiscount + order.discountAmount}\n` +
        `Shipping: ${order.shippingFee === 0 ? "FREE" : "₹" + order.shippingFee}\n\n` +
        `*Total Paid: ₹${order.payableAmount}*\n\n` +
        `_Thank you for shopping with Quick Bihar!_`;

      await Share.share({
        message,
        title: `Receipt for Order #${order.orderId}`
      });
    } catch (error) {
      console.error("Error sharing receipt:", error);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.successContainer, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={styles.successContainer}>
      <TouchableOpacity style={styles.shareIcon} onPress={handleShare}>
        <Ionicons name="share-outline" size={22} color={theme.text} />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.successScroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignItems: "center" }}>
          <LottieView
            source={require("@/assets/lottie/successConfetti.json")}
            autoPlay
            loop={false}
            style={{ width: 200, height: 200 }}
          />

          <Text style={styles.successTitle}>Payment Successful!</Text>
          <Text style={styles.successSubtitle}>
            Your order has been placed and is being processed.
          </Text>
        </View>

        {/* Digital Receipt Card */}
        <View style={styles.receiptCard}>
          <View style={styles.receiptHeader}>
            <Text style={styles.receiptLabel}>Order ID</Text>
            <Text style={styles.receiptId}>#{order?.orderId}</Text>
          </View>

          <View style={styles.receiptDivider} />

          {/* Items List */}
          {order?.items.map((item: any, index: number) => (
            <View key={index} style={styles.receiptItem}>
              <View style={styles.receiptItemInfo}>
                <Text style={styles.receiptItemName} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.receiptItemVariant}>
                  Qty: {item.quantity} • {item.sku}
                </Text>
              </View>
              <Text style={styles.receiptItemPrice}>₹{item.price * item.quantity}</Text>
            </View>
          ))}

          <View style={styles.receiptDivider} />

          {/* Summary */}
          <View style={styles.receiptRow}>
            <Text style={styles.summaryLabel}>Item Total (MRP)</Text>
            <Text style={styles.summaryValue}>₹{order?.mrpTotal}</Text>
          </View>

          {order?.productDiscount > 0 && (
            <View style={styles.receiptRow}>
              <Text style={styles.summaryLabel}>Product Discount</Text>
              <Text style={[styles.summaryValue, { color: "#059669" }]}>-₹{order?.productDiscount}</Text>
            </View>
          )}

          <View style={styles.receiptRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₹{order?.totalAmount}</Text>
          </View>

          <View style={styles.receiptRow}>
            <Text style={styles.summaryLabel}>Shipping Fee</Text>
            <Text style={styles.summaryValue}>
              {order?.shippingFee === 0 ? "FREE" : `₹${order?.shippingFee}`}
            </Text>
          </View>

          {order?.discountAmount > 0 && (
            <View style={styles.receiptRow}>
              <Text style={styles.summaryLabel}>Coupon ({order?.couponCode})</Text>
              <Text style={[styles.summaryValue, { color: "#059669" }]}>-₹{order?.discountAmount}</Text>
            </View>
          )}

          <View style={styles.receiptTotalRow}>
            <Text style={styles.receiptTotalLabel}>Total Paid</Text>
            <Text style={styles.receiptTotalValue}>₹{order?.payableAmount}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryActionButton]}
            onPress={() => router.replace("/(tabs)/home")}
          >
            <Ionicons name="cart-outline" size={20} color="#fff" />
            <Text style={[styles.actionButtonText, { color: "#fff" }]}>Continue Shopping</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryActionButton]}
            onPress={() => router.push("/account/orders")}
          >
            <MaterialCommunityIcons name="package-variant-closed" size={20} color={theme.text} />
            <Text style={[styles.actionButtonText, { color: theme.text }]}>View My Orders</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default OrderSuccessScreen;
