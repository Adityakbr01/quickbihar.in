import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Pressable,
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

type TabId = "all" | "orders" | "promotions" | "updates";

interface Tab {
  id: TabId;
  label: string;
  icon: string;
  match: (channel: string) => boolean;
}

const TABS: Tab[] = [
  {
    id: "all",
    label: "All",
    icon: "albums-outline",
    match: () => true,
  },
  {
    id: "orders",
    label: "Orders",
    icon: "bag-handle-outline",
    match: (c) => c === "orders",
  },
  {
    id: "promotions",
    label: "Offers",
    icon: "pricetag-outline",
    match: (c) => c === "promotions",
  },
  {
    id: "updates",
    label: "Updates",
    icon: "notifications-outline",
    match: (c) => c === "general" || c === "system",
  },
];

// Channel → icon + accent colour mapping. Colours are kept as static
// brand-recognisable hues so the same channel always reads the same way.
const CHANNEL_META: Record<
  string,
  { icon: string; color: string; bg: string; label: string }
> = {
  orders: {
    icon: "bag-handle-outline",
    color: "#0EA5E9",
    bg: "rgba(14, 165, 233, 0.14)",
    label: "Order",
  },
  promotions: {
    icon: "pricetag-outline",
    color: "#F97316",
    bg: "rgba(249, 115, 22, 0.14)",
    label: "Offer",
  },
  system: {
    icon: "alert-circle-outline",
    color: "#EF4444",
    bg: "rgba(239, 68, 68, 0.14)",
    label: "System",
  },
  general: {
    icon: "chatbubble-ellipses-outline",
    color: "#8B5CF6",
    bg: "rgba(139, 92, 246, 0.14)",
    label: "Update",
  },
};

