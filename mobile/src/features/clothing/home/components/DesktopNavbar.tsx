import React, { useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { usePathname, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { useCartStore } from "@/src/features/common/cart/store/cartStore";
import { useAuthStore } from "@/src/features/common/auth/store/authStore";
import { BREAKPOINTS, DESKTOP } from "@/src/utils/responsive";

const QUICK_LINKS = [
  "Men",
  "Women",
  "Kids",
  "Saree",
  "Kurta",
  "Jeans",
  "Dress",
  "Shoes",
];

/**
 * Desktop-only top navbar for the clothing catalog (web >= 1024px).
 * Returns null on native + mobile web — mobile UI is 100% untouched.
 */
export const DesktopNavbar = () => {
  const { width } = useWindowDimensions();
  const theme = useTheme() as any;
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const isDesktop =
    Platform.OS === "web" && width >= BREAKPOINTS.desktopMin;
  const cartCount = useCartStore((s) => (s as any).itemCount ?? s.items.length ?? 0);
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
    router.push(href as any);
  };

  const submitSearch = () => {
    const q = query.trim();
    go(
      q
        ? (`/(tabs)/clothing/search?query=${encodeURIComponent(q)}` as any)
        : ("/(tabs)/clothing/search" as any),
    );
  };

  const isActive = (seg: string) => pathname?.includes(seg);

  const navItem = (label: string, seg: string, href: string, icon: any, badge?: number) => {
    const active = isActive(seg);
    return (
      <Pressable
        key={label}
        onPress={() => go(href)}
        accessibilityRole="link"
        accessibilityLabel={label}
        style={[
          styles.navItem,
          {
            backgroundColor: active ? theme.primary : "transparent",
            borderColor: active ? theme.primary : theme.border,
          },
          Platform.OS === "web" ? ({ cursor: "pointer" } as any) : null,
        ]}
      >
        <Ionicons
          name={icon}
          size={17}
          color={active ? "#fff" : theme.secondaryText}
        />
        <Text
          style={[
            styles.navLabel,
            { color: active ? "#fff" : theme.text },
          ]}
        >
          {label}
        </Text>
        {typeof badge === "number" && badge > 0 ? (
          <View
            style={[
              styles.badge,
              { backgroundColor: active ? "#fff" : theme.primary },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: active ? theme.primary : "#fff" },
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
    <View
      style={[
        styles.shell,
        {
          backgroundColor: theme.background,
          borderBottomColor: theme.border,
          shadowColor: theme.shadow,
        },
      ]}
    >
      <View style={styles.inner}>
        {/* Brand */}
        <Pressable
          onPress={() => go("/(tabs)/clothing/home")}
          style={Platform.OS === "web" ? ({ cursor: "pointer" } as any) : null}
          accessibilityRole="link"
          accessibilityLabel="Quick Bihar home"
        >
          <View style={styles.brandRow}>
            <View style={[styles.logoMark, { backgroundColor: theme.primary }]}>
              <Text style={styles.logoText}>QB</Text>
            </View>
            <View>
              <Text style={[styles.brandName, { color: theme.text }]}>
                Quick Bihar
              </Text>
              <Text style={[styles.brandSub, { color: theme.primary }]}>
                FASHION • BIHAR
              </Text>
            </View>
          </View>
        </Pressable>

        {/* Search */}
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: theme.secondaryBackground,
              borderColor: focused ? theme.primary : theme.border,
            },
          ]}
        >
          <Ionicons
            name="search"
            size={18}
            color={focused ? theme.primary : theme.secondaryText}
          />
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={submitSearch}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Search for sarees, kurtas, jeans, shoes…"
            placeholderTextColor={theme.tertiaryText}
            returnKeyType="search"
            style={[styles.searchInput, { color: theme.text }]}
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery("")} style={styles.searchClear}>
              <Ionicons name="close-circle" size={18} color={theme.secondaryText} />
            </Pressable>
          ) : null}
          <Pressable
            onPress={submitSearch}
            style={[styles.searchBtn, { backgroundColor: theme.primary }]}
          >
            <Text style={styles.searchBtnText}>Search</Text>
          </Pressable>
        </View>

        {/* Nav */}
        <View style={styles.navRow}>
          {navItem("Home", "/clothing/home", "/(tabs)/clothing/home", "home-outline")}
          {navItem("Cart", "/clothing/cart", "/(tabs)/clothing/cart", "bag-outline", cartCount)}
          {navItem(
            isAuthenticated ? "Account" : "Login",
            "/clothing/account",
            "/(tabs)/clothing/account",
            "person-outline",
          )}
          <Pressable
            onPress={() => go("/account/notifications" as any)}
            style={[styles.iconBtn, { borderColor: theme.border }]}
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={18} color={theme.text} />
          </Pressable>
          <Pressable
            onPress={() => toggleMode?.()}
            style={[styles.iconBtn, { borderColor: theme.border }]}
            accessibilityLabel="Toggle theme"
          >
            <Ionicons
              name={isDark ? "sunny-outline" : "moon-outline"}
              size={18}
              color={theme.text}
            />
          </Pressable>
        </View>
      </View>

      {/* Category strip */}
      <View style={[styles.strip, { borderTopColor: theme.border }]}>
        <View style={styles.stripInner}>
          <Text style={[styles.stripLabel, { color: theme.secondaryText }]}>
            Shop:
          </Text>
          {QUICK_LINKS.map((c) => (
            <Pressable
              key={c}
              onPress={() =>
                go(`/(tabs)/clothing/search?query=${encodeURIComponent(c)}` as any)
              }
              style={Platform.OS === "web" ? ({ cursor: "pointer" } as any) : null}
            >
              <Text style={[styles.stripLink, { color: theme.text }]}>{c}</Text>
            </Pressable>
          ))}
          <Pressable onPress={() => go("/mall" as any)}>
            <Text style={[styles.stripLink, { color: theme.primary, fontWeight: "800" }]}>
              Explore Malls →
            </Text>
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
  logoMark: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { color: "#fff", fontWeight: "900", fontSize: 16, letterSpacing: 0.5 },
  brandName: { fontSize: 19, fontWeight: "900", letterSpacing: -0.4, lineHeight: 22 },
  brandSub: { fontSize: 10, fontWeight: "800", letterSpacing: 1.6, marginTop: 1 },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 999,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 5,
    gap: 10,
    maxWidth: 560,
  },
  searchInput: { flex: 1, fontSize: 15, fontWeight: "500", paddingVertical: 8, outlineStyle: "none" as any },
  searchClear: { padding: 4 },
  searchBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999 },
  searchBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },
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
  strip: { borderTopWidth: 1, width: "100%" },
  stripInner: {
    width: "100%",
    maxWidth: DESKTOP.maxWidth,
    alignSelf: "center",
    marginHorizontal: "auto" as any,
    paddingHorizontal: DESKTOP.gutter,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  stripLabel: { fontSize: 12, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase" },
  stripLink: { fontSize: 14, fontWeight: "600" },
});

export default DesktopNavbar;
