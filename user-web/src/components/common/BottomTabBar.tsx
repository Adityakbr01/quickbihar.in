import React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { usePathname, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { useCartStore } from "@/src/features/common/cart/store/cartStore";
import { getRoleName, RIDER_ROLE_ALIAS, RoleEnum, useAuthStore } from "@/src/features/common/auth/store/authStore";
import { useModuleStore } from "@/src/store/useModuleStore";
import { BREAKPOINTS } from "@/src/utils/responsive";

export const BottomTabBar: React.FC = () => {
  const { width } = useWindowDimensions();
  const theme = useTheme() as any;
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();
  const { currentModule } = useModuleStore();

  const isDesktop = Platform.OS === "web" && width >= BREAKPOINTS.desktopMin;
  const cartCount = useCartStore((s) => s.items.length);

  const roleName = getRoleName(user?.role);
  const isRider = roleName === RoleEnum.DELIVERY || roleName === RIDER_ROLE_ALIAS;

  // Bottom tab bar only renders on mobile screen sizes (< 1024px)
  if (isDesktop) return null;

  // Determine current active routes based on current catalog module
  const isJewelery = currentModule.id === "jewelery" || pathname.startsWith("/jewelery");
  const isFood = currentModule.id === "food" || pathname.startsWith("/food");

  const homeRoute = isJewelery ? "/jewelery" : isFood ? "/food" : "/clothing/home";
  const searchRoute = isJewelery ? "/jewelery/search" : "/clothing/search";
  const cartRoute = isJewelery ? "/jewelery/cart" : "/clothing/cart";
  const accountRoute = isJewelery ? "/jewelery/account" : "/clothing/account";

  const tabs = [
    {
      name: "home",
      label: "Home",
      icon: "home-outline",
      activeIcon: "home",
      route: homeRoute,
    },
    {
      name: "search",
      label: "Search",
      icon: "search-outline",
      activeIcon: "search",
      route: searchRoute,
    },
    {
      name: "cart",
      label: isJewelery ? "Bag" : "Cart",
      icon: isJewelery ? "bag-handle-outline" : "cart-outline",
      activeIcon: isJewelery ? "bag-handle" : "cart",
      route: cartRoute,
      badge: cartCount,
    },
    {
      name: "account",
      label: "Account",
      icon: "person-outline",
      activeIcon: "person",
      route: accountRoute,
    },
  ];

  if (isRider) {
    tabs.push({
      name: "rider",
      label: "Rider",
      icon: "bicycle-outline",
      activeIcon: "bicycle",
      route: "/rider",
    });
  }

  const handlePress = (tab: typeof tabs[0]) => {
    try {
      (Haptics as any)?.impactAsync?.((Haptics as any)?.ImpactFeedbackStyle?.Heavy);
    } catch {}

    if (tab.name === "account" && !isAuthenticated) {
      router.push(tab.route as any);
      return;
    }
    router.push(tab.route as any);
  };

  const isTabActive = (tabRoute: string) => {
    if (pathname === tabRoute) return true;
    if (tabRoute === "/clothing/home" && (pathname === "/" || pathname === "/clothing/home")) return true;
    if (tabRoute === "/jewelery" && pathname === "/jewelery") return true;
    if (tabRoute === "/food" && pathname === "/food") return true;
    return false;
  };

  return (
    <View
      style={[
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
        const iconName = active ? tab.activeIcon : tab.icon;
        const color = active ? (theme.primary || theme.iconColor || "#4F46E5") : (theme.tertiaryText || "#8E8E93");

        return (
          <Pressable
            key={tab.name}
            onPress={() => handlePress(tab)}
            style={({ pressed }) => [
              styles.tabItem,
              pressed && { opacity: 0.7 },
            ]}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
          >
            <View style={styles.iconWrapper}>
              <Ionicons name={iconName as any} size={22} color={color} />
              {typeof tab.badge === "number" && tab.badge > 0 ? (
                <View style={[styles.badge, { backgroundColor: theme.primary || "#4F46E5" }]}>
                  <Text style={styles.badgeText}>
                    {tab.badge > 99 ? "99+" : tab.badge}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text
              style={[
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
});

export default BottomTabBar;
