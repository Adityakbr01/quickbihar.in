import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { createNotificationStyles } from "../styles/notificationStyles";
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  INotificationItem,
} from "../hooks/useNotifications";
import SafeViewWrapper from "@/src/provider/SafeViewWrapper";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { FlashList } from "@shopify/flash-list";
import * as Haptics from "expo-haptics";

dayjs.extend(relativeTime);

const NotificationScreen = () => {
  const theme = useTheme() as any;
  const styles = createNotificationStyles(theme);
  const router = useRouter();

  const { data: notifications = [], isLoading, refetch } = useNotifications();
  const { mutate: markAsRead } = useMarkAsRead();
  const { mutate: markAllAsRead, isPending: isMarkingAll } = useMarkAllAsRead();

  const [activeTab, setActiveTab] = useState<"all" | "orders" | "promotions" | "updates">("all");

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "all") return true;
    if (activeTab === "orders") return n.channel === "orders";
    if (activeTab === "promotions") return n.channel === "promotions";
    if (activeTab === "updates") return n.channel === "general" || n.channel === "system";
    return true;
  });

  const handleNotificationPress = (item: INotificationItem) => {
    if (!item.isRead) {
      markAsRead(item._id);
    }

    if (item.redirectType === "product" && item.redirectId) {
      router.push({
        pathname: "/product/[id]" as any,
        params: { id: item.redirectId },
      });
    } else if (item.redirectType === "category" && item.redirectId) {
      router.push({
        pathname: "/(tabs)/clothing/search" as any,
        params: {
          categoryId: item.redirectId,
          categoryName: item.title,
        },
      });
    } else if (item.redirectType === "external" && item.externalUrl) {
      Linking.openURL(item.externalUrl).catch((err) => {
        console.error("Failed to open redirection URL:", err);
      });
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "orders":
        return "bag-handle-outline";
      case "promotions":
        return "gift-outline";
      case "system":
        return "alert-circle-outline";
      default:
        return "chatbubble-ellipses-outline";
    }
  };

  const renderNotificationItem = ({ item }: { item: INotificationItem }) => {
    return (
      <TouchableOpacity
        style={[styles.card, !item.isRead && styles.cardUnread]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.notificationImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.iconWrapper, !item.isRead && styles.iconWrapperUnread]}>
            <Ionicons
              name={getChannelIcon(item.channel) as any}
              size={22}
              color={item.isRead ? theme.secondaryText : theme.primary}
            />
          </View>
        )}

        <View style={styles.contentWrapper}>
          <View style={styles.titleRow}>
            <Text
              style={[styles.title, !item.isRead && styles.titleUnread]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Text style={styles.timeText}>
              {dayjs(item.createdAt).fromNow(true)} ago
            </Text>
          </View>
          <Text style={styles.description} numberOfLines={3}>
            {item.description}
          </Text>
        </View>

        {!item.isRead && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  const renderTabs = () => {
    const tabs: { id: typeof activeTab; label: string; icon: string }[] = [
      { id: "all", label: "All", icon: "albums-outline" },
      { id: "orders", label: "Orders", icon: "cart-outline" },
      { id: "promotions", label: "Offers", icon: "pricetag-outline" },
      { id: "updates", label: "Updates", icon: "notifications-outline" },
    ];

    return (
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabButton, isActive && styles.activeTabButton]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => null);
                setActiveTab(tab.id);
              }}
            >
              <Ionicons
                name={tab.icon as any}
                size={15}
                color={isActive ? "#FFFFFF" : theme.secondaryText}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={{
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: theme.tertiaryBackground,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 8,
      }}>
        <Ionicons
          name="notifications-off-outline"
          size={50}
          color={theme.secondaryText}
        />
      </View>
      <Text style={styles.emptyTitle}>No Notifications Yet</Text>
      <Text style={styles.emptySubtitle}>
        We'll keep you updated with order status, marketing updates, and system
        alerts here.
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeViewWrapper>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.unreadCountText}>
            {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
          </Text>
          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => null);
                markAllAsRead();
              }}
              disabled={isMarkingAll}
            >
              <Text style={styles.markAllText}>
                {isMarkingAll ? "Marking..." : "Mark all as read"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Tabs */}
        {renderTabs()}

        {/* Notification List */}
        <FlashList
          data={filteredNotifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={[
            styles.listContent,
            filteredNotifications.length === 0 && { flex: 1 },
          ]}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} />
          }
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeViewWrapper>
  );
};

export default NotificationScreen;
