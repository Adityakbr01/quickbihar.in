import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Theme, useTheme } from "@/src/theme/Provider/ThemeProvider";
import { getMyOrdersRequest } from "../api/order.api";

const OrderListScreen = () => {
  const theme = useTheme();
  const styles = createOrderListStyles(theme);
  const router = useRouter();

  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchOrders();
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
      case "PENDING": return "#F59E0B"; // Amber 500
      case "PROCESSING": return "#3B82F6"; // Blue 500
      case "SHIPPED": return "#8B5CF6"; // Violet 500
      case "DELIVERED": return "#10B981"; // Emerald 500
      case "CANCELLED": return "#EF4444"; // Red 500
      default: return theme.secondaryText;
    }
  };

  const renderOrderItem = ({ item }: { item: any }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderId}>Order #{item.orderId}</Text>
          <Text style={styles.orderDate}>
            {new Date(item.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + "15" }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.itemsPreview}>
        {(item.items || []).slice(0, 3).map((orderItem: any, idx: number) => (
          <View key={idx} style={styles.itemThumb}>
            {/* Note: In a real app, we'd fetch the product image. 
                For now, we use a placeholder or the first item's image if available */}
             <MaterialCommunityIcons name="package-variant" size={24} color={theme.secondaryText} />
          </View>
        ))}
        {item.items.length > 3 && (
          <View style={styles.moreCount}>
            <Text style={styles.moreText}>+{item.items.length - 3}</Text>
          </View>
        )}
      </View>

      <View style={styles.orderFooter}>
        <View>
          <Text style={styles.totalLabel}>Total Paid</Text>
          <Text style={styles.totalValue}>₹{item.payableAmount.toLocaleString()}</Text>
        </View>
        <TouchableOpacity 
          style={styles.detailButton}
          onPress={() => router.push({
            pathname: "/order-success",
            params: { orderId: item.orderId }
          })}
        >
          <Text style={styles.detailButtonText}>Details</Text>
          <Ionicons name="chevron-forward" size={16} color={theme.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="package-variant-closed" size={80} color={theme.tertiaryBackground} />
      <Text style={styles.emptyTitle}>No Orders Yet</Text>
      <Text style={styles.emptySubtitle}>
        Looks like you haven't placed any orders yet. Start shopping to see them here!
      </Text>
      <TouchableOpacity 
        style={styles.shopButton}
        onPress={() => router.replace("/(tabs)/home")}
      >
        <Text style={styles.shopButtonText}>Start Shopping</Text>
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
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
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={theme.primary} />
        }
        ListEmptyComponent={renderEmpty}
      />
    </View>
  );
};

const createOrderListStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: theme.background,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.tertiaryBackground,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: theme.text,
    letterSpacing: -0.5,
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  orderCard: {
    backgroundColor: theme.tertiaryBackground,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  orderId: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.text,
  },
  orderDate: {
    fontSize: 13,
    color: theme.secondaryText,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  itemsPreview: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  itemThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: theme.background,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.border,
  },
  moreCount: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: theme.background,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.border,
  },
  moreText: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.secondaryText,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  totalLabel: {
    fontSize: 12,
    color: theme.secondaryText,
  },
  totalValue: {
    fontSize: 17,
    fontWeight: "900",
    color: theme.primary,
  },
  detailButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: theme.text,
    marginTop: 24,
  },
  emptySubtitle: {
    fontSize: 15,
    color: theme.secondaryText,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 22,
    paddingHorizontal: 40,
  },
  shopButton: {
    marginTop: 32,
    paddingHorizontal: 24,
    height: 50,
    borderRadius: 15,
    backgroundColor: theme.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  shopButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
});

export default OrderListScreen;
