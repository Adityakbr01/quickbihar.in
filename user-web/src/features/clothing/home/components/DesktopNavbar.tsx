import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { goTo } from "@/src/utils/navigation";

import type { LucideIcon } from "lucide-react";
import { Bell, CircleX, House, Moon, Search, ShoppingBag, Sun, User } from "lucide-react";
import * as Haptics from "@/lib/haptics";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { useCartStore } from "@/src/features/common/cart/store/cartStore";
import { useAuthStore } from "@/src/features/common/auth/store/authStore";
import { ModuleSwitcherButton } from "@/src/components/common/ModuleSwitcherButton";
import { BREAKPOINTS, DESKTOP, useWindowWidth } from "@/src/utils/responsive";
import { TextInput } from "@/src/theme/components/TextInput";
import splashIcon from "@/assets/images/icons/splash-icon.webp";

/**
 * Desktop-only top navbar for the clothing catalog (web >= 1024px).
 * Returns null on mobile web — mobile UI is 100% untouched.
 */
export const DesktopNavbar = () => {
  const width = useWindowWidth();
  const theme = useTheme() as any;
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const isDesktop = width >= BREAKPOINTS.desktopMin;
  const cartCount = useCartStore((s) => s.items.filter((i) => (i.module ?? "clothing") === "clothing").length);
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
        ? (`/(tabs)/clothing/search?query=${encodeURIComponent(q)}` as any)
        : ("/(tabs)/clothing/search" as any),
    );
  };

  const isActive = (seg: string) => pathname?.includes(seg);

  // Active pill is lime primary (#80c314): near-black text/icons keep
  // ≥4.5:1 (white on lime is ~2.1:1). Badge inverts to stay legible.
  const navItem = (label: string, seg: string, href: string, Icon: LucideIcon, badge?: number) => {
    const active = isActive(seg);
    return (
      <button
        key={label}
        type="button"
        onClick={() => go(href)}
        aria-label={label}
        className="flex cursor-pointer flex-row items-center gap-2 rounded-full border px-3.5 py-2"
        style={{
          backgroundColor: active ? theme.primary : "transparent",
          borderColor: active ? theme.primary : theme.border,
        }}
      >
        <Icon size={17} color={active ? "#142000" : theme.secondaryText} />
        <span
          className="text-sm font-bold"
          style={{ color: active ? "#142000" : theme.text }}
        >
          {label}
        </span>
        {typeof badge === "number" && badge > 0 ? (
          <span
            className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-extrabold"
            style={{ backgroundColor: active ? "#142000" : theme.primary, color: active ? theme.primary : "#142000" }}
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
      style={{ backgroundColor: theme.background, borderBottomColor: theme.border }}
    >
      <div
        className="mx-auto flex w-full flex-row items-center gap-6 px-6 pt-3.5 pb-3"
        style={{ maxWidth: DESKTOP.maxWidth }}
      >
        {/* Brand */}
        <button
          type="button"
          onClick={() => go("/(tabs)/clothing/home")}
          className="cursor-pointer"
        >
          <div className="flex min-w-[190px] flex-row items-center gap-2.5">
            <img src={splashIcon} alt="QuickBihar logo - Online Shopping in Bihar" title="QuickBihar - Online Shopping in Bihar" className="h-[46px] w-[42px] rounded-xl object-contain" />
            <div>
              <p className="text-[19px] leading-[22px] font-black tracking-tight" style={{ color: theme.text }}>
                Quick Bihar
              </p>
              <p className="mt-0.5 text-[10px] font-extrabold tracking-[1.6px]" style={{ color: theme.primary }}>
                FASHION • BIHAR
              </p>
            </div>
          </div>
        </button>

        {/* Search */}
        <TextInput
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={submitSearch}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search for sarees, kurtas, jeans, shoes…"
          placeholderTextColor={theme.tertiaryText}
          returnKeyType="search"
          icon={
            <Search size={18} color={focused ? theme.primary : theme.secondaryText} />
          }
          rightIcon={
            <>
              {query.length > 0 ? (
                <button type="button" onClick={() => setQuery("")} className="cursor-pointer p-1">
                  <CircleX size={18} color={theme.secondaryText} />
                </button>
              ) : null}
              <button
                type="button"
                onClick={submitSearch}
                className="rounded-full px-5 py-2.5 text-sm font-extrabold"
                style={{ backgroundColor: theme.primary, color: "#142000" }}
              >
                Search
              </button>
            </>
          }
          containerStyle={{ marginBottom: 0, flex: 1, maxWidth: 560 }}
          inputContainerStyle={{
            backgroundColor: theme.secondaryBackground,
            borderWidth: 1.5,
            borderRadius: 999,
            paddingLeft: 16,
            paddingRight: 6,
            paddingVertical: 5,
          }}
          style={{ fontSize: 15, fontWeight: "500", color: theme.text }}
        />

        {/* Nav */}
        <nav className="ml-auto flex flex-row items-center gap-2">
          {navItem("Home", "/clothing/home", "/(tabs)/clothing/home", House)}
          {navItem("Cart", "/clothing/cart", "/(tabs)/clothing/cart", ShoppingBag, cartCount)}
          {navItem(
            isAuthenticated ? "Account" : "Login",
            "/clothing/account",
            "/(tabs)/clothing/account",
            User,
          )}
          <button
            type="button"
            onClick={() => go("/account/notifications" as any)}
            aria-label="Notifications"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border"
            style={{ borderColor: theme.border }}
          >
            <Bell size={18} color={theme.text} />
          </button>
          <ModuleSwitcherButton />
          <button
            type="button"
            onClick={() => toggleMode?.()}
            aria-label="Toggle theme"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border"
            style={{ borderColor: theme.border }}
          >
            {isDark ? (
              <Sun size={18} color={theme.text} />
            ) : (
              <Moon size={18} color={theme.text} />
            )}
          </button>
        </nav>
      </div>
    </div>
  );
};

export default DesktopNavbar;
