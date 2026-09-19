import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, LinearTransition } from "react-native-reanimated";

import LivingPixelOcean from "@/src/components/LivingPixelOcean";
import { TextInput } from "@/src/theme/components/TextInput";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { useSetPassword } from "@/src/features/common/auth/hooks/useAuth";

/**
 * In-account password setter.
 *
 * Reached from Account → Security → "Set a password". Lets a user
 * who only has a Google identity (or has changed their password) add
 * or replace the password identity on their account.
 */
export default function SetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme() as any;

  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirmRef = useRef<any>(null);
  const newRef = useRef<any>(null);

  const { mutate: setPasswordRequest, isPending } = useSetPassword();

  const getStrength = () => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };
  const strength = getStrength();
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong", "Very Strong"];
  const strengthColor = [
    "",
    "#ef4444",
    "#f97316",
    "#eab308",
    "#22c55e",
    "#10b981",
  ];

  const handleSubmit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const payload: { password: string; currentPassword?: string } = {
      password,
    };
    // If the user already has a password, the server requires the
    // current one. Leave the field empty if they're setting it for
    // the first time.
    if (currentPassword.trim().length > 0) {
      payload.currentPassword = currentPassword.trim();
    }

    setPasswordRequest(payload, {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (router.canGoBack()) router.back();
        else router.replace("/account/profile-info" as any);
      },
      onError: (err: any) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Could not update your password."
        );
      },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.oceanContainer} pointerEvents="none">
        <LivingPixelOcean />
        <LinearGradient
          colors={["transparent", theme.background]}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        enabled={Platform.OS !== "web"}
      >
        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 40,
            paddingHorizontal: 20,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (router.canGoBack()) router.back();
              else router.replace("/account/profile-info" as any);
            }}
          >
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </TouchableOpacity>

          <View style={{ marginTop: 20, marginBottom: 24 }}>
            <Text style={[styles.title, { color: theme.text }]}>
              Set a Password
            </Text>
            <Text
              style={[
                styles.subtitle,
                { color: theme.secondaryText, marginTop: 6 },
              ]}
            >
              Add a password so you can sign in with your email and password
              in addition to Google.
            </Text>
          </View>

          {error ? (
            <Animated.View
              entering={FadeInDown}
              layout={LinearTransition}
              style={styles.errorBanner}
            >
              <Ionicons name="warning-outline" size={20} color="#fca5a5" />
              <Text style={styles.errorBannerText}>{error}</Text>
            </Animated.View>
          ) : null}

          <View
            style={[
              styles.glassCard,
              {
                backgroundColor:
                  theme.cardBackground || "rgba(255,255,255,0.06)",
              },
            ]}
          >
            <View style={{ marginBottom: 16 }}>
              <TextInput
                label="Current Password (if you have one)"
                variant="glass"
                placeholder="Leave empty if first time"
                secureTextEntry={!showPassword}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                onSubmitEditing={() => newRef.current?.focus()}
                icon={
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={theme.secondaryText}
                  />
                }
              />
            </View>

            <View style={{ marginBottom: 16 }}>
              <TextInput
                ref={newRef}
                label="New Password"
                variant="glass"
                placeholder="At least 8 characters"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                onSubmitEditing={() => confirmRef.current?.focus()}
                icon={
                  <Ionicons
                    name="key-outline"
                    size={20}
                    color={theme.secondaryText}
                  />
                }
                rightIcon={
                  <Pressable onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color={theme.secondaryText}
                    />
                  </Pressable>
                }
              />
            </View>

            {password.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <View style={styles.strengthTrack}>
                  {[1, 2, 3, 4, 5].map((idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.strengthSegment,
                        {
                          backgroundColor:
                            idx <= strength
                              ? strengthColor[strength]
                              : "rgba(255,255,255,0.1)",
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text
                  style={{
                    color: strengthColor[strength],
                    fontSize: 12,
                    marginTop: 4,
                    fontWeight: "600",
                  }}
                >
                  {strengthLabel[strength]}
                </Text>
              </View>
            )}

            <View style={{ marginBottom: 24 }}>
              <TextInput
                ref={confirmRef}
                label="Confirm New Password"
                variant="glass"
                placeholder="Re-enter new password"
                secureTextEntry={!showPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onSubmitEditing={handleSubmit}
                icon={
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={20}
                    color={theme.secondaryText}
                  />
                }
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
              onPress={handleSubmit}
              disabled={isPending}
              activeOpacity={0.85}
            >
              {isPending ? (
                <ActivityIndicator color="#0f172a" size="small" />
              ) : (
                <Text style={styles.primaryBtnText}>Update Password</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  oceanContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "35%",
    overflow: "hidden",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: { fontSize: 24, fontWeight: "700" },
  subtitle: { fontSize: 14, lineHeight: 20 },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.5)",
    marginBottom: 16,
    gap: 10,
  },
  errorBannerText: { color: "#fca5a5", fontSize: 14, fontWeight: "500", flex: 1 },
  glassCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  strengthTrack: { flexDirection: "row", height: 4, gap: 6 },
  strengthSegment: { flex: 1, borderRadius: 2 },
  primaryBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: "#0f172a", fontSize: 15, fontWeight: "700" },
});
