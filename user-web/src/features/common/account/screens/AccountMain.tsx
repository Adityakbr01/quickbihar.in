import React, { useMemo } from "react";
import * as Haptics from "@/lib/haptics";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { AppIcon } from "@/src/components/common/AppIcon";
import { Moon, Sun } from "lucide-react";
import { ThemeToggle } from "@/src/components/common/ThemeToggle";
import AccountHeader from "../components/AccountHeader";
import AccountOption from "../components/AccountOption";
import GuestAccountView from "../components/GuestAccountView";
import { ACCOUNT_SECTIONS, LOGOUT_OPTION } from "../lib/accountData";
import EditProfileModal from "../components/EditProfileModal";

import { useNavigate } from "react-router-dom";
import { goTo } from "@/src/utils/navigation";
import {
  getRoleName,
  RoleEnum,
  useAuthStore,
} from "@/src/features/common/auth/store/authStore";
import { useLogout } from "@/src/features/common/auth/hooks/useAuth";
import { useAccountStore } from "../store/accountStore";
import { useProfile } from "@/src/features/common/profileInfo/hooks/useProfile";
import PasswordEmailSetupSheet from "../components/PasswordEmailSetupSheet";
import { WEB_ADMIN_LOGIN_URL } from "@/src/constants/app.constants";

const AccountMain = () => {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const navigate = useNavigate();
  const setPasswordSheetVisible = useAccountStore(
    (state) => state.setPasswordSheetVisible,
  );

  // Live profile always has the freshest avatar; store is stale until re-login
  const { profile } = useProfile();
  const avatarUrl = useMemo(() => {
    const raw = profile?.avatar ?? user?.avatar;
    if (!raw) return undefined;
    if (typeof raw === "string" && raw.startsWith("http")) return raw;
    if (typeof (raw as any)?.url === "string" && (raw as any).url.startsWith("http")) return (raw as any).url;
    return undefined;
  }, [profile?.avatar, user?.avatar]);

  // Hide the Web Admin Dashboard option from non-admin users. SUPER_ADMIN
  // inherits the admin surface.
  const isAdmin =
    getRoleName(user?.role) === RoleEnum.ADMIN ||
    getRoleName(user?.role) === RoleEnum.SUPER_ADMIN;

  const handleOptionPress = (label: string) => {
    console.log(`Pressed: ${label}`);
    if (label === "Logout") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      logout();
    } else if (label === "Addresses") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      goTo(navigate, "/account/addresses");
    } else if (label === "Profile Info") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      goTo(navigate, "/account/profile-info");
    } else if (label === "Wishlist") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      goTo(navigate, "/account/wishlist");
    } else if (label === "My Orders") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      goTo(navigate, "/account/orders");
    } else if (label === "Notifications") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      goTo(navigate, "/account/notifications");
    } else if (label === "PasswordSetup" || label === "Security") {
      // Open the Password & Email Setup bottom sheet instead of routing
      // to a new screen.
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setPasswordSheetVisible(true);
    } else if (label === "WebAdminDashboard") {
      // Open the web admin in the system browser. Admin re-authenticates
      // there — no JWT handoff.
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      try {
        window.open(WEB_ADMIN_LOGIN_URL, "_blank", "noopener,noreferrer");
      } catch (err) {
        console.error("Failed to open web admin:", err);
      }
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Admin-only options live here so the gate is colocated with the render
  // and never leaks into non-admin section lists.
  const visibleSections = useMemo(
    () =>
      ACCOUNT_SECTIONS.map((section) => ({
        ...section,
        options: section.options.filter((option) => {
          if (option.onPressLabel === "WebAdminDashboard") return isAdmin;
          return true;
        }),
      })).filter((section) => section.options.length > 0),
    [isAdmin],
  );

  // Logged-out guard — guests never see orders, wishlist, profile,
  // addresses, security or logout. They get the jewelry-style guest
  // tab (info + perks + appearance toggle + sign-in entry).
  if (!isAuthenticated) {
    return <GuestAccountView />;
  }

  return (
    <div
      className="flex min-h-screen w-full justify-center"
      style={{ backgroundColor: (theme as any).background }}
    >
      <div className="w-full max-w-[800px]">
        <div className="overflow-y-auto pb-10">
          <AccountHeader
            theme={theme}
            name={user?.fullName || "Guest"}
            email={user?.email || "guest@quickbihar.in"}
            avatarUrl={avatarUrl}
          />

          {/* New Profile Edit Modal */}
          <EditProfileModal />

          {/* Password & Email Setup bottom sheet (mounted once, opened
              imperatively via the account store) */}
          <PasswordEmailSetupSheet />

          {visibleSections.map((section) => (
            <div key={section.title} className="mt-6">
              <p
                className="mb-3 ml-6 text-[13px] font-bold uppercase tracking-[1px]"
                style={{ color: (theme as any).tertiaryText }}
              >
                {section.title}
              </p>
              {section.options.map((option, optionIndex) => (
                <AccountOption
                  key={option.label}
                  theme={theme}
                  icon={option.icon}
                  label={option.label}
                  onPress={option.onPressLabel ? () => handleOptionPress(option.onPressLabel!) : undefined}
                  subItems={option.subItems?.map(sub => ({
                    ...sub,
                    onPress: () => handleOptionPress(sub.onPressLabel)
                  }))}
                  isLast={optionIndex === section.options.length - 1}
                />
              ))}
            </div>
          ))}

          {/* Appearance Section */}
          <div className="mt-6">
            <p
              className="mb-3 ml-6 text-[13px] font-bold uppercase tracking-[1px]"
              style={{ color: (theme as any).tertiaryText }}
            >
              Appearance
            </p>
            <div
              className="flex flex-row items-center px-6 py-3.5"
              style={{ backgroundColor: (theme as any).background }}
            >
              <div
                className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: (theme as any).tertiaryBackground }}
              >
                <AppIcon
                  icon={(theme as any).isDark ? Moon : Sun}
                  size={22}
                  color={(theme as any).primary}
                />
              </div>
              <span
                className="ml-4 flex-1 text-base font-semibold"
                style={{ color: (theme as any).text }}
              >
                {(theme as any).isDark ? "Dark Mode" : "Light Mode"}
              </span>
              <ThemeToggle
                value={(theme as any).isDark}
                onToggle={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  (theme as any).toggleMode();
                }}
              />
            </div>
          </div>

          {/* Logout Section */}
          <div
            className="relative mb-[60px] mt-8"
            style={isLoggingOut ? { opacity: 0.7 } : undefined}
          >
            <AccountOption
              theme={theme}
              icon={LOGOUT_OPTION.icon}
              label={LOGOUT_OPTION.label}
              onPress={isLoggingOut ? undefined : () => handleOptionPress(LOGOUT_OPTION.onPressLabel!)}
              showArrow={LOGOUT_OPTION.showArrow}
              danger={LOGOUT_OPTION.danger}
              isLast
            />
            {isLoggingOut && (
              <span
                role="status"
                aria-label="Logging out"
                className="absolute right-5 top-[15px] h-5 w-5 animate-spin rounded-full border-2"
                style={{
                  borderColor: `${(theme as any).error}33`,
                  borderTopColor: (theme as any).error,
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountMain;
