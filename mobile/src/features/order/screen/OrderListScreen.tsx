import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { getMyOrdersRequest } from "../api/order.api";
import { socketClient } from "@/src/lib/socket";
import { SocketEvents } from "@/src/constants/socketEvents";
import Toast from "react-native-toast-message";
import SafeViewWrapper from "@/src/provider/SafeViewWrapper";
import dayjs from "dayjs";
import { createStyles } from "../style/OrderListScreen.style";

const OrderListScreen = () => {
  const theme = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();

  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchOrders();

    // Listen for status updates in real-time
    console.log("[OrderListScreen] Socket connected:", socketClient.isConnected);

    socketClient.on(SocketEvents.ORDER_STATUS_UPDATE, (data) => {
      console.log("[OrderListScreen] Received update event:", data);

      // Update local state and show a toast
      fetchOrders();

      Toast.show({
        type: "info",
        text1: "Order Update! 📦",
        text2: data.message || `Your order status is now ${data.status}`,
      });
    });

    return () => {
      socketClient.off(SocketEvents.ORDER_STATUS_UPDATE);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const response = await getMyOrdersRequest();
      setOrders(response.data || []);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchOrders();
    setIsRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING":
      case "PENDING_PAYMENT": return "#F59E0B";
      case "CONFIRMED":
      case "PROCESSING": return "#10B981";
      case "SHIPPED": return "#3B82F6";
      case "DELIVERED": return "#8B5CF6";
      case "CANCELLED":
      case "REJECTED": return "#EF4444";
      default: return theme.secondaryText;
    }
  };

  const renderOrderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.orderCard}
      activeOpacity={0.8}
      onPress={() => router.push({
        pathname: "/order-success",
        params: { orderId: item.orderId }
      })}
    >
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderId}>Order #{item.orderId}</Text>
          <Text style={styles.orderDate}>
            {dayjs(item.createdAt).format("DD MMM, YYYY")}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + "15" }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.replace("_", " ")}
          </Text>
        </View>
      </View>

      <View style={styles.itemsPreview}>
        <View style={styles.itemThumb}>
          <MaterialCommunityIcons name="package-variant-closed" size={24} color={theme.primary} />
        </View>
        <Text style={styles.itemsText} numberOfLines={1}>
          {item.items.length} {item.items.length === 1 ? 'item' : 'items'} in this order
        </Text>
        {item.items.length > 1 && (
          <View style={styles.moreCount}>
            <Text style={styles.moreText}>+{item.items.length - 1}</Text>
          </View>
        )}
      </View>

      <View style={styles.orderFooter}>
        <View>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalValue}>₹{item.payableAmount.toLocaleString()}</Text>
        </View>
        <View style={styles.detailButton}>
          <Text style={styles.detailButtonText}>Details</Text>
          <Ionicons name="chevron-forward" size={14} color={theme.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="shopping-outline"
        size={100}
        color={theme.tertiaryBackground}
      />
      <Text style={styles.emptyTitle}>No Orders Yet</Text>
      <Text style={styles.emptySubtitle}>
        You hasn't placed any orders yet. Start shopping to see them here!
      </Text>
      <TouchableOpacity
        style={styles.shopButton}
        onPress={() => router.replace("/(tabs)/home")}
      >
        <Text style={styles.shopButtonText}>Explore Products</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeViewWrapper>
      <Stack.Screen
        options={{
          headerShown: false, // Fix: Hide the native header to prevent duplicates
        }}
      />

      <View style={styles.container}>
        {/* Custom Premium Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Orders</Text>
          <View style={{ width: 44 }} />
        </View>

        <FlatList
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
          ListEmptyComponent={renderEmpty}
        />
      </View>
    </SafeViewWrapper>
  );
};

export default OrderListScreen;
