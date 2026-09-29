import React from "react";
import * as Haptics from "@/lib/haptics";
import { useNavigate } from "react-router-dom";
import { goTo } from "@/src/utils/navigation";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { AppIcon } from "@/src/components/common/AppIcon";
import { Box, CircleUser, Folder, MapPin, Moon, Sun } from "lucide-react";
import { ThemeToggle } from "@/src/components/common/ThemeToggle";

/**
 * Logged-out account tab (clothing) — mirrors the jewelry guest tab:
 * guests see store info, member perks and the appearance toggle, plus
 * sign-in entry points. The full account (orders, wishlist, profile,
 * addresses, security, logout) is never rendered without a session.
 */
const GuestAccountView = () => {
  const theme = useTheme() as any;
  const navigate = useNavigate();

  const goAuth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    goTo(navigate, "/auth" as any);
  };

  const perks = [
    { icon: Box, title: "Track your orders", sub: "Live status from packed to delivered" },
    { icon: Folder, title: "Wishlist sync", sub: "Save pieces across all your devices" },
    { icon: MapPin, title: "Faster checkout", sub: "Saved addresses and quick reorder" },
  ];

  return (
    <div
      className="flex min-h-screen w-full justify-center"
      style={{ backgroundColor: theme.background }}
    >
      <div className="w-full max-w-[800px]">
        <div className="overflow-y-auto pb-10">
          {/* Guest hero */}
          <div
            className="mb-2 flex flex-col items-center rounded-[20px] border p-6"
            style={{ backgroundColor: theme.secondaryBackground, borderColor: theme.border }}
          >
            <div
              className="mb-3 flex h-16 w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: theme.primary }}
            >
              <AppIcon icon={CircleUser} size={34} color="#ffffff" />
            </div>
            <p
              className="text-center text-xl font-extrabold tracking-[-0.3px]"
              style={{ color: theme.text }}
            >
              Welcome to QuickBihar
            </p>
            <p
              className="mt-1.5 text-center text-[13px] leading-[19px]"
              style={{ color: theme.secondaryText }}
            >
              Sign in for orders, wishlist and faster checkout.
            </p>
            <button
              type="button"
              onClick={goAuth}
              className="mt-4 w-full rounded-xl py-3.5 text-[15px] font-extrabold text-white transition active:opacity-90"
              style={{ backgroundColor: theme.primary }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={goAuth}
              className="mt-2.5 w-full rounded-xl border-[1.5px] py-3 text-sm font-extrabold transition active:opacity-90"
              style={{ borderColor: theme.primary, color: theme.primary }}
            >
              Create Account
            </button>
          </div>

          {/* Member perks */}
          <div className="mt-6">
            <p
              className="mb-3 ml-6 text-[13px] font-bold uppercase tracking-[1px]"
              style={{ color: theme.tertiaryText }}
            >
              Member Perks
            </p>
            {perks.map((perk, index) => (
              <div key={perk.title}>
                <div
                  className="flex flex-row items-center px-6 py-3.5"
                  style={{
                    backgroundColor: theme.background,
                    borderBottom:
                      index === perks.length - 1
                        ? "none"
                        : `1px solid ${theme.border}`,
                  }}
                >
                  <div
                    className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: theme.tertiaryBackground }}
                  >
                    <AppIcon icon={perk.icon} size={22} color={theme.primary} />
                  </div>
                  <div className="ml-4 flex-1">
                    <p
                      className="text-base font-semibold"
                      style={{ color: theme.text }}
                    >
                      {perk.title}
                    </p>
                    <p
                      className="mt-0.5 text-xs"
                      style={{ color: theme.secondaryText }}
                    >
                      {perk.sub}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Appearance Section (same as signed-in account) */}
          <div className="mt-6">
            <p
              className="mb-3 ml-6 text-[13px] font-bold uppercase tracking-[1px]"
              style={{ color: theme.tertiaryText }}
            >
              Appearance
            </p>
            <div
              className="flex flex-row items-center px-6 py-3.5"
              style={{ backgroundColor: theme.background }}
            >
              <div
                className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: theme.tertiaryBackground }}
              >
                <AppIcon
                  icon={theme.isDark ? Moon : Sun}
                  size={22}
                  color={theme.primary}
                />
              </div>
              <span
                className="ml-4 flex-1 text-base font-semibold"
                style={{ color: theme.text }}
              >
                {theme.isDark ? "Dark Mode" : "Light Mode"}
              </span>
              <ThemeToggle
                value={theme.isDark}
                onToggle={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  theme.toggleMode();
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestAccountView;
