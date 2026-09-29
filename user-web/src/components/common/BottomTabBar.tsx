import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { goTo } from "@/src/utils/navigation";
import { Bike, House, LayoutGrid, Search, ShoppingBag, ShoppingCart, User } from "lucide-react";
import * as Haptics from "@/lib/haptics";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { filterItemsByModule, useCartStore } from "@/src/features/common/cart/store/cartStore";
import { getRoleName, RIDER_ROLE_ALIAS, RoleEnum, useAuthStore } from "@/src/features/common/auth/store/authStore";
import { useModuleStore } from "@/src/store/useModuleStore";
import { useColors as useJeweleryColors } from "@/src/features/Jewelery/hooks/useColors";
import { BREAKPOINTS, useWindowWidth } from "@/src/utils/responsive";
import { cn } from "@/src/lib/utils";

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
  const [pressedTab, setPressedTab] = useState<string | null>(null);

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
    <nav
      className="fixed right-0 bottom-0 left-0 z-[9999] flex h-[60px] flex-row items-center justify-around border-t px-0 py-1 shadow-[0_-3px_6px_rgba(0,0,0,0.1)]"
      style={{ backgroundColor: colors.ivory, borderTopColor: colors.midGray }}
      aria-label="Jewelery tabs"
    >
      {tabs.map((tab) => {
        const active = isActive(tab.route);
        const color = active ? colors.gold : colors.warmGray;
        return (
          <button
            key={tab.name}
            type="button"
            onClick={() => onPress(tab.route)}
            onMouseDown={() => setPressedTab(tab.name)}
            onMouseUp={() => setPressedTab(null)}
            onMouseLeave={() => setPressedTab(null)}
            role="tab"
            aria-selected={active}
            aria-label={tab.label}
            className="flex flex-1 cursor-pointer flex-col items-center justify-center py-1 transition-opacity"
            style={{ opacity: pressedTab === tab.name ? 0.7 : 1 }}
          >
            <span className="relative flex h-[26px] w-7 items-center justify-center">
              <tab.icon size={21} color={color} />
              {typeof tab.badge === "number" && tab.badge > 0 ? (
                <span
                  className="absolute -top-1 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-extrabold text-white"
                  style={{ backgroundColor: colors.gold }}
                >
                  {tab.badge > 99 ? "99+" : tab.badge}
                </span>
              ) : null}
            </span>
            <span className="mt-0.5 truncate text-[9px] tracking-[0.8px]" style={{ color }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export const BottomTabBar: React.FC = () => {
  const width = useWindowWidth();
  const theme = useTheme() as any;
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, isAuthenticated } = useAuthStore();
  const { currentModule } = useModuleStore();
  const [pressedTab, setPressedTab] = useState<string | null>(null);

  const isDesktop = width >= BREAKPOINTS.desktopMin;
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
    <nav
      className="fixed right-0 bottom-0 left-0 z-[9999] flex h-[60px] flex-row items-center justify-around border-t px-0 py-1 shadow-[0_-3px_6px_rgba(0,0,0,0.1)]"
      style={{
        backgroundColor: theme.background,
        borderTopColor: theme.border || "rgba(0,0,0,0.08)",
      }}
      aria-label="Main tabs"
    >
      {tabs.map((tab) => {
        const active = isTabActive(tab.route);
        const TabIcon = active ? tab.activeIcon : tab.icon;
        const color = active ? (theme.primary || theme.iconColor || "#4F46E5") : (theme.tertiaryText || "#8E8E93");

        return (
          <button
            key={tab.name}
            type="button"
            onClick={() => handlePress(tab)}
            onMouseDown={() => setPressedTab(tab.name)}
            onMouseUp={() => setPressedTab(null)}
            onMouseLeave={() => setPressedTab(null)}
            role="tab"
            aria-selected={active}
            aria-label={tab.label}
            className={cn("flex flex-1 cursor-pointer flex-col items-center justify-center py-1 transition-opacity")}
            style={{ opacity: pressedTab === tab.name ? 0.7 : 1 }}
          >
            <span className="relative flex h-[26px] w-7 items-center justify-center">
              <TabIcon size={22} color={color} />
              {typeof tab.badge === "number" && tab.badge > 0 ? (
                <span
                  className="absolute -top-1 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-extrabold text-white"
                  style={{ backgroundColor: theme.primary || "#4F46E5" }}
                >
                  {tab.badge > 99 ? "99+" : tab.badge}
                </span>
              ) : null}
            </span>
            <span
              className="mt-0.5 truncate text-[10px] tracking-wide"
              style={{ color, fontWeight: active ? "700" : "500" }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomTabBar;
