import type { LucideIcon } from "lucide-react";
import { Bell, CircleX, Heart, House, LayoutGrid, Moon, Search, ShoppingBag, Sun, User } from "lucide-react";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "@/components/primitives";
import { useLocation, useNavigate } from "react-router-dom";
import { goTo } from "@/src/utils/navigation";


import * as Haptics from "@/lib/haptics";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { useColors } from "@/src/features/Jewelery/hooks/useColors";
import {
  filterItemsByModule,
  useCartStore,
} from "@/src/features/common/cart/store/cartStore";
import { useAuthStore } from "@/src/features/common/auth/store/authStore";
import { ModuleSwitcherButton } from "@/src/components/common/ModuleSwitcherButton";
import { BREAKPOINTS, DESKTOP } from "@/src/utils/responsive";
import { TextInput } from "@/src/theme/components/TextInput";
import splashIcon from "@/assets/images/icons/splash-icon.webp";

/**
 * Desktop-only top navbar for the jewelery catalog (web >= 1024px).
 * Mirrors the clothing `DesktopNavbar` layout 1:1 — brand + pill search +
 * nav pills + notifications + module switcher + theme toggle — but with
 * jewelery routes and the gold/ivory palette.
 * Returns null on native + mobile web — mobile UI is 100% untouched.
 */
