import React, { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Bell, BellOff, CheckCheck, ChevronLeft, Circle, CircleAlert, Inbox, Layers, MessageCircle, ShoppingBag, Tag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { goBack, goTo } from "@/src/utils/navigation";
import { useModuleTheme, type ModuleVariant } from "@/src/theme/useModuleTheme";
import { cn } from "@/src/lib/utils";
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  INotificationItem,
} from "../hooks/useNotifications";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import * as Haptics from "@/lib/haptics";

dayjs.extend(relativeTime);

type TabId = "all" | "orders" | "promotions" | "updates";

interface Tab {
  id: TabId;
  label: string;
  icon: LucideIcon;
  match: (channel: string) => boolean;
}

const TABS: Tab[] = [
  {
    id: "all",
    label: "All",
    icon: Layers,
    match: () => true,
  },
  {
    id: "orders",
    label: "Orders",
    icon: ShoppingBag,
    match: (c) => c === "orders",
  },
  {
    id: "promotions",
    label: "Offers",
    icon: Tag,
    match: (c) => c === "promotions",
  },
  {
    id: "updates",
    label: "Updates",
    icon: Bell,
    match: (c) => c === "general" || c === "system",
  },
];

// Channel → icon + accent colour mapping. Colours are kept as static
// brand-recognisable hues so the same channel always reads the same way.
const CHANNEL_META: Record<
  string,
  { icon: LucideIcon; color: string; bg: string; label: string }
> = {
  orders: {
    icon: ShoppingBag,
    color: "#0EA5E9",
    bg: "rgba(14, 165, 233, 0.14)",
    label: "Order",
  },
  promotions: {
    icon: Tag,
    color: "#F97316",
    bg: "rgba(249, 115, 22, 0.14)",
    label: "Offer",
  },
  system: {
    icon: CircleAlert,
    color: "#EF4444",
    bg: "rgba(239, 68, 68, 0.14)",
    label: "System",
  },
  general: {
    icon: MessageCircle,
    color: "#8B5CF6",
    bg: "rgba(139, 92, 246, 0.14)",
    label: "Update",
  },
};

