import React from "react";
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
import { Bike, House, LayoutGrid, Search, ShoppingBag, ShoppingCart, User } from "lucide-react";
import * as Haptics from "@/lib/haptics";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { filterItemsByModule, useCartStore } from "@/src/features/common/cart/store/cartStore";
import { getRoleName, RIDER_ROLE_ALIAS, RoleEnum, useAuthStore } from "@/src/features/common/auth/store/authStore";
import { useModuleStore } from "@/src/store/useModuleStore";
import { useColors as useJeweleryColors } from "@/src/features/Jewelery/hooks/useColors";
import { BREAKPOINTS } from "@/src/utils/responsive";

/**
 * Jewelry tab bar — mirrors mobile `app/jewelery/(tabs)/_layout.tsx`:
 * Home · Collections · Wishlist · Bag · Account, Feather icons,
 * gold active tint. Shown on every /jewelery* route so jewelry
 * never renders the clothing tab set.
 */
const JeweleryTabBar: React.FC<{
  pathname: string;
  onPress: (route: string) => void;
}> = ({ pathname, onPress }) => {
  const colors = useJeweleryColors();
  const jeweleryCount = useCartStore((s) => filterItemsByModule(s.items, "jewelery").length);

  const tabs = [
    { name: "home", label: "Home", icon: House, route: "/jewelery" },
    { name: "collections", label: "Collections", icon: LayoutGrid, route: "/jewelery/collections" },
    { name: "search", label: "Search", icon: Search, route: "/jewelery/search" },
    { name: "bag", label: "Bag", icon: ShoppingBag, route: "/jewelery/cart", badge: jeweleryCount },
    { name: "account", label: "Account", icon: User, route: "/jewelery/account" },
  ];

  const isActive = (route: string) =>
    route === "/jewelery"
      ? pathname === "/jewelery" || pathname === "/jewelery/"
      : pathname === route || pathname.startsWith(`${route}/`);

  return (
    <View style={[
        styles.container,
        {
          backgroundColor: colors.ivory,
          borderTopColor: colors.midGray,
          shadowColor: "#000",
        },
      ]}
    >
      {tabs.map((tab) => {
        const active = isActive(tab.route);
        const color = active ? colors.gold : colors.warmGray;
        return (
          <Pressable key={tab.name}
            onPress={() => onPress(tab.route)}
            style={({ pressed }) => [
              styles.tabItem,
              pressed && { opacity: 0.7 },
            ]}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
          >
            <View style={styles.iconWrapper}>
              <tab.icon size={21} color={color} />
              {typeof tab.badge === "number" && tab.badge > 0 ? (
                <View style={[styles.badge, { backgroundColor: colors.gold }]}>
                  <Text style={styles.badgeText}>
                    {tab.badge > 99 ? "99+" : tab.badge}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text style={[
                styles.jeweleryLabel,
                { color },
              ]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

export const BottomTabBar: React.FC = () => {
  const { width } = useWindowDimensions();
  const theme = useTheme() as any;
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, isAuthenticated } = useAuthStore();
  const { currentModule } = useModuleStore();

  const isDesktop = Platform.OS === "web" && width >= BREAKPOINTS.desktopMin;
  const cartCount = useCartStore((s) => s.items.length);

  const roleName = getRoleName(user?.role);
  const isRider = roleName === RoleEnum.DELIVERY || roleName === RIDER_ROLE_ALIAS;

  // Bottom tab bar only renders on mobile screen sizes (< 1024px)
  if (isDesktop) return null;

  // Auth flows are full-screen tasks — never show tabs behind them.
  if (
    pathname === "/auth" ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/jewelery/auth/")
  ) {
    return null;
  }

  // Determine current active routes from the URL first — the persisted
  // module in the store can be stale (e.g. user was on jewelery, then opened
  // /clothing/home directly), which previously sent clothing taps to
  // /jewelery/search and /jewelery/cart.
  const isJeweleryPath = pathname.startsWith("/jewelery");
  const isFoodPath =
    pathname.startsWith("/food") || pathname.startsWith("/(tabs)/food");
  const isClothingPath =
    pathname.startsWith("/clothing") || pathname.startsWith("/(tabs)/clothing");

  const isJewelery = isJeweleryPath || (!isClothingPath && !isFoodPath && currentModule.id === "jewelery");
  const isFood = isFoodPath || (!isClothingPath && !isJeweleryPath && currentModule.id === "food");

  const pressTab = (route: string) => {
    try {
      (Haptics as any)?.impactAsync?.((Haptics as any)?.ImpactFeedbackStyle?.Heavy);
    } catch {}
    goTo(navigate, route as any);
  };

  // Jewelry gets its own 5-tab bar (mobile parity) — never the clothing set.
  if (isJewelery) {
    return <JeweleryTabBar pathname={pathname} onPress={pressTab} />;
  }

  const homeRoute = isFood ? "/food" : "/clothing/home";
  const searchRoute = "/clothing/search";
  const cartRoute = "/clothing/cart";
  const accountRoute = "/clothing/account";

  const tabs = [
    {
      name: "home",
      label: "Home",
      icon: House,
      activeIcon: House,
      route: homeRoute,
    },
    {
      name: "search",
      label: "Search",
      icon: Search,
      activeIcon: Search,
      route: searchRoute,
    },
    {
      name: "cart",
      label: "Cart",
      icon: ShoppingCart,
      activeIcon: ShoppingCart,
      route: cartRoute,
      badge: cartCount,
    },
    {
      name: "account",
      label: "Account",
      icon: User,
      activeIcon: User,
      route: accountRoute,
    },
  ];

  if (isRider) {
    tabs.push({
      name: "rider",
      label: "Rider",
      icon: Bike,
      activeIcon: Bike,
      route: "/rider",
    });
  }

  const handlePress = (tab: typeof tabs[0]) => {
    try {
      (Haptics as any)?.impactAsync?.((Haptics as any)?.ImpactFeedbackStyle?.Heavy);
    } catch {}

    if (tab.name === "account" && !isAuthenticated) {
      goTo(navigate, tab.route as any);
      return;
    }
    goTo(navigate, tab.route as any);
  };

  const isTabActive = (tabRoute: string) => {
    if (pathname === tabRoute) return true;
    if (tabRoute === "/clothing/home" && (pathname === "/" || pathname === "/clothing/home")) return true;
    if (tabRoute === "/jewelery" && pathname === "/jewelery") return true;
    if (tabRoute === "/food" && pathname === "/food") return true;
    return false;
  };

  return (
    <View style={[
        styles.container,
        {
          backgroundColor: theme.background,
          borderTopColor: theme.border || "rgba(0,0,0,0.08)",
          shadowColor: theme.shadow || "#000",
        },
      ]}
    >
      {tabs.map((tab) => {
        const active = isTabActive(tab.route);
        const TabIcon = active ? tab.activeIcon : tab.icon;
        const color = active ? (theme.primary || theme.iconColor || "#4F46E5") : (theme.tertiaryText || "#8E8E93");

        return (
          <Pressable key={tab.name}
            onPress={() => handlePress(tab)}
            style={({ pressed }) => [
              styles.tabItem,
              pressed && { opacity: 0.7 },
            ]}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
          >
            <View style={styles.iconWrapper}>
              <TabIcon size={22} color={color} />
              {typeof tab.badge === "number" && tab.badge > 0 ? (
                <View style={[styles.badge, { backgroundColor: theme.primary || "#4F46E5" }]}>
                  <Text style={styles.badgeText}>
                    {tab.badge > 99 ? "99+" : tab.badge}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text style={[
                styles.label,
                {
                  color,
                  fontWeight: active ? "700" : "500",
                },
              ]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "fixed" as any,
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    borderTopWidth: 1,
    elevation: 12,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    zIndex: 9999,
    paddingBottom: 4,
    paddingTop: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  iconWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    width: 28,
    height: 26,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
  },
  label: {
    fontSize: 10,
    marginTop: 2,
    letterSpacing: 0.2,
  },
  jeweleryLabel: {
    fontSize: 9,
    marginTop: 2,
    letterSpacing: 0.8,
  },
});

export default BottomTabBar;