export const JeweleryDesktopNavbar = () => {
  const { width } = useWindowDimensions();
  const colors = useColors();
  const theme = useTheme() as any;
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const isDesktop =
    Platform.OS === "web" && width >= BREAKPOINTS.desktopMin;
  const bagCount = useCartStore(
    (s) => filterItemsByModule(s.items, "jewelery").length,
  );
  const { isAuthenticated } = useAuthStore();
  const toggleMode = (theme as any).toggleMode;
  const isDark = (theme as any).isDark ?? theme.text === "#ffffff";

  if (!isDesktop) return null;

  const go = (href: string) => {
    try {
      (Haptics as any)?.impactAsync?.(
        (Haptics as any)?.ImpactFeedbackStyle?.Light,
      );
    } catch {}
    goTo(navigate, href as any);
  };

  const submitSearch = () => {
    const q = query.trim();
    go(
      q
        ? (`/jewelery/search?query=${encodeURIComponent(q)}` as any)
        : ("/jewelery/search" as any),
    );
  };

  const isActive = (route: string) =>
    route === "/jewelery"
      ? pathname === "/jewelery" || pathname === "/jewelery/"
      : pathname === route || pathname?.startsWith(`${route}/`);

  const navItem = (
    label: string,
    route: string,
    Icon: LucideIcon,
    badge?: number,
  ) => {
    const active = isActive(route);
    return (
      <Pressable key={label}
        onPress={() => go(route)}
        accessibilityRole="link"
        accessibilityLabel={label}
        style={[
          styles.navItem,
          {
            backgroundColor: active ? colors.gold : "transparent",
            borderColor: active ? colors.gold : colors.midGray,
          },
          Platform.OS === "web" ? ({ cursor: "pointer" } as any) : null,
        ]}
      >
        <Icon
          size={17}
          color={active ? colors.onBrand : colors.warmGray}
        />
        <Text style={[
            styles.navLabel,
            { color: active ? colors.onBrand : colors.ink },
          ]}
        >
          {label}
        </Text>
        {typeof badge === "number" && badge > 0 ? (
          <View style={[
              styles.badge,
              { backgroundColor: active ? colors.onBrand : colors.gold },
            ]}
          >
            <Text style={[
                styles.badgeText,
                { color: active ? colors.gold : colors.onBrand },
              ]}
            >
              {badge > 99 ? "99+" : badge}
            </Text>
          </View>
        ) : null}
      </Pressable>
    );
  };

  return (
    <View style={[
        styles.shell,
        {
          backgroundColor: colors.ivory,
          borderBottomColor: colors.midGray,
          shadowColor: "#000",
        },
      ]}
    >
      <View style={styles.inner}>
        {/* Brand */}
        <Pressable onPress={() => go("/jewelery")}
          style={Platform.OS === "web" ? ({ cursor: "pointer" } as any) : null}
          accessibilityRole="link"
          accessibilityLabel="Quick Bihar jewellery home"
        >
          <View style={styles.brandRow}>
            <img src={splashIcon} alt="Quick Bihar logo" aria-label="Quick Bihar logo" style={Object.assign({}, styles.logoImage, { objectFit: "contain" as const })} />
            <View>
              <Text style={[styles.brandName, { color: colors.ink }]}>
                Quick Bihar
              </Text>
              <Text style={[styles.brandSub, { color: colors.gold }]}>
                JEWELLERY • BIHAR
              </Text>
            </View>
          </View>
        </Pressable>

        {/* Search */}
        <TextInput value={query}
          onChangeText={setQuery}
          onSubmitEditing={submitSearch}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search for gold, diamond, rings, necklaces…"
          placeholderTextColor={colors.warmGray}
          returnKeyType="search"
          focusBorderColor={colors.gold}
          icon={
            <Search size={18} color={focused ? colors.gold : colors.warmGray} />
          }
          rightIcon={
            <>
              {query.length > 0 ? (
                <Pressable onPress={() => setQuery("")} style={styles.searchClear}>
                  <CircleX size={18} color={colors.warmGray} />
                </Pressable>
              ) : null}
              <Pressable onPress={submitSearch}
                style={[styles.searchBtn, { backgroundColor: colors.gold }]}
              >
                <Text style={[styles.searchBtnText, { color: colors.onBrand }]}>
                  Search
                </Text>
              </Pressable>
            </>
          }
          containerStyle={{ marginBottom: 0, flex: 1, maxWidth: 560 }}
          inputContainerStyle={{
            backgroundColor: colors.champagne,
            borderWidth: 1.5,
            borderRadius: 999,
            paddingLeft: 16,
            paddingRight: 6,
            paddingVertical: 5,
          }}
          style={{ fontSize: 15, fontWeight: "500", color: colors.ink }}
        />

        {/* Nav */}
        <View style={styles.navRow}>
          {navItem("Home", "/jewelery", House)}
          {navItem("Collections", "/jewelery/collections", LayoutGrid)}
          {navItem("Wishlist", "/jewelery/wishlist", Heart)}
          {navItem("Bag", "/jewelery/cart", ShoppingBag, bagCount)}
          {navItem(
            isAuthenticated ? "Account" : "Login",
            "/jewelery/account",
            User,
          )}
          <Pressable onPress={() => go("/jewelery/notifications" as any)}
            style={[styles.iconBtn, { borderColor: colors.midGray }]}
            accessibilityLabel="Notifications"
          >
            <Bell size={18} color={colors.ink} />
          </Pressable>
          <ModuleSwitcherButton />
          <Pressable onPress={() => toggleMode?.()}
            style={[styles.iconBtn, { borderColor: colors.midGray }]}
            accessibilityLabel="Toggle theme"
          >
            {isDark ? (
              <Sun size={18} color={colors.ink} />
            ) : (
              <Moon size={18} color={colors.ink} />
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  shell: {
    width: "100%",
    borderBottomWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    zIndex: 50,
  },
  inner: {
    width: "100%",
    maxWidth: DESKTOP.maxWidth,
    alignSelf: "center",
    marginHorizontal: "auto" as any,
    paddingHorizontal: DESKTOP.gutter,
    paddingTop: 14,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10, minWidth: 190 },
  logoImage: {
    width: 42,
    height: 46,
    borderRadius: 12,
  },
  brandName: { fontSize: 19, fontWeight: "900", letterSpacing: -0.4, lineHeight: 22 },
  brandSub: { fontSize: 10, fontWeight: "800", letterSpacing: 1.6, marginTop: 1 },
  searchClear: { padding: 4 },
  searchBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999 },
  searchBtnText: { fontWeight: "800", fontSize: 14 },
  navRow: { flexDirection: "row", alignItems: "center", gap: 8, marginLeft: "auto" },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  },
  navLabel: { fontSize: 14, fontWeight: "700" },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  badgeText: { fontSize: 11, fontWeight: "800" },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default JeweleryDesktopNavbar;
