import React, { useMemo } from "react";
import { View, ScrollView, Text, Linking } from "react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { createAccountStyles } from "../styles/accountStyles";
import AccountHeader from "../components/AccountHeader";
import AccountOption from "../components/AccountOption";
import { ACCOUNT_SECTIONS, LOGOUT_OPTION } from "../lib/accountData";
import { ActivityIndicator } from "react-native";
import EditProfileModal from "../components/EditProfileModal";

import { useRouter } from "expo-router";
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
  const styles = createAccountStyles(theme);
  const user = useAuthStore((state) => state.user);
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const router = useRouter();
  const setPasswordSheetVisible = useAccountStore(
    (state) => state.setPasswordSheetVisible,
  );

  // Live profile always has the freshest avatar; store is stale until re-login
  const { profile } = useProfile();
  const avatarUrl = profile?.avatar?.url ?? user?.avatar?.url;

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
      router.push("/account/addresses");
    } else if (label === "Profile Info") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push("/account/profile-info");
    } else if (label === "Wishlist") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push("/account/wishlist");
    } else if (label === "My Orders") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push("/account/orders");
    } else if (label === "Notifications") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push("/account/notifications");
    } else if (label === "PasswordSetup" || label === "Security") {
      // Open the Password & Email Setup bottom sheet instead of routing
      // to a new screen.
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setPasswordSheetVisible(true);
    } else if (label === "WebAdminDashboard") {
      // Open the web admin in the system browser. Admin re-authenticates
      // there — no JWT handoff.
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Linking.openURL(WEB_ADMIN_LOGIN_URL).catch((err) =>
        console.error("Failed to open web admin:", err),
      );
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

  return (
    <View style={styles.container}>
      <View style={styles.mainWrapper}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <AccountHeader
            theme={theme}
            styles={styles}
            name={user?.fullName || "Guest"}
            email={user?.email || "guest@quickbihar.in"}
            avatarUrl={avatarUrl}
          />

          {/* New Profile Edit Modal */}
          <EditProfileModal />

          {/* Password & Email Setup bottom sheet (mounted once, opened
              imperatively via the account store) */}
          <PasswordEmailSetupSheet />

          {visibleSections.map((section, sectionIndex) => (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.options.map((option, optionIndex) => (
                <AccountOption
                  key={option.label}
                  theme={theme}
                  styles={styles}
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
            </View>
          ))}

          {/* Logout Section */}
          <View style={[styles.logoutRow, isLoggingOut && { opacity: 0.7 }]}>
            <AccountOption
              theme={theme}
              styles={styles}
              icon={LOGOUT_OPTION.icon}
              label={LOGOUT_OPTION.label}
              onPress={isLoggingOut ? undefined : () => handleOptionPress(LOGOUT_OPTION.onPressLabel!)}
              showArrow={LOGOUT_OPTION.showArrow}
              danger={LOGOUT_OPTION.danger}
              isLast
            />
            {isLoggingOut && (
              <ActivityIndicator
                style={{ position: "absolute", right: 20, top: 15 }}
                color={theme.error}
              />
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

export default AccountMain;
