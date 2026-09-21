import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { JEWELERY_MODULE_CONFIG, APP_COUNTRY_CODE, APP_NAME, SUPPORT_WHATSAPP_INTL, SUPPORT_WHATSAPP_DISPLAY } from "@/src/constants";
import { useAuth } from "@/src/features/Jewelery/context/AuthContext";
import { useCart } from "@/src/features/Jewelery/context/CartContext";
import { getMyOrdersRequest } from "@/src/features/common/order/api/order.api";
import { useColors } from "@/src/features/Jewelery/hooks/useColors";
import { useTopPad } from "@/src/hooks/useTopPad";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { ThemeToggle } from "@/src/components/common/ThemeToggle";
import { HelpSupportSheet } from "@/src/features/Jewelery/components/HelpSupportSheet";
import PasswordEmailSetupSheet from "@/src/features/common/account/components/PasswordEmailSetupSheet";
import { useAccountStore } from "@/src/features/common/account/store/accountStore";

const guestMenuItems = [
  {
    icon: "help-circle",
    label: "Help & Support",
    sub: "Sizing guide, returns, care",
  },
  { icon: "message-circle", label: "WhatsApp Assist", sub: JEWELERY_MODULE_CONFIG.whatsappPhone },
  { icon: "info", label: `About ${APP_NAME}`, sub: "Our story and craft" },
];

function MenuItem({
  icon,
  label,
  sub,
  badge,
  route,
  onPress,
  last,
}: {
  icon: string;
  label: string;
  sub: string;
  badge?: string;
  route?: string;
  onPress?: () => void;
  last?: boolean;
}) {
  const colors = useColors();
  return (
    <Pressable
      style={({ pressed }) => [
        styles.menuItem,
        {
          borderBottomColor: colors.midGray,
          borderBottomWidth: last ? 0 : 0.5,
          backgroundColor: pressed ? colors.pearl : "transparent",
        },
      ]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (onPress) {
          onPress();
          return;
        }
        if (route) router.push(route as any);
      }}
    >
      <Feather name={icon as any} size={16} color={colors.gold} />
      <View style={styles.menuContent}>
        <Text
          style={[
            styles.menuLabel,
            { color: colors.ink, fontFamily: "DMSans_500Medium" },
          ]}
        >
          {label}
        </Text>
        <Text
          style={[
            styles.menuSub,
            { color: colors.warmGray, fontFamily: "DMSans_400Regular" },
          ]}
        >
          {sub}
        </Text>
      </View>
      {badge ? (
        <View style={[styles.badge, { backgroundColor: colors.gold }]}>
          <Text
            style={[
              styles.badgeText,
              { color: colors.onBrand, fontFamily: "DMSans_500Medium" },
            ]}
          >
            {badge}
          </Text>
        </View>
      ) : (
        <Feather name="chevron-right" size={14} color={colors.midGray} />
      )}
    </Pressable>
  );
}

function AppearanceSection() {
  const colors = useColors();
  const theme = useTheme();

  return (
    <View style={styles.appearanceSection}>
      <Text
        style={[
          styles.appearanceTitle,
          { color: colors.warmGray, fontFamily: "DMSans_500Medium" },
        ]}
      >
        APPEARANCE
      </Text>
      <View
        style={[
          styles.appearanceRow,
          {
            backgroundColor: colors.ivory,
            borderTopColor: colors.midGray,
            borderBottomColor: colors.midGray,
          },
        ]}
      >
        <Feather
          name={theme.isDark ? "moon" : "sun"}
          size={16}
          color={colors.gold}
        />
        <View style={styles.appearanceContent}>
          <Text
            style={[
              styles.menuLabel,
              { color: colors.ink, fontFamily: "DMSans_500Medium" },
            ]}
          >
            {theme.isDark ? "Dark Mode" : "Light Mode"}
          </Text>
          <Text
            style={[
              styles.menuSub,
              { color: colors.warmGray, fontFamily: "DMSans_400Regular" },
            ]}
          >
            {theme.isDark ? "Currently using dark theme" : "Currently using light theme"}
          </Text>
        </View>
        <ThemeToggle
          value={theme.isDark}
          onToggle={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            theme.toggleMode();
          }}
        />
      </View>
    </View>
  );
}