const NotificationScreen = ({ variant = "default" }: { variant?: ModuleVariant } = {}) => {
  // In the jewelery catalogue the same screen renders in the jewellery
  // palette via the module theme — data, tabs, and actions stay identical.
  const theme = useModuleTheme(variant);
  const navigate = useNavigate();

  const { data: notifications = [], isLoading } = useNotifications();
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
      goTo(navigate, { pathname: "/product/[id]" as any, params: { id: item.redirectId } });
    } else if (item.redirectType === "category" && item.redirectId) {
      goTo(navigate, {
        pathname: "/(tabs)/clothing/search" as any,
        params: { categoryId: item.redirectId, categoryName: item.title },
      });
    } else if (item.redirectType === "mall" && item.redirectId) {
      goTo(navigate, { pathname: "/mall/[id]" as any, params: { id: item.redirectId } });
    } else if (item.redirectType === "external" && item.externalUrl) {
      try {
        window.open(item.externalUrl, "_blank");
      } catch (err) {
        console.error("Failed to open redirection URL:", err);
      }
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
      <div
        onClick={() => handleNotificationPress(item)}
        className="relative mb-2.5 flex cursor-pointer flex-row overflow-hidden rounded-2xl border p-3.5"
        style={{
          backgroundColor: !item.isRead ? theme.secondaryBackground : theme.tertiaryBackground,
          borderColor: !item.isRead ? theme.primary + "40" : theme.border,
        }}
      >
        {/* Unread accent strip */}
        {!item.isRead && (
          <div className="absolute top-0 bottom-0 left-0 w-[3px] rounded-l-2xl" style={{ backgroundColor: theme.primary }} />
        )}

        {/* Channel icon */}
        <div
          className="mr-3 flex h-11 w-11 items-center justify-center rounded-[14px]"
          style={{ backgroundColor: !item.isRead ? meta.bg : theme.secondaryBackground }}
        >
          {!(item.imageUrl && !isRich) && (
            <meta.icon size={22} color={!item.isRead ? meta.color : theme.secondaryText} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          {/* Title row */}
          <div className="mb-1 flex flex-row items-center gap-1.5">
            <p
              className={cn("line-clamp-1 flex-1 text-sm font-bold tracking-wide leading-[19px]", !item.isRead && "font-extrabold")}
              style={{ color: theme.text }}
            >
              {item.title}
            </p>
            {!item.isRead && (
              <div className="absolute top-3.5 right-3.5 h-2 w-2 rounded-full" style={{ backgroundColor: theme.primary }} />
            )}
          </div>

          {/* Channel tag + time */}
          <div className="mt-0.5 mb-1.5 flex flex-row items-center gap-1.5">
            <div
              className="rounded-md border px-[7px] py-0.5"
              style={{ backgroundColor: theme.background, borderColor: theme.border }}
            >
              <span className="text-[10px] font-extrabold tracking-wide uppercase" style={{ color: theme.secondaryText }}>
                {meta.label}
              </span>
            </div>
            <Circle size={3} color={theme.tertiaryText} style={{ marginInline: 2 }} />
            <span className="text-[11px] font-semibold" style={{ color: theme.tertiaryText }}>{fullTime}</span>
            <span className="text-[11px] font-semibold opacity-60" style={{ color: theme.tertiaryText }}>· {time}</span>
          </div>

          {/* Description */}
          <p
            className={cn("text-[13px] leading-[19px]", isRich ? "line-clamp-2" : "line-clamp-3")}
            style={{ color: !item.isRead ? theme.text : theme.secondaryText }}
          >
            {item.description}
          </p>

          {/* Rich card image */}
          {isRich && (
            <img
              src={item.imageUrl}
              alt={`${item.title} - QuickBihar update`}
              title={`${item.title} | QuickBihar`}
              className="mt-3 mb-2.5 h-[150px] w-full rounded-xl object-cover"
              style={{ backgroundColor: theme.secondaryBackground }}
              loading="lazy"
              decoding="async"
            />
          )}

          {/* Rich card action */}
          {isRich && item.redirectType !== "none" && (
            <div className="mt-1 flex flex-row items-center justify-between">
              <button
                type="button"
                onClick={() => handleNotificationPress(item)}
                className="flex h-9 flex-row items-center gap-1.5 rounded-full px-3.5"
                style={{ backgroundColor: theme.primary }}
              >
                <span className="text-xs font-extrabold tracking-wide text-white">
                  {item.actionButtonText ||
                    (item.redirectType === "product" ? "Buy Now" : "View Details")}
                </span>
                <ArrowRight size={14} color="#fff" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSectionHeader = (label: string, count: number) => (
    <div className="flex flex-row items-center gap-2 px-1 pt-[18px] pb-2">
      <span className="text-xs font-extrabold tracking-widest uppercase" style={{ color: theme.secondaryText }}>
        {label}
      </span>
      <span className="text-[11px] font-bold" style={{ color: theme.tertiaryText }}>· {count}</span>
      <div className="ml-1 h-[1px] flex-1" style={{ backgroundColor: theme.border }} />
    </div>
  );

  const renderTabs = () => (
    <div className="px-4 pb-3">
      <div className="flex flex-row gap-0.5 rounded-[14px] p-1" style={{ backgroundColor: theme.secondaryBackground }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const count = tabCounts[tab.id];
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
                  () => null,
                );
                setActiveTab(tab.id);
              }}
              className={cn("flex flex-1 flex-row items-center justify-center gap-1.5 rounded-[11px] px-2.5 py-2")}
              style={isActive ? { backgroundColor: theme.background, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" } : undefined}
            >
              <tab.icon size={14} color={isActive ? theme.text : theme.secondaryText} />
              <span
                className="line-clamp-1 text-xs font-bold tracking-wide"
                style={{ color: isActive ? theme.text : theme.secondaryText }}
              >
                {tab.label}
              </span>
              {count > 0 && (
                <div
                  className="flex h-4 min-w-[18px] items-center justify-center rounded-lg px-[5px]"
                  style={{ backgroundColor: !isActive ? theme.tertiaryBackground : theme.primary }}
                >
                  <span
                    className="text-[10px] font-extrabold"
                    style={{ color: !isActive ? theme.secondaryText : "#fff" }}
                  >
                    {count > 99 ? "99+" : count}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderEmptyState = () => (
    <div className="flex flex-1 flex-col items-center justify-center px-8 pb-10">
      <div
        className="mb-[18px] flex h-[110px] w-[110px] items-center justify-center rounded-full"
        style={{ backgroundColor: theme.primary + "15" }}
      >
        {activeTab === "all" ? (
          <BellOff size={52} color={theme.primary} />
        ) : (
          <Inbox size={52} color={theme.primary} />
        )}
      </div>
      <p className="text-center text-xl font-extrabold tracking-tight" style={{ color: theme.text }}>
        {activeTab === "all" ? "No notifications yet" : "Nothing here yet"}
      </p>
      <p className="mt-2 max-w-[320px] text-center text-sm leading-5" style={{ color: theme.secondaryText }}>
        {activeTab === "all"
          ? "We'll let you know about order updates, exclusive offers, and important account changes right here."
          : activeTab === "orders"
          ? "Order tracking updates will appear here once you place an order."
          : activeTab === "promotions"
          ? "Personalised offers and deals will show up here. Stay tuned!"
          : "System messages and general updates from QuickBihar will land here."}
      </p>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: theme.background }}>
        <span
          className="animate-spin rounded-full"
          style={{
            width: 36,
            height: 36,
            borderWidth: 3,
            borderStyle: "solid",
            borderColor: theme.primary,
            borderTopColor: "transparent",
          }}
        />
      </div>
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
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: theme.background }}>
      {/* Top app bar */}
      <div className="flex flex-row items-center gap-2 px-3 pt-2 pb-3">
        <button
          type="button"
          onClick={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
              () => null,
            );
            goBack(navigate, variant === "jewelery" ? "/jewelery/account" : "/account/profile-info");
          }}
          aria-label="Go back"
          className="flex h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: theme.secondaryBackground }}
        >
          <ChevronLeft size={22} color={theme.text} />
        </button>

        <div className="flex-1 px-1">
          <h2 className="text-[22px] font-extrabold tracking-tight" style={{ color: theme.text }}>
            Notifications
          </h2>
          <p className="mt-0.5 text-xs font-medium" style={{ color: theme.secondaryText }}>
            {unreadCount > 0
              ? `${unreadCount} unread · ${notifications.length} total`
              : `${notifications.length} notification${notifications.length === 1 ? "" : "s"}`}
          </p>
        </div>

        {unreadCount > 0 ? (
          <button
            type="button"
            onClick={handleMarkAll}
            disabled={isMarkingAll}
            className={cn("flex h-9 flex-row items-center gap-1.5 rounded-full px-3", isMarkingAll && "opacity-60")}
            style={{ backgroundColor: theme.primary + "18" }}
          >
            {isMarkingAll ? (
              <span
                className="animate-spin rounded-full"
                style={{
                  width: 14,
                  height: 14,
                  borderWidth: 2,
                  borderStyle: "solid",
                  borderColor: theme.primary,
                  borderTopColor: "transparent",
                }}
              />
            ) : (
              <>
                <CheckCheck size={14} color={theme.primary} />
                <span className="text-xs font-extrabold tracking-wide" style={{ color: theme.primary }}>
                  Mark all
                </span>
              </>
            )}
          </button>
        ) : (
          <div className="w-10" />
        )}
      </div>

      {/* Filter tabs */}
      {renderTabs()}

      {/* Notification list */}
      <div className="overflow-auto">
        <div className={cn("px-4 pt-2 pb-8", rows.length === 0 && "flex-1")}>
          {rows.length === 0 ? (
            renderEmptyState()
          ) : (
            rows.map((row) =>
              row.type === "header" ? (
                <React.Fragment key={row.key}>
                  {renderSectionHeader(row.label, row.count)}
                </React.Fragment>
              ) : (
                <React.Fragment key={row.key}>
                  {renderItem({ item: row.item })}
                </React.Fragment>
              ),
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationScreen;
