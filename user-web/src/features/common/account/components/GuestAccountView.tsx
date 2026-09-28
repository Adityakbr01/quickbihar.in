import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as Haptics from "@/lib/haptics";
import { useNavigate } from "react-router-dom";
import { goTo } from "@/src/utils/navigation";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { AppIcon } from "@/src/components/common/AppIcon";
import { ThemeToggle } from "@/src/components/common/ThemeToggle";
import { createAccountStyles } from "../styles/accountStyles";

/**
 * Logged-out account tab (clothing) — mirrors the jewelry guest tab:
 * guests see store info, member perks and the appearance toggle, plus
 * sign-in entry points. The full account (orders, wishlist, profile,
 * addresses, security, logout) is never rendered without a session.
 */
const GuestAccountView = () => {
  const theme = useTheme();
  const styles = createAccountStyles(theme);
  const navigate = useNavigate();

  const goAuth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    goTo(navigate, "/auth" as any);
  };

  const perks = [
    { icon: "cube-outline" as const, title: "Track your orders", sub: "Live status from packed to delivered" },
    { icon: "folder-outline" as const, title: "Wishlist sync", sub: "Save pieces across all your devices" },
    { icon: "location-outline" as const, title: "Faster checkout", sub: "Saved addresses and quick reorder" },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.mainWrapper}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Guest hero */}
          <View style={[localStyles.hero, { backgroundColor: theme.secondaryBackground, borderColor: theme.border }]}>
            <View style={[localStyles.avatar, { backgroundColor: theme.primary }]}>
              <AppIcon name="person-circle-outline" size={34} color="#ffffff" />
            </View>
            <Text style={[localStyles.heroTitle, { color: theme.text }]}>
              Welcome to QuickBihar
            </Text>
            <Text style={[localStyles.heroSub, { color: theme.secondaryText }]}>
              Sign in for orders, wishlist and faster checkout.
            </Text>
            <TouchableOpacity
              style={[localStyles.primaryBtn, { backgroundColor: theme.primary }]}
              onPress={goAuth}
              activeOpacity={0.88}
            >
              <Text style={localStyles.primaryBtnText}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[localStyles.ghostBtn, { borderColor: theme.primary }]}
              onPress={goAuth}
              activeOpacity={0.88}
            >
              <Text style={[localStyles.ghostBtnText, { color: theme.primary }]}>
                Create Account
              </Text>
            </TouchableOpacity>
          </View>

          {/* Member perks */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Member Perks</Text>
            {perks.map((perk, index) => (
              <View
                key={perk.title}
                style={[
                  styles.optionRow,
                  index === perks.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <View style={styles.iconContainer}>
                  <AppIcon name={perk.icon} size={22} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionLabel}>{perk.title}</Text>
                  <Text style={[localStyles.perkSub, { color: theme.secondaryText }]}>
                    {perk.sub}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Appearance Section (same as signed-in account) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Appearance</Text>
            <View style={styles.optionRow}>
              <View style={styles.iconContainer}>
                <AppIcon
                  name={theme.isDark ? "moon-outline" : "sunny-outline"}
                  size={22}
                  color={theme.primary}
                />
              </View>
              <Text style={styles.optionLabel}>
                {theme.isDark ? "Dark Mode" : "Light Mode"}
              </Text>
              <ThemeToggle
                value={theme.isDark}
                onToggle={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  theme.toggleMode();
                }}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

export default GuestAccountView;

const localStyles = StyleSheet.create({
  hero: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    marginBottom: 8,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
    textAlign: "center",
  },
  heroSub: {
    fontSize: 13,
    marginTop: 6,
    textAlign: "center",
    lineHeight: 19,
  },
  primaryBtn: {
    marginTop: 16,
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },
  ghostBtn: {
    marginTop: 10,
    width: "100%",
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
  },
  ghostBtnText: {
    fontSize: 14,
    fontWeight: "800",
  },
  perkSub: {
    fontSize: 12,
    marginTop: 2,
  },
});
