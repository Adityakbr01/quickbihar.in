import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Modal,
  TextInput,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft01Icon,
  FilterIcon,
  CheckmarkCircle02Icon,
  CancelCircleIcon,
  DeliveryTruck01Icon,
  Search01Icon,
  ShoppingBag01Icon
} from "@hugeicons/core-free-icons";
import SafeViewWrapper from "@/src/provider/SafeViewWrapper";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAdminOrdersRequest, updateOrderStatusRequest } from "../../order/api/order.api";
import dayjs from "dayjs";
import { socketClient } from "@/src/lib/socket";
import { SocketEvents } from "@/src/constants/socketEvents";
import Toast from "react-native-toast-message";
import { createStyles } from "../style/OrderAdminScreen.style";

const STATUS_COLORS: any = {
  CONFIRMED: "#10B981",
  PENDING_PAYMENT: "#F59E0B",
  SHIPPED: "#3B82F6",
  DELIVERED: "#8B5CF6",
  REJECTED: "#EF4444",
  CANCELLED: "#6B7280",
};

const OrderAdminScreen = () => {
  const theme = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const queryClient = useQueryClient();

  // Filtering State
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: getAdminOrdersRequest,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, reason }: any) => updateOrderStatusRequest(id, status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      setModalVisible(false);
      setRejectionReason("");
      Toast.show({
        type: "success",
        text1: "Status Updated",
        text2: "Order status has been successfully updated.",
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: "error",
        text1: "Update Failed",
        text2: error.response?.data?.message || "Something went wrong",
      });
    },
  });

  useEffect(() => {
    console.log("[OrderAdminScreen] Socket connected:", socketClient.isConnected);

    socketClient.on(SocketEvents.NEW_ORDER, (data) => {
      Toast.show({
        type: "info",
        text1: "New Order! 🚀",
        text2: `Order ${data.orderId} from ${data.fullName}`,
      });
      refetch();
    });

    socketClient.on(SocketEvents.ORDER_CONFIRMED, () => {
      refetch();
    });

    return () => {
      socketClient.off(SocketEvents.NEW_ORDER);
      socketClient.off(SocketEvents.ORDER_CONFIRMED);
    };
  }, [refetch]);

  // Unified Filtering Logic
  const filteredOrders = useMemo(() => {
    return orders?.data?.filter((order: any) => {
      const matchesStatus = selectedStatus === "ALL" || order.status === selectedStatus;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        order.orderId.toLowerCase().includes(q) ||
        order.shippingAddress.fullName.toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    }) || [];
  }, [orders, selectedStatus, searchQuery]);

  const renderOrderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => {
        setSelectedOrder(item);
        setModalVisible(true);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderId}>{item.orderId}</Text>
          <Text style={styles.customerName}>
            {item.shippingAddress.fullName}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] + "15" }]}>
          <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>
            {item.status.replace("_", " ")}
          </Text>
        </View>
      </View>

      <View style={styles.orderFooter}>
        <Text style={styles.orderDate}>
          {dayjs(item.createdAt).format("DD MMM, YYYY • hh:mm A")}
        </Text>
        <Text style={styles.orderAmount}>
          ₹{item.payableAmount.toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const handleStatusUpdate = (status: string) => {
    console.log(`[OrderAdminScreen] Attempting status update to ${status} for order ${selectedOrder?.orderId}`);
    if ((status === "REJECTED" || status === "CANCELLED") && !rejectionReason) {
      Toast.show({
        type: "error",
        text1: "Reason Required",
        text2: "Please provide a reason for cancellation/rejection.",
      });
      return;
    }

    updateStatusMutation.mutate({
      id: selectedOrder._id,
      status,
      reason: rejectionReason,
    });
  };

  return (
    <SafeViewWrapper>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={22} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Management</Text>
          <TouchableOpacity style={styles.filterButton}>
            <HugeiconsIcon icon={FilterIcon} size={20} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchWrapper}>
            <HugeiconsIcon icon={Search01Icon} size={18} color={theme.secondaryText} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by ID or Name..."
              placeholderTextColor={theme.tertiaryText}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <HugeiconsIcon icon={CancelCircleIcon} size={18} color={theme.secondaryText} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Status Tabs */}
        <View style={styles.filterTabs}>
          <FlatList
            data={["ALL", "PENDING_PAYMENT", "CONFIRMED", "SHIPPED", "DELIVERED", "REJECTED", "CANCELLED"]}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
            renderItem={({ item }) => {
              const isActive = selectedStatus === item;
              return (
                <TouchableOpacity
                  onPress={() => setSelectedStatus(item)}
                  style={[styles.tab, isActive && styles.tabActive]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {item.replace("_", " ")}
                  </Text>
                </TouchableOpacity>
              );
            }}
            keyExtractor={(item) => item}
          />
        </View>

        {/* Orders List */}
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : (
          <FlatList
            data={filteredOrders}
            renderItem={renderOrderItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <HugeiconsIcon icon={ShoppingBag01Icon} size={48} color={theme.tertiaryText} />
                <Text style={[styles.emptyText, { marginTop: 10 }]}>
                  No matching orders found.
                </Text>
              </View>
            }
          />
        )}

        {/* Status Update Modal */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Update Order: {selectedOrder?.orderId}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <HugeiconsIcon icon={CancelCircleIcon} size={24} color={theme.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.actionGrid}>
                {[
                  { label: "Confirm", status: "CONFIRMED", icon: CheckmarkCircle02Icon, color: STATUS_COLORS.CONFIRMED },
                  { label: "Ship", status: "SHIPPED", icon: DeliveryTruck01Icon, color: STATUS_COLORS.SHIPPED },
                  { label: "Deliver", status: "DELIVERED", icon: CheckmarkCircle02Icon, color: STATUS_COLORS.DELIVERED },
                  { label: "Reject", status: "REJECTED", icon: CancelCircleIcon, color: STATUS_COLORS.REJECTED },
                ].map((action) => (
                  <TouchableOpacity
                    key={action.status}
                    style={[styles.actionButton, { borderColor: action.color + "40" }]}
                    onPress={() => handleStatusUpdate(action.status)}
                    activeOpacity={0.8}
                  >
                    <HugeiconsIcon icon={action.icon} size={24} color={action.color} />
                    <Text style={[styles.actionLabel, { color: action.color }]}>{action.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {(selectedOrder?.status !== "REJECTED" && selectedOrder?.status !== "CANCELLED") && (
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Remarks (Reason for Reject/Cancel)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Provide context for the customer..."
                    placeholderTextColor={theme.tertiaryText}
                    value={rejectionReason}
                    onChangeText={setRejectionReason}
                    multiline
                  />
                </View>
              )}

              {updateStatusMutation.isPending && (
                <ActivityIndicator size="small" color={theme.primary} style={{ marginTop: 20 }} />
              )}
            </View>
          </View>
        </Modal>
      </View>
    </SafeViewWrapper>
  );
};

export default OrderAdminScreen;
