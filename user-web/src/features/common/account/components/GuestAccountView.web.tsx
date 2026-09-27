import React from "react";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import {
  ChevronRight,
  Heart,
  MapPin,
  Moon,
  Package,
  Sun,
  User,
} from "lucide-react";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";

/**
 * Web-only logged-out account tab (Tailwind) in the CLOTHING module theme
 * (app theme tokens — background/text/primary). Jewelry keeps its own
 * emerald/gold guest tab; never mix the two palettes.
 * Mobile keeps GuestAccountView.tsx (React Native primitives).
 */
export default function GuestAccountView() {
  const theme = useTheme() as any;
  const router = useRouter();
  const isDark = !!theme.isDark;

  const goAuth = () => {
    try {
      (Haptics as any)?.impactAsync?.(
        (Haptics as any)?.ImpactFeedbackStyle?.Medium,
      );
    } catch {}
    router.push("/auth" as any);
  };

  const perks = [
    { icon: Package, text: "Track orders from packed to delivered" },
    { icon: Heart, text: "Wishlist synced across your devices" },
    { icon: MapPin, text: "Faster checkout with saved addresses" },
  ];

  const menu = [
    { icon: Package, label: "Help & Support", sub: "Sizing guide, returns, care" },
    { icon: User, label: "About QuickBihar", sub: "Our story and craft" },
  ];

  return (
    <div
      className="min-h-screen w-full"
      style={{ backgroundColor: theme.background }}
    >
      <div className="mx-auto w-full max-w-md px-4 pb-28 pt-4">
        <h1
          className="px-1 text-[20px] font-extrabold tracking-[-0.5px]"
          style={{ color: theme.text }}
        >
          Account
        </h1>

        {/* Guest hero — clothing theme */}
        <div
          className="mt-3 flex flex-col items-center gap-3 rounded-[20px] border p-6 text-center"
          style={{
            backgroundColor: theme.secondaryBackground,
            borderColor: theme.border,
          }}
        >
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: theme.primary }}
          >
            <User size={30} color="#ffffff" />
          </div>
          <p
            className="text-[20px] font-extrabold leading-[26px]"
            style={{ color: theme.text }}
          >
            Welcome to QuickBihar
          </p>
          <p
            className="text-[13px] leading-[19px]"
            style={{ color: theme.secondaryText }}
          >
            Sign in for orders, wishlist and faster checkout.
          </p>
          <div className="mt-1 flex w-full flex-col gap-2.5">
            <button
              onClick={goAuth}
              className="w-full rounded-xl py-[14px] text-[15px] font-extrabold transition active:opacity-80"
              style={{ backgroundColor: theme.primary, color: "#ffffff" }}
            >
              Sign In
            </button>
            <button
              onClick={goAuth}
              className="w-full rounded-xl border-[1.5px] py-[13px] text-sm font-extrabold transition active:opacity-80"
              style={{ borderColor: theme.primary, color: theme.primary }}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Perks */}
        <p
          className="mt-5 px-1 text-[13px] font-bold uppercase tracking-wide"
          style={{ color: theme.secondaryText }}
        >
          Member Perks
        </p>
        <div className="mt-2 flex flex-col">
          {perks.map((p, i) => (
            <div
              key={p.text}
              className="flex items-center gap-3 px-1 py-3"
              style={{
                borderBottom:
                  i === perks.length - 1
                    ? "none"
                    : `1px solid ${theme.border}`,
              }}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${theme.primary}18` }}
              >
                <p.icon size={20} color={theme.primary} />
              </div>
              <p
                className="flex-1 text-sm font-medium"
                style={{ color: theme.text }}
              >
                {p.text}
              </p>
            </div>
          ))}
        </div>

        {/* Menu */}
        <div className="mt-2">
          {menu.map((item, i) => (
            <button
              key={item.label}
              onClick={() => {
                try {
                  (Haptics as any)?.impactAsync?.(
                    (Haptics as any)?.ImpactFeedbackStyle?.Light,
                  );
                } catch {}
              }}
              className="flex w-full items-center gap-3 px-1 py-3 text-left transition active:opacity-70"
              style={{
                borderBottom:
                  i === menu.length - 1
                    ? "none"
                    : `1px solid ${theme.border}`,
              }}
            >
              <item.icon size={20} color={theme.primary} />
              <span className="flex flex-1 flex-col">
                <span
                  className="text-sm font-semibold"
                  style={{ color: theme.text }}
                >
                  {item.label}
                </span>
                <span
                  className="mt-0.5 text-xs"
                  style={{ color: theme.secondaryText }}
                >
                  {item.sub}
                </span>
              </span>
              <ChevronRight size={16} style={{ color: theme.tertiaryText }} />
            </button>
          ))}
        </div>

        {/* Appearance */}
        <p
          className="mt-5 px-1 text-[13px] font-bold uppercase tracking-wide"
          style={{ color: theme.secondaryText }}
        >
          Appearance
        </p>
        <div className="mt-2 flex items-center gap-3 px-1 py-3">
          {isDark ? (
            <Moon size={20} color={theme.primary} />
          ) : (
            <Sun size={20} color={theme.primary} />
          )}
          <span
            className="flex-1 text-sm font-semibold"
            style={{ color: theme.text }}
          >
            {isDark ? "Dark Mode" : "Light Mode"}
          </span>
          <button
            role="switch"
            aria-checked={isDark}
            aria-label="Toggle theme"
            onClick={() => {
              try {
                (Haptics as any)?.impactAsync?.(
                  (Haptics as any)?.ImpactFeedbackStyle?.Medium,
                );
              } catch {}
              theme.toggleMode?.();
            }}
            className="relative h-[31px] w-[51px] shrink-0 rounded-full p-[2px] transition-colors"
            style={{
              backgroundColor: isDark ? "#34C759" : "#E9E9EA",
            }}
          >
            <span
              className="block h-[27px] w-[27px] rounded-full bg-white shadow transition-all"
              style={{ marginLeft: isDark ? "20px" : "0px" }}
            />
          </button>
        </div>

        {/* Footer brand */}
        <div className="flex flex-col items-center gap-1.5 py-8">
          <p
            className="text-[19px] font-black tracking-[-0.4px]"
            style={{ color: theme.text }}
          >
            Quick Bihar
          </p>
          <p
            className="text-[10px] font-bold uppercase tracking-[1.6px]"
            style={{ color: theme.primary }}
          >
            Fashion · Bihar
          </p>
          <p className="mt-1 text-[10px]" style={{ color: theme.tertiaryText }}>
            v1.0.0
          </p>
        </div>
      </div>
    </div>
  );
}
