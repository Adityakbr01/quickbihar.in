import type { LucideIcon } from "lucide-react";
import { Bell, ChevronRight, CircleHelp, Gift, Heart, Info, Key, LogOut, MapPin, MessageCircle, Moon, Package, Sun, Truck, User, Zap } from "lucide-react";
import * as Haptics from "@/lib/haptics";
import { useNavigate } from "react-router-dom";
import { goTo, replaceTo } from "@/src/utils/navigation";
import React, { useState } from "react";
import { cn } from "@/src/lib/utils";

import { JEWELERY_MODULE_CONFIG, APP_COUNTRY_CODE, APP_NAME, SUPPORT_WHATSAPP_INTL, SUPPORT_WHATSAPP_DISPLAY } from "@/src/constants";
import { useAuth } from "@/src/features/Jewelery/context/AuthContext";
import { useCart } from "@/src/features/Jewelery/context/CartContext";
import { getMyOrdersRequest } from "@/src/features/common/order/api/order.api";
import { logoutRequest } from "@/src/features/common/auth/api/auth.api";
import { useAuthStore } from "@/src/features/common/auth/store/authStore";
import { useCartStore } from "@/src/features/common/cart/store/cartStore";
import { useColors } from "@/src/features/Jewelery/hooks/useColors";
import { useTopPad } from "@/src/hooks/useTopPad";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { ThemeToggle } from "@/src/components/common/ThemeToggle";
import { HelpSupportSheet } from "@/src/features/Jewelery/components/HelpSupportSheet";
import PasswordEmailSetupSheet from "@/src/features/common/account/components/PasswordEmailSetupSheet";
import { useAccountStore } from "@/src/features/common/account/store/accountStore";

const guestMenuItems = [
  {
    icon: CircleHelp,
    label: "Help & Support",
    sub: "Sizing guide, returns, care",
  },
  { icon: MessageCircle, label: "WhatsApp Assist", sub: JEWELERY_MODULE_CONFIG.whatsappPhone },
  { icon: Info, label: `About ${APP_NAME}`, sub: "Our story and craft" },
];

function MenuItem({
  icon: Icon,
  label,
  sub,
  badge,
  route,
  onPress,
  last,
}: {
  icon: LucideIcon;
  label: string;
  sub: string;
  badge?: string;
  route?: string;
  onPress?: () => void;
  last?: boolean;
}) {
  const navigate = useNavigate();
  const colors = useColors();
  return (
    <button
      type="button"
      onClick={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (onPress) {
          onPress();
          return;
        }
        if (route) goTo(navigate, route as any);
      }}
      className={cn(
        "flex w-full cursor-pointer flex-row items-center gap-3 px-5 py-[10px] text-left transition-colors",
      )}
      style={
        {
          borderBottomColor: colors.midGray,
          borderBottomWidth: last ? 0 : 1,
          borderBottomStyle: last ? undefined : "solid",
          ["--press-bg" as any]: colors.pearl,
        } as React.CSSProperties
      }
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = colors.pearl;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
      }}
    >
      <Icon size={16} color={colors.gold} />
      <div className="flex-1">
        <span
          className="block text-[14px]"
          style={{ color: colors.ink, fontFamily: "DMSans_500Medium" }}
        >
          {label}
        </span>
        <span
          className="mt-[2px] block text-[11px]"
          style={{ color: colors.warmGray, fontFamily: "DMSans_400Regular" }}
        >
          {sub}
        </span>
      </div>
      {badge ? (
        <div
          className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5"
          style={{ backgroundColor: colors.gold }}
        >
          <span
            className="text-[10px]"
            style={{ color: colors.onBrand, fontFamily: "DMSans_500Medium" }}
          >
            {badge}
          </span>
        </div>
      ) : (
        <ChevronRight size={14} color={colors.midGray} />
      )}
    </button>
  );
}