const NotificationScreen = () => {
  const theme = useTheme() as any;
  const styles = createNotificationStyles(theme);
  const router = useRouter();

  const { data: notifications = [], isLoading, refetch } = useNotifications();
  const { mutate: markAsRead } = useMarkAsRead();
  const { mutate: markAllAsRead, isPending: isMarkingAll } = useMarkAllAsRead();

  const [activeTab, setActiveTab] = useState<TabId>("all");

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications],
  );

  const activeTabDef = TABS.find((t) => t.id === activeTab)!;

  const filtered = useMemo(
    () => notifications.filter((n) => activeTabDef.match(n.channel)),
    [notifications, activeTabDef],
  );

  // Group notifications into Today / Yesterday / Earlier for a
  // familiar inbox-like feel.
  const grouped = useMemo(() => {
    const today: INotificationItem[] = [];
    const yesterday: INotificationItem[] = [];
    const earlier: INotificationItem[] = [];
    const now = dayjs();
    filtered.forEach((n) => {
      const d = dayjs(n.createdAt);
      if (d.isSame(now, "day")) today.push(n);
      else if (d.isSame(now.subtract(1, "day"), "day")) yesterday.push(n);
      else earlier.push(n);
    });
    return { today, yesterday, earlier };
  }, [filtered]);

  const tabCounts = useMemo(() => {
    const counts: Record<TabId, number> = {
      all: notifications.length,
      orders: 0,
      promotions: 0,
      updates: 0,
    };
    notifications.forEach((n) => {
      const t = TABS.find((tab) => tab.match(n.channel));
      if (t && t.id !== "all") counts[t.id] += 1;
    });
    return counts;
  }, [notifications]);

  const handleNotificationPress = (item: INotificationItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => null);
    if (!item.isRead) markAsRead(item._id);

    if (item.redirectType === "product" && item.redirectId) {
      router.push({ pathname: "/product/[id]" as any, params: { id: item.redirectId } });
    } else if (item.redirectType === "category" && item.redirectId) {
      router.push({
        pathname: "/(tabs)/clothing/search" as any,
        params: { categoryId: item.redirectId, categoryName: item.title },
      });
    } else if (item.redirectType === "mall" && item.redirectId) {
      router.push({ pathname: "/mall/[id]" as any, params: { id: item.redirectId } });
    } else if (item.redirectType === "external" && item.externalUrl) {
      Linking.openURL(item.externalUrl).catch((err) =>
        console.error("Failed to open redirection URL:", err),
      );
    }
  };

  const handleMarkAll = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => null,
    );
    markAllAsRead();
  };

  const renderItem = ({ item }: { item: INotificationItem }) => {
    const isRich = item.notificationType === "RICH" && !!item.imageUrl;
    const meta = CHANNEL_META[item.channel] || CHANNEL_META.general;
    const time = dayjs(item.createdAt).fromNow(true);
    const fullTime = dayjs(item.createdAt).format("MMM D, h:mm A");

    return (
      <TouchableOpacity
        style={[styles.card, !item.isRead && styles.cardUnread]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.75}
      >
        {/* Unread accent strip */}
        {!item.isRead && <View style={styles.unreadAccent} />}

        {/* Channel icon */}
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: !item.isRead ? meta.bg : theme.secondaryBackground },
          ]}
        >
          <Ionicons
            name={(item.imageUrl && !isRich ? "" : meta.icon) as any}
            size={22}
            color={!item.isRead ? meta.color : theme.secondaryText}
          />
        </View>

        <View style={styles.content}>
          {/* Title row */}
          <View style={styles.titleRow}>
            <Text
              style={[styles.title, !item.isRead && styles.titleUnread]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            {!item.isRead && <View style={styles.unreadDot} />}
          </View>

          {/* Channel tag + time */}
          <View style={styles.metaRow}>
            <View style={styles.channelTag}>
              <Text style={styles.channelTagText}>{meta.label}</Text>
            </View>
            <Ionicons
              name="ellipse"
              size={3}
              color={theme.tertiaryText}
              style={{ marginHorizontal: 2 }}
            />
            <Text style={styles.timeText}>{fullTime}</Text>
            <Text style={[styles.timeText, { opacity: 0.6 }]}>· {time}</Text>
          </View>

          {/* Description */}
          <Text
            style={[
              styles.description,
              !item.isRead && styles.descriptionUnread,
            ]}
            numberOfLines={isRich ? 2 : 3}
          >
            {item.description}
          </Text>

          {/* Rich card image */}
          {isRich && (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.richBanner}
              resizeMode="cover"
            />
          )}

          {/* Rich card action */}
          {isRich && item.redirectType !== "none" && (
            <View style={styles.richActionRow}>
              <TouchableOpacity
                style={styles.richActionBtn}
                onPress={() => handleNotificationPress(item)}
                activeOpacity={0.85}
              >
                <Text style={styles.richActionBtnText}>
                  {item.actionButtonText ||
                    (item.redirectType === "product" ? "Buy Now" : "View Details")}
                </Text>
                <Ionicons name="arrow-forward" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = (label: string, count: number) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{label}</Text>
      <Text style={styles.sectionCount}>· {count}</Text>
      <View style={styles.sectionLine} />
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabsWrapper}>
      <View style={styles.tabsContainer}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const count = tabCounts[tab.id];
          return (
            <Pressable
              key={tab.id}
              style={[styles.tabButton, isActive && styles.activeTabButton]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
                  () => null,
                );
                setActiveTab(tab.id);
              }}
              android_ripple={{ color: theme.primary + "20", borderless: false }}
            >
              <Ionicons
                name={tab.icon as any}
                size={14}
                color={isActive ? theme.text : theme.secondaryText}
              />
              <Text
                style={[styles.tabLabel, isActive && styles.activeTabLabel]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
              {count > 0 && (
                <View
                  style={[
                    styles.tabCountPill,
                    !isActive && { backgroundColor: theme.tertiaryBackground },
                  ]}
                >
                  <Text
                    style={[
                      styles.tabCountText,
                      !isActive && { color: theme.secondaryText },
                    ]}
                  >
                    {count > 99 ? "99+" : count}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View
        style={[
          styles.emptyIconWrap,
          { backgroundColor: theme.primary + "15" },
        ]}
      >
        <Ionicons
          name={activeTab === "all" ? "notifications-off-outline" : "file-tray-outline"}
          size={52}
          color={theme.primary}
        />
      </View>
      <Text style={styles.emptyTitle}>
        {activeTab === "all" ? "No notifications yet" : "Nothing here yet"}
      </Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === "all"
          ? "We'll let you know about order updates, exclusive offers, and important account changes right here."
          : activeTab === "orders"
          ? "Order tracking updates will appear here once you place an order."
          : activeTab === "promotions"
          ? "Personalised offers and deals will show up here. Stay tuned!"
          : "System messages and general updates from QuickBihar will land here."}
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

  // Build a flat list of items with synthetic section header rows so
  // FlashList can render the grouped data without a SectionList.
  type Row =
    | { type: "header"; key: string; label: string; count: number }
    | { type: "item"; key: string; item: INotificationItem };

  const rows: Row[] = [];
  if (grouped.today.length) {
    rows.push({ type: "header", key: "h-today", label: "Today", count: grouped.today.length });
    grouped.today.forEach((n) => rows.push({ type: "item", key: n._id, item: n }));
  }
  if (grouped.yesterday.length) {
    rows.push({ type: "header", key: "h-yest", label: "Yesterday", count: grouped.yesterday.length });
    grouped.yesterday.forEach((n) => rows.push({ type: "item", key: n._id, item: n }));
  }
  if (grouped.earlier.length) {
    rows.push({ type: "header", key: "h-earl", label: "Earlier", count: grouped.earlier.length });
    grouped.earlier.forEach((n) => rows.push({ type: "item", key: n._id, item: n }));
  }

  return (
    <SafeViewWrapper>
      <View style={styles.container}>
        {/* Top app bar */}
        <View style={styles.appBar}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
                () => null,
              );
              if (router.canGoBack()) router.back();
              else router.replace("/account/profile-info" as any);
            }}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={22} color={theme.text} />
          </TouchableOpacity>

          <View style={styles.appBarTitleWrap}>
            <Text style={styles.appBarTitle}>Notifications</Text>
            <Text style={styles.appBarSubtitle}>
              {unreadCount > 0
                ? `${unreadCount} unread · ${notifications.length} total`
                : `${notifications.length} notification${notifications.length === 1 ? "" : "s"}`}
            </Text>
          </View>

          {unreadCount > 0 ? (
            <TouchableOpacity
              onPress={handleMarkAll}
              disabled={isMarkingAll}
              style={[styles.markAllBtn, isMarkingAll && styles.markAllBtnDisabled]}
              activeOpacity={0.7}
            >
              {isMarkingAll ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <>
                  <Ionicons name="checkmark-done" size={14} color={theme.primary} />
                  <Text style={styles.markAllText}>Mark all</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>

        {/* Filter tabs */}
        {renderTabs()}

        {/* Notification list */}
        <FlashList
          data={rows}
          renderItem={({ item: row }) =>
            row.type === "header" ? (
              renderSectionHeader(row.label, row.count)
            ) : (
              <>{renderItem({ item: row.item })}</>
            )
          }
          keyExtractor={(row) => row.key}
          contentContainerStyle={[
            styles.listContent,
            rows.length === 0 && { flex: 1 },
          ]}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor={theme.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeViewWrapper>
  );
};

export default NotificationScreen;
