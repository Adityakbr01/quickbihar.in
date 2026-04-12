import SafeViewWrapper from "@/src/provider/SafeViewWrapper";
import { useAuthStore } from "@/src/features/auth/store/authStore";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { Redirect } from "expo-router";
import { Settings01Icon, Analytics01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import AdminHeader from "@/src/features/admin/components/AdminHeader";
import AdminStatCard from "@/src/features/admin/components/AdminStatCard";
import { ADMIN_CARDS } from "@/src/features/admin/lib/adminData";

export default function AdminScreen() {
  const theme = useTheme();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";

  console.log("[AdminScreen] Rendered. Role:", user?.role, "isAdmin:", isAdmin);

  if (!isAdmin) {
    return <Redirect href="/home" />;
  }

  return (
    <SafeViewWrapper>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <AdminHeader
          title="Admin Dashboard"
          subtitle="Welcome back, Administrator."
        />

        <View style={styles.grid}>
          {ADMIN_CARDS.map((card, index) => (
            <AdminStatCard key={index} card={card} />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.settingItem, { borderTopWidth: 1, borderTopColor: theme.border }]}
          activeOpacity={0.6}
        >
          <View style={styles.settingTextContainer}>
            <HugeiconsIcon icon={Settings01Icon} size={20} color={theme.iconColor} />
            <Text style={[styles.settingLabel, { color: theme.text }]}>System Settings</Text>
          </View>
          <HugeiconsIcon icon={Analytics01Icon} size={20} color={theme.tertiaryText} />
        </TouchableOpacity>
      </ScrollView>
    </SafeViewWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
    paddingTop: 40,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  settingItem: {
    marginTop: 24,
    paddingVertical: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  settingTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
});
