import type { LucideIcon } from "lucide-react";
import { Bell, CircleX, Heart, House, LayoutGrid, Moon, Search, ShoppingBag, Sun, User } from "lucide-react";
import React, { useState } from "react";
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
import { BREAKPOINTS, DESKTOP, useWindowWidth } from "@/src/utils/responsive";
import { TextInput } from "@/src/theme/components/TextInput";
import splashIcon from "@/assets/images/icons/splash-icon.webp";

/**
 * Desktop-only top navbar for the jewelery catalog (web >= 1024px).
 * Mirrors the clothing `DesktopNavbar` layout 1:1 — brand + pill search +
 * nav pills + notifications + module switcher + theme toggle — but with
 * jewelery routes and the gold/ivory palette.
 * Returns null on mobile web — mobile UI is 100% untouched.
 */
export const JeweleryDesktopNavbar = () => {
  const width = useWindowWidth();
  const colors = useColors();
  const theme = useTheme() as any;
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const isDesktop = width >= BREAKPOINTS.desktopMin;
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
      <button
        key={label}
        type="button"
        onClick={() => go(route)}
        aria-label={label}
        className="flex cursor-pointer flex-row items-center gap-[7px] rounded-full border px-3.5 py-[9px]"
        style={{
          backgroundColor: active ? colors.gold : "transparent",
          borderColor: active ? colors.gold : colors.midGray,
        }}
      >
        <Icon
          size={17}
          color={active ? colors.onBrand : colors.warmGray}
        />
        <span
          className="text-sm font-bold"
          style={{ color: active ? colors.onBrand : colors.ink }}
        >
          {label}
        </span>
        {typeof badge === "number" && badge > 0 ? (
          <span
            className="flex h-5 min-w-5 items-center justify-center rounded-full px-[5px] text-[11px] font-extrabold"
            style={{ backgroundColor: active ? colors.onBrand : colors.gold, color: active ? colors.gold : colors.onBrand }}
          >
            {badge > 99 ? "99+" : badge}
          </span>
        ) : null}
      </button>
    );
  };

  return (
    <div
      className="z-50 w-full border-b shadow-lg"
      style={{
        backgroundColor: colors.ivory,
        borderBottomColor: colors.midGray,
      }}
    >
      <div
        className="mx-auto flex w-full flex-row items-center gap-6 px-6 pt-3.5 pb-3"
        style={{ maxWidth: DESKTOP.maxWidth }}
      >
        {/* Brand */}
        <button
          type="button"
          onClick={() => go("/jewelery")}
          aria-label="Quick Bihar jewellery home"
          className="cursor-pointer"
        >
          <div className="flex min-w-[190px] flex-row items-center gap-2.5">
            <img src={splashIcon} alt="Quick Bihar logo" aria-label="Quick Bihar logo" className="h-[46px] w-[42px] rounded-xl object-contain" />
            <div>
              <p className="text-[19px] leading-[22px] font-black tracking-tight" style={{ color: colors.ink }}>
                Quick Bihar
              </p>
              <p className="mt-[1px] text-[10px] font-extrabold tracking-[1.6px]" style={{ color: colors.gold }}>
                JEWELLERY • BIHAR
              </p>
            </div>
          </div>
        </button>

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
                <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="cursor-pointer p-1">
                  <CircleX size={18} color={colors.warmGray} />
                </button>
              ) : null}
              <button
                type="button"
                onClick={submitSearch}
                className="cursor-pointer rounded-full px-5 py-2.5 text-sm font-extrabold"
                style={{ backgroundColor: colors.gold, color: colors.onBrand }}
              >
                Search
              </button>
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
        <nav className="ml-auto flex flex-row items-center gap-2">
          {navItem("Home", "/jewelery", House)}
          {navItem("Collections", "/jewelery/collections", LayoutGrid)}
          {navItem("Wishlist", "/jewelery/wishlist", Heart)}
          {navItem("Bag", "/jewelery/cart", ShoppingBag, bagCount)}
          {navItem(
            isAuthenticated ? "Account" : "Login",
            "/jewelery/account",
            User,
          )}
          <button
            type="button"
            onClick={() => go("/jewelery/notifications" as any)}
            aria-label="Notifications"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border"
            style={{ borderColor: colors.midGray }}
          >
            <Bell size={18} color={colors.ink} />
          </button>
          <ModuleSwitcherButton />
          <button
            type="button"
            onClick={() => toggleMode?.()}
            aria-label="Toggle theme"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border"
            style={{ borderColor: colors.midGray }}
          >
            {isDark ? (
              <Sun size={18} color={colors.ink} />
            ) : (
              <Moon size={18} color={colors.ink} />
            )}
          </button>
        </nav>
      </div>
    </div>
  );
};

export default JeweleryDesktopNavbar;