function AppearanceSection() {
  const colors = useColors();
  const theme = useTheme();

  return (
    <div className="mt-4">
      <p
        className="mb-2 px-5 text-[10px] tracking-[1.5px]"
        style={{ color: colors.warmGray, fontFamily: "DMSans_500Medium" }}
      >
        APPEARANCE
      </p>
      <div
        className="flex flex-row items-center gap-3 px-5 py-[10px]"
        style={{
          backgroundColor: colors.ivory,
          borderTopColor: colors.midGray,
          borderBottomColor: colors.midGray,
          borderTopWidth: 1,
          borderBottomWidth: 1,
          borderTopStyle: "solid",
          borderBottomStyle: "solid",
        }}
      >
        {theme.isDark ? (
          <Moon size={16} color={colors.gold} />
        ) : (
          <Sun size={16} color={colors.gold} />
        )}
        <div className="flex-1">
          <span
            className="block text-[14px]"
            style={{ color: colors.ink, fontFamily: "DMSans_500Medium" }}
          >
            {theme.isDark ? "Dark Mode" : "Light Mode"}
          </span>
          <span
            className="mt-[2px] block text-[11px]"
            style={{ color: colors.warmGray, fontFamily: "DMSans_400Regular" }}
          >
            {theme.isDark ? "Currently using dark theme" : "Currently using light theme"}
          </span>
        </div>
        <ThemeToggle value={theme.isDark}
          onToggle={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            theme.toggleMode();
          }}
        />
      </div>
    </div>
  );
}