export default function JeweleryAccountScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = useTopPad();
  const bottomPad = Platform.OS === "web" ? 34 : 0;
  const { user, signOut } = useAuth();
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
    Linking.openURL(url).catch(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    });
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

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          signOut();
        },
      },
    ]);
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
    <View style={[styles.root, { backgroundColor: colors.ivory }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 12,
            backgroundColor: colors.ivory,
            borderBottomColor: colors.midGray,
          },
        ]}
      >
        <Text
          style={[
            styles.headerTitle,
            { color: colors.ink, fontFamily: "CormorantGaramond_600SemiBold" },
          ]}
        >
          Account
        </Text>
        {user && (
          <Pressable onPress={handleSignOut} hitSlop={8}>
            <Feather name="log-out" size={18} color={colors.warmGray} />
          </Pressable>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPad + 24 }}
      >
        {user ? (
          /* ── SIGNED IN ─────────────────────────── */
          <>
            {/* Profile card */}
            <View
              style={[styles.profileCard, { backgroundColor: colors.emerald }]}
            >
              <View style={[styles.avatar, { backgroundColor: colors.gold }]}>
                <Text
                  style={[
                    styles.avatarText,
                    {
                      color: colors.onBrand,
                      fontFamily: "CormorantGaramond_600SemiBold",
                    },
                  ]}
                >
                  {initials}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.profileName,
                    {
                      color: "#F7F3EC",
                      fontFamily: "CormorantGaramond_500Medium_Italic",
                    },
                  ]}
                >
                  {user.name}
                </Text>
                <Text
                  style={[
                    styles.profilePhone,
                    {
                      color: "rgba(247,243,236,0.75)",
                      fontFamily: "DMSans_400Regular",
                    },
                  ]}
                >
                  {APP_COUNTRY_CODE} {user.phone}
                </Text>
                {user.email ? (
                  <Text
                    style={[
                      styles.profileEmail,
                      {
                        color: "rgba(247,243,236,0.6)",
                        fontFamily: "DMSans_300Light",
                      },
                    ]}
                  >
                    {user.email}
                  </Text>
                ) : null}
              </View>
              {joinedDate ? (
                <View style={styles.joinedBadge}>
                  <Text
                    style={[
                      styles.joinedText,
                      { color: colors.gold, fontFamily: "DMSans_400Regular" },
                    ]}
                  >
                    Since {joinedDate}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Stats row */}
            <View
              style={[
                styles.statsRow,
                {
                  backgroundColor: colors.pearl,
                  borderBottomColor: colors.midGray,
                },
              ]}
            >
              {[
                {
                  label: "Orders",
                  value: String(realOrders.length),
                  onPress: () => router.push("/jewelery/orders" as any),
                },
                {
                  label: "Active",
                  value: String(activeOrders.length),
                  onPress: () => router.push("/jewelery/orders" as any),
                },
                {
                  label: "Wishlist",
                  value: String(wishlist.length),
                  onPress: () => router.push("/jewelery/(tabs)/wishlist" as any),
                },
              ].map((s, i) => (
                <React.Fragment key={s.label}>
                  <Pressable
                    style={styles.stat}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      s.onPress();
                    }}
                  >
                    <Text
                      style={[
                        styles.statValue,
                        {
                          color: colors.ink,
                          fontFamily: "CormorantGaramond_600SemiBold",
                        },
                      ]}
                    >
                      {s.value}
                    </Text>
                    <Text
                      style={[
                        styles.statLabel,
                        {
                          color: colors.warmGray,
                          fontFamily: "DMSans_400Regular",
                        },
                      ]}
                    >
                      {s.label}
                    </Text>
                  </Pressable>
                  {i < 2 && (
                    <View
                      style={[
                        styles.statSep,
                        { backgroundColor: colors.midGray },
                      ]}
                    />
                  )}
                </React.Fragment>
              ))}
            </View>

            {/* Active order banner */}
            {activeOrders.length > 0 && (
              <Pressable
                style={[
                  styles.activeOrderBanner,
                  { backgroundColor: colors.champagne, borderColor: colors.gold },
                ]}
                onPress={() => router.push("/jewelery/orders" as any)}
              >
                <Feather name="truck" size={14} color={colors.gold} />
                <Text
                  style={[
                    styles.activeOrderText,
                    { color: colors.ink, fontFamily: "DMSans_400Regular" },
                  ]}
                >
                  {activeOrders.length} order
                  {activeOrders.length > 1 ? "s" : ""} on the way — Tap to track
                </Text>
                <Feather name="chevron-right" size={13} color={colors.gold} />
              </Pressable>
            )}

            {/* Menu */}
            <View style={[styles.menu, { backgroundColor: colors.ivory }]}>
              <MenuItem
                icon="package"
                label="My Orders"
                sub={`${realOrders.length} orders · ${activeOrders.length} active`}
                badge={
                  activeOrders.length > 0
                    ? String(activeOrders.length)
                    : undefined
                }
                route="/jewelery/orders"
              />
              <MenuItem
                icon="heart"
                label="Wishlist"
                sub="Pieces you've saved"
                route="/jewelery/(tabs)/wishlist"
              />
              <MenuItem
                icon="map-pin"
                label="Saved Addresses"
                sub="Manage delivery addresses"
                route="/jewelery/addresses"
              />
              <MenuItem
                icon="key"
                label="Password & Email Setup"
                sub="Update password or link email address for password login"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setPasswordSheetVisible(true);
                }}
              />
              <MenuItem
                icon="bell"
                label="Notifications"
                sub="Drops, restocks, offers"
                route="/jewelery/notifications"
              />
              <MenuItem
                icon="help-circle"
                label="Help & Support"
                sub="Sizing guide, returns, care"
                onPress={() => setHelpVisible(true)}
              />
              <MenuItem
                icon="message-circle"
                label="WhatsApp Assist"
                sub={SUPPORT_WHATSAPP_DISPLAY}
                onPress={() => openWhatsapp()}
              />
              <MenuItem
                icon="info"
                label={`About ${APP_NAME}`}
                sub="Our story and craft"
                last
                onPress={() =>
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                }
              />
            </View>

            {/* Sign out */}
            <Pressable
              style={({ pressed }) => [
                styles.signOutRow,
                {
                  backgroundColor: pressed ? colors.pearl : "transparent",
                  borderTopColor: colors.midGray,
                  borderBottomColor: colors.midGray,
                },
              ]}
              onPress={handleSignOut}
            >
              <Feather name="log-out" size={16} color={colors.maroon} />
              <Text
                style={[
                  styles.signOutText,
                  { color: colors.maroon, fontFamily: "DMSans_500Medium" },
                ]}
              >
                Sign Out
              </Text>
            </Pressable>
          </>
        ) : (
          /* ── GUEST ─────────────────────────────── */
          <>
            <View
              style={[styles.guestCard, { backgroundColor: colors.emerald }]}
            >
              <View
                style={[
                  styles.guestIconCircle,
                  { backgroundColor: "rgba(184,146,74,0.2)" },
                ]}
              >
                <Feather name="user" size={32} color={colors.gold} />
              </View>
              <Text
                style={[
                  styles.guestHeadline,
                  {
                    color: "#F7F3EC",
                    fontFamily: "CormorantGaramond_400Regular_Italic",
                  },
                ]}
              >
                Your jewellery story{"\n"}starts here.
              </Text>
              <Text
                style={[
                  styles.guestSub,
                  {
                    color: "rgba(247,243,236,0.7)",
                    fontFamily: "DMSans_300Light",
                  },
                ]}
              >
                Sign in to track orders, save your wishlist, and get early
                access to new drops.
              </Text>
              <View style={styles.guestBtns}>
                <Pressable
                  style={({ pressed }) => [
                    styles.guestSignInBtn,
                    {
                      backgroundColor: pressed ? colors.goldLight : colors.gold,
                    },
                  ]}
                  onPress={() => router.push("/jewelery/auth/sign-in" as any)}
                >
                  <Text
                    style={[
                      styles.guestSignInText,
                      { color: colors.onBrand, fontFamily: "DMSans_500Medium" },
                    ]}
                  >
                    Sign In
                  </Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.guestSignUpBtn,
                    {
                      borderColor: colors.gold,
                      backgroundColor: pressed
                        ? "rgba(184,146,74,0.15)"
                        : "transparent",
                    },
                  ]}
                  onPress={() => router.push("/jewelery/auth/sign-up" as any)}
                >
                  <Text
                    style={[
                      styles.guestSignUpText,
                      { color: colors.gold, fontFamily: "DMSans_400Regular" },
                    ]}
                  >
                    Create Account
                  </Text>
                </Pressable>
              </View>
            </View>

            <View
              style={[
                styles.perksSection,
                { backgroundColor: colors.champagne },
              ]}
            >
              <Text
                style={[
                  styles.perksLabel,
                  { color: colors.gold, fontFamily: "DMSans_500Medium" },
                ]}
              >
                MEMBER PERKS
              </Text>
              {[
                {
                  icon: "zap",
                  text: "Early access to new collections & drops",
                },
                {
                  icon: "heart",
                  text: "Wishlist synced across all your devices",
                },
                { icon: "gift", text: "Exclusive member-only gifts" },
                { icon: "truck", text: "Faster checkout with saved addresses" },
              ].map((p) => (
                <View key={p.text} style={styles.perkRow}>
                  <View
                    style={[
                      styles.perkIconWrap,
                      { backgroundColor: colors.pearl },
                    ]}
                  >
                    <Feather
                      name={p.icon as any}
                      size={14}
                      color={colors.gold}
                    />
                  </View>
                  <Text
                    style={[
                      styles.perkText,
                      { color: colors.ink, fontFamily: "DMSans_400Regular" },
                    ]}
                  >
                    {p.text}
                  </Text>
                </View>
              ))}
            </View>

            <View
              style={[
                styles.menu,
                { backgroundColor: colors.ivory, marginTop: 12 },
              ]}
            >
              {guestMenuItems.map((item, i) => (
                <MenuItem
                  key={item.label}
                  {...item}
                  onPress={() => handleGuestMenu(item.label)}
                  last={i === guestMenuItems.length - 1}
                />
              ))}
            </View>
          </>
        )}

        {/* Appearance Switcher */}
        <AppearanceSection />

        {/* Footer brand */}
        <View style={styles.bottomBrand}>
          <Text
            style={[
              styles.brandName,
              {
                color: colors.gold,
                fontFamily: "CormorantGaramond_600SemiBold",
              },
            ]}
          >
            {APP_NAME}
          </Text>
          <Text
            style={[
              styles.brandSub,
              { color: colors.warmGray, fontFamily: "DMSans_300Light" },
            ]}
          >
            Hallmark Certified · BIS Certified · Made in India
          </Text>
          <Text
            style={[
              styles.version,
              { color: colors.midGray, fontFamily: "DMSans_400Regular" },
            ]}
          >
            v1.0.0
          </Text>
        </View>
      </ScrollView>

      {/* Password & Email Setup bottom sheet (same sheet as clothing
          account — opened via the account store, single instance per
          module tree) */}
      <PasswordEmailSetupSheet variant="jewelery" />

      {/* Help & Support bottom sheet (channel → question → redirect) */}
      <HelpSupportSheet
        visible={helpVisible}
        onClose={() => setHelpVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 0.5,
  },
  headerTitle: { fontSize: 22, letterSpacing: 3 },

  profileCard: {
    margin: 16,
    padding: 18,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarText: { fontSize: 20 },
  profileName: { fontSize: 18, lineHeight: 24, marginBottom: 2 },
  profilePhone: { fontSize: 12, marginBottom: 2 },
  profileEmail: { fontSize: 11 },
  joinedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 2,
    borderWidth: 0.5,
    borderColor: "rgba(184,146,74,0.4)",
    alignSelf: "flex-start",
  },
  joinedText: { fontSize: 9, letterSpacing: 0.5 },

  statsRow: {
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    marginBottom: 4,
  },
  stat: { flex: 1, alignItems: "center", gap: 3 },
  statValue: { fontSize: 22, lineHeight: 26 },
  statLabel: { fontSize: 10, letterSpacing: 0.5 },
  statSep: { width: 0.5, marginVertical: 6 },

  activeOrderBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 10,
    borderRadius: 4,
    borderWidth: 1,
  },
  activeOrderText: { flex: 1, fontSize: 12 },

  menu: {},
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 14,
  },
  menuContent: { flex: 1 },
  menuLabel: { fontSize: 14 },
  menuSub: { fontSize: 11, marginTop: 2 },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: { fontSize: 10 },

  signOutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    marginTop: 12,
  },
  signOutText: { fontSize: 14 },

  /* Guest */
  guestCard: { margin: 16, padding: 24, borderRadius: 8, gap: 16 },
  guestIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  guestHeadline: { fontSize: 30, lineHeight: 38 },
  guestSub: { fontSize: 13, lineHeight: 21 },
  guestBtns: { gap: 10, marginTop: 4 },
  guestSignInBtn: {
    paddingVertical: 15,
    borderRadius: 2,
    alignItems: "center",
  },
  guestSignInText: { fontSize: 13, letterSpacing: 2 },
  guestSignUpBtn: {
    paddingVertical: 14,
    borderRadius: 2,
    alignItems: "center",
    borderWidth: 1,
  },
  guestSignUpText: { fontSize: 13, letterSpacing: 1 },

  perksSection: { marginHorizontal: 16, borderRadius: 6, padding: 16, gap: 12 },
  perksLabel: { fontSize: 9, letterSpacing: 2, marginBottom: 2 },
  perkRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  perkIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  perkText: { fontSize: 13, lineHeight: 19, flex: 1 },

  bottomBrand: { alignItems: "center", paddingVertical: 32, gap: 6 },
  brandName: { fontSize: 18, letterSpacing: 4 },
  brandSub: { fontSize: 10, letterSpacing: 0.5 },
  version: { fontSize: 10, marginTop: 4 },

  appearanceSection: {
    marginTop: 16,
  },
  appearanceTitle: {
    fontSize: 10,
    letterSpacing: 1.5,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  appearanceRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 14,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
  },
  appearanceContent: {
    flex: 1,
  },
});
