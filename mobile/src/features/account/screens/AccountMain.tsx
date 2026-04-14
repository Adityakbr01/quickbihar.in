import React from "react";
import { View, ScrollView, Text } from "react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { createAccountStyles } from "../styles/accountStyles";
import AccountHeader from "../components/AccountHeader";
import AccountOption from "../components/AccountOption";
import { ACCOUNT_SECTIONS, LOGOUT_OPTION } from "../lib/accountData";
import { useLogout } from "../../auth/hooks/useAuth";
import { useAuthStore } from "../../auth/store/authStore";
import { ActivityIndicator } from "react-native";
import EditProfileModal from "../components/EditProfileModal";

import { useRouter } from "expo-router";

const AccountMain = () => {
  const theme = useTheme();
  const styles = createAccountStyles(theme);
  const user = useAuthStore((state) => state.user);
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const router = useRouter();

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
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

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
            avatarUrl={user?.avatar?.url}
          />

          {/* New Profile Edit Modal */}
          <EditProfileModal />

          {ACCOUNT_SECTIONS.map((section, sectionIndex) => (
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