export default function JeweleryAccountScreen() {
  const navigate = useNavigate();
  const colors = useColors();
  const topPad = useTopPad();
  const bottomPad = 34;
  const { user } = useAuth();
  const { wishlist } = useCart();
  const setPasswordSheetVisible = useAccountStore(
    (state) => state.setPasswordSheetVisible,
  );
  const [helpVisible, setHelpVisible] = useState(false);

  const openWhatsapp = (message?: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // wa.me needs the full international number (91 + mobile) — a bare
    // national number is rejected by WhatsApp as invalid.
    const url = message
      ? `https://wa.me/${SUPPORT_WHATSAPP_INTL}?text=${encodeURIComponent(message)}`
      : `https://wa.me/${SUPPORT_WHATSAPP_INTL}`;
    try {
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  // Guest menu rows that need a real action (the rest are informational).
  const handleGuestMenu = (label: string) => {
    if (label === "Help & Support") setHelpVisible(true);
    else if (label === "WhatsApp Assist") openWhatsapp();
  };

  const TERMINAL_ORDER_STATUS = ["DELIVERED", "CANCELLED", "REFUNDED", "REJECTED", "FAILED"];
  const { data: ordersResp } = useQuery({
    queryKey: ["jewelery-account-orders"],
    queryFn: getMyOrdersRequest,
    enabled: !!user,
  });
  const realOrders: any[] = (ordersResp as any)?.data ?? [];
  const activeOrders = realOrders.filter(
    (o) => !TERMINAL_ORDER_STATUS.includes(o.status),
  );

  const queryClient = useQueryClient();

  const handleSignOut = async () => {
    // Direct logout like clothing's useLogout — no native Alert confirm
    // (Alert buttons never fire on web, which made this row look dead).
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    try {
      await logoutRequest();
    } catch {}
    await useAuthStore.getState().clearAuth();
    queryClient.removeQueries({ queryKey: ["userProfile"] });
    await useCartStore.getState().clearCart().catch(() => {});
    replaceTo(navigate, "/jewelery/auth/sign-in" as any);
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w: string) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "A";

  const joinedDate = user?.joinedAt
    ? new Date(user.joinedAt).toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: colors.ivory }}>
      {/* Header */}
      <div
        className="flex flex-row items-center justify-between px-5 pb-[14px]"
        style={{
          paddingTop: topPad + 12,
          backgroundColor: colors.ivory,
          borderBottomColor: colors.midGray,
          borderBottomWidth: 1,
          borderBottomStyle: "solid",
        }}
      >
        <h1
          className="text-[22px] tracking-[3px]"
          style={{ color: colors.ink, fontFamily: "CormorantGaramond_600SemiBold" }}
        >
          Account
        </h1>
        {user && (
          <button type="button" onClick={handleSignOut} aria-label="Sign out" className="cursor-pointer p-1">
            <LogOut size={18} color={colors.warmGray} />
          </button>
        )}
      </div>

      <div className="overflow-auto" style={{ paddingBottom: bottomPad + 24 }}>
        {user ? (
          /* ── SIGNED IN ─────────────────────────── */
          <>
            {/* Profile card */}
            <div
              className="m-4 flex flex-row items-start gap-[14px] rounded-[4px] p-[18px]"
              style={{ backgroundColor: colors.emerald }}
            >
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: colors.gold }}
              >
                <span
                  className="text-[20px]"
                  style={{
                    color: colors.onBrand,
                    fontFamily: "CormorantGaramond_600SemiBold",
                  }}
                >
                  {initials}
                </span>
              </div>
              <div className="flex-1">
                <span
                  className="mb-[2px] block text-[18px] leading-6"
                  style={{
                    color: "#F7F3EC",
                    fontFamily: "CormorantGaramond_500Medium_Italic",
                  }}
                >
                  {user.name}
                </span>
                <span
                  className="mb-[2px] block text-[12px]"
                  style={{
                    color: "rgba(247,243,236,0.75)",
                    fontFamily: "DMSans_400Regular",
                  }}
                >
                  {APP_COUNTRY_CODE} {user.phone}
                </span>
                {user.email ? (
                  <span
                    className="block text-[11px]"
                    style={{
                      color: "rgba(247,243,236,0.6)",
                      fontFamily: "DMSans_300Light",
                    }}
                  >
                    {user.email}
                  </span>
                ) : null}
              </div>
              {joinedDate ? (
                <div
                  className="self-start rounded-[2px] border px-2 py-1"
                  style={{ borderColor: "rgba(184,146,74,0.4)", borderWidth: 1 }}
                >
                  <span
                    className="text-[9px] tracking-[0.5px]"
                    style={{ color: colors.gold, fontFamily: "DMSans_400Regular" }}
                  >
                    Since {joinedDate}
                  </span>
                </div>
              ) : null}
            </div>

            {/* Stats row */}
            <div
              className="mb-1 flex flex-row px-5 py-[14px]"
              style={{
                backgroundColor: colors.pearl,
                borderBottomColor: colors.midGray,
                borderBottomWidth: 1,
                borderBottomStyle: "solid",
              }}
            >
              {[
                {
                  label: "Orders",
                  value: String(realOrders.length),
                  onPress: () => goTo(navigate, "/jewelery/orders" as any),
                },
                {
                  label: "Active",
                  value: String(activeOrders.length),
                  onPress: () => goTo(navigate, "/jewelery/orders" as any),
                },
                {
                  label: "Wishlist",
                  value: String(wishlist.length),
                  onPress: () => goTo(navigate, "/jewelery/(tabs)/wishlist" as any),
                },
              ].map((s, i) => (
                <React.Fragment key={s.label}>
                  <button
                    type="button"
                    onClick={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      s.onPress();
                    }}
                    className="flex flex-1 cursor-pointer flex-col items-center gap-[3px]"
                  >
                    <span
                      className="text-[22px] leading-[26px]"
                      style={{
                        color: colors.ink,
                        fontFamily: "CormorantGaramond_600SemiBold",
                      }}
                    >
                      {s.value}
                    </span>
                    <span
                      className="text-[10px] tracking-[0.5px]"
                      style={{
                        color: colors.warmGray,
                        fontFamily: "DMSans_400Regular",
                      }}
                    >
                      {s.label}
                    </span>
                  </button>
                  {i < 2 && (
                    <div
                      className="my-1.5 w-px"
                      style={{ backgroundColor: colors.midGray }}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Active order banner */}
            {activeOrders.length > 0 && (
              <button
                type="button"
                onClick={() => goTo(navigate, "/jewelery/orders" as any)}
                className="mx-4 my-2 flex cursor-pointer flex-row items-center gap-2 rounded-[4px] border p-[10px] text-left"
                style={{ backgroundColor: colors.champagne, borderColor: colors.gold }}
              >
                <Truck size={14} color={colors.gold} />
                <span
                  className="flex-1 text-[12px]"
                  style={{ color: colors.ink, fontFamily: "DMSans_400Regular" }}
                >
                  {activeOrders.length} order
                  {activeOrders.length > 1 ? "s" : ""} on the way — Tap to track
                </span>
                <ChevronRight size={13} color={colors.gold} />
              </button>
            )}

            {/* Menu */}
            <div style={{ backgroundColor: colors.ivory }}>
              <MenuItem icon={Package}
                label="My Orders"
                sub={`${realOrders.length} orders · ${activeOrders.length} active`}
                badge={
                  activeOrders.length > 0
                    ? String(activeOrders.length)
                    : undefined
                }
                route="/jewelery/orders"
              />
              <MenuItem icon={Heart}
                label="Wishlist"
                sub="Pieces you've saved"
                route="/jewelery/(tabs)/wishlist"
              />
              <MenuItem icon={MapPin}
                label="Saved Addresses"
                sub="Manage delivery addresses"
                route="/jewelery/addresses"
              />
              <MenuItem icon={Key}
                label="Password & Email Setup"
                sub="Update password or link email address for password login"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setPasswordSheetVisible(true);
                }}
              />
              <MenuItem icon={Bell}
                label="Notifications"
                sub="Drops, restocks, offers"
                route="/jewelery/notifications"
              />
              <MenuItem icon={CircleHelp}
                label="Help & Support"
                sub="Sizing guide, returns, care"
                onPress={() => setHelpVisible(true)}
              />
              <MenuItem icon={MessageCircle}
                label="WhatsApp Assist"
                sub={SUPPORT_WHATSAPP_DISPLAY}
                onPress={() => openWhatsapp()}
              />
              <MenuItem icon={Info}
                label={`About ${APP_NAME}`}
                sub="Our story and craft"
                last
                onPress={() =>
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                }
              />
            </div>

            {/* Sign out */}
            <button
              type="button"
              onClick={handleSignOut}
              className="mt-3 flex w-full cursor-pointer flex-row items-center gap-3 px-5 py-4 text-left transition-colors"
              style={{
                borderTopColor: colors.midGray,
                borderBottomColor: colors.midGray,
                borderTopWidth: 1,
                borderBottomWidth: 1,
                borderTopStyle: "solid",
                borderBottomStyle: "solid",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = colors.pearl;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
              }}
            >
              <LogOut size={16} color={colors.maroon} />
              <span
                className="text-[14px]"
                style={{ color: colors.maroon, fontFamily: "DMSans_500Medium" }}
              >
                Sign Out
              </span>
            </button>
          </>
        ) : (
          /* ── GUEST ─────────────────────────────── */
          <>
            <div
              className="m-4 flex flex-col gap-4 rounded-lg p-6"
              style={{ backgroundColor: colors.emerald }}
            >
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: "rgba(184,146,74,0.2)" }}
              >
                <User size={32} color={colors.gold} />
              </div>
              <h2
                className="text-[30px] leading-[38px]"
                style={{
                  color: "#F7F3EC",
                  fontFamily: "CormorantGaramond_400Regular_Italic",
                }}
              >
                Your jewellery story<br />starts here.
              </h2>
              <p
                className="text-[13px] leading-[21px]"
                style={{
                  color: "rgba(247,243,236,0.7)",
                  fontFamily: "DMSans_300Light",
                }}
              >
                Sign in to track orders, save your wishlist, and get early
                access to new drops.
              </p>
              <div className="mt-1 flex flex-col gap-[10px]">
                <button
                  type="button"
                  onClick={() => goTo(navigate, "/jewelery/auth/sign-in" as any)}
                  className="cursor-pointer rounded-[2px] py-[15px] text-center transition-colors"
                  style={{ backgroundColor: colors.gold }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = colors.goldLight;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = colors.gold;
                  }}
                >
                  <span
                    className="text-[13px] tracking-[2px]"
                    style={{ color: colors.onBrand, fontFamily: "DMSans_500Medium" }}
                  >
                    Sign In
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => goTo(navigate, "/jewelery/auth/sign-up" as any)}
                  className="cursor-pointer rounded-[2px] border py-[14px] text-center transition-colors"
                  style={{ borderColor: colors.gold, backgroundColor: "transparent" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(184,146,74,0.15)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                  }}
                >
                  <span
                    className="text-[13px] tracking-[1px]"
                    style={{ color: colors.gold, fontFamily: "DMSans_400Regular" }}
                  >
                    Create Account
                  </span>
                </button>
              </div>
            </div>

            <div
              className="mx-4 flex flex-col gap-3 rounded-md p-4"
              style={{ backgroundColor: colors.champagne }}
            >
              <p
                className="mb-[2px] text-[9px] tracking-[2px]"
                style={{ color: colors.gold, fontFamily: "DMSans_500Medium" }}
              >
                MEMBER PERKS
              </p>
              {[
                {
                  icon: Zap,
                  text: "Early access to new collections & drops",
                },
                {
                  icon: Heart,
                  text: "Wishlist synced across all your devices",
                },
                { icon: Gift, text: "Exclusive member-only gifts" },
                { icon: Truck, text: "Faster checkout with saved addresses" },
              ].map((p) => (
                <div key={p.text} className="flex flex-row items-center gap-3">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full"
                    style={{ backgroundColor: colors.pearl }}
                  >
                    <p.icon size={14} color={colors.gold} />
                  </div>
                  <span
                    className="flex-1 text-[13px] leading-[19px]"
                    style={{ color: colors.ink, fontFamily: "DMSans_400Regular" }}
                  >
                    {p.text}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-3" style={{ backgroundColor: colors.ivory }}>
              {guestMenuItems.map((item, i) => (
                <MenuItem key={item.label}
                  {...item}
                  onPress={() => handleGuestMenu(item.label)}
                  last={i === guestMenuItems.length - 1}
                />
              ))}
            </div>
          </>
        )}

        {/* Appearance Switcher */}
        <AppearanceSection />

        {/* Footer brand */}
        <div className="flex flex-col items-center gap-1.5 py-8">
          <span
            className="text-[18px] tracking-[4px]"
            style={{
              color: colors.gold,
              fontFamily: "CormorantGaramond_600SemiBold",
            }}
          >
            {APP_NAME}
          </span>
          <span
            className="text-[10px] tracking-[0.5px]"
            style={{ color: colors.warmGray, fontFamily: "DMSans_300Light" }}
          >
            Hallmark Certified · BIS Certified · Made in India
          </span>
          <span
            className="mt-1 text-[10px]"
            style={{ color: colors.midGray, fontFamily: "DMSans_400Regular" }}
          >
            v1.0.0
          </span>
        </div>
      </div>

      {/* Password & Email Setup bottom sheet (same sheet as clothing
          account — opened via the account store, single instance per
          module tree) */}
      <PasswordEmailSetupSheet variant="jewelery" />

      {/* Help & Support bottom sheet (channel → question → redirect) */}
      <HelpSupportSheet visible={helpVisible}
        onClose={() => setHelpVisible(false)}
      />
    </div>
  );
}
