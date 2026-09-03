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
import { useAuthStore } from "@/src/features/common/auth/store/authStore";
import {
  useSetPassword,
  useUpdateProfile,
} from "@/src/features/common/auth/hooks/useAuth";
import { getRoleLandingRoute } from "@/src/features/common/auth/store/authStore";

/**
 * Forced email-capture screen for legacy OTP users.
 *
 * After the OTP cutover, every user whose record still carries
 * `legacyOtpOnly === true` lands here the next time they
 * successfully authenticate. They must supply a real email and a
 * password so they can sign in without an OTP code going forward.
 *
 * We do two things on submit:
 *   1. PATCH /users/profile  → swap the synthetic email for the
 *      user's real one, persist fullName.
 *   2. POST /auth/set-password → add a "password" identity so they
 *      can sign in with email + password.
 *
 * On success, the user is bounced to their role's home and the
 * server clears `legacyOtpOnly` so this screen never shows again.
 */
export default function LegacyEmailCaptureScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme() as any;
  const user = useAuthStore((s) => s.user);

  const [fullName, setFullName] = useState(user?.fullName || "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmRef = useRef<any>(null);
  const { mutate: updateProfile, isPending: profilePending } = useUpdateProfile();
  const { mutate: setPasswordMutate, isPending: passwordPending } = useSetPassword();

  const loading = profilePending || passwordPending;

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

    if (fullName.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }
    const emailClean = email.trim();
    if (!emailClean || !emailClean.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // Step 1: update the profile (name + real email).
    updateProfile(
      { fullName: fullName.trim(), email: emailClean },
      {
        onSuccess: () => {
          // Step 2: attach a password identity.
          setPasswordMutate(
            { password },
            {
              onSuccess: () => {
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success
                );
                // Refresh user from the latest store snapshot so
                // legacyOtpOnly === false routes them to the home.
                const fresh = useAuthStore.getState().user;
                router.replace(getRoleLandingRoute(fresh?.role));
              },
              onError: (err: any) => {
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Error
                );
                setError(
                  err?.response?.data?.message ||
                    err?.message ||
                    "Could not set your password. Please try again."
                );
              },
            }
          );
        },
        onError: (err: any) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setError(
            err?.response?.data?.message ||
              err?.message ||
              "Could not save your email. It may already be in use."
          );
        },
      }
    );
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
          <View style={{ marginTop: 10, marginBottom: 20 }}>
            <Text style={[styles.title, { color: theme.text }]}>
              One quick step
            </Text>
            <Text
              style={[
                styles.subtitle,
                { color: theme.secondaryText, marginTop: 6 },
              ]}
            >
              To keep your account secure, add a real email and a password
              you'll remember. We'll use this instead of one-time codes from
              now on.
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
                label="Full Name"
                variant="glass"
                placeholder="Your name"
                autoCapitalize="words"
                value={fullName}
                onChangeText={setFullName}
                editable={!loading}
                icon={
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={theme.secondaryText}
                  />
                }
              />
            </View>

            <View style={{ marginBottom: 16 }}>
              <TextInput
                label="Email Address"
                variant="glass"
                placeholder="name@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                value={email}
                onChangeText={setEmail}
                editable={!loading}
                onSubmitEditing={() => confirmRef.current?.focus()}
                icon={
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={theme.secondaryText}
                  />
                }
              />
            </View>

            <View style={{ marginBottom: 16 }}>
              <TextInput
                label="New Password"
                variant="glass"
                placeholder="At least 8 characters"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                onSubmitEditing={() => confirmRef.current?.focus()}
                icon={
                  <Ionicons
                    name="lock-closed-outline"
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
                label="Confirm Password"
                variant="glass"
                placeholder="Re-enter password"
                secureTextEntry={!showConfirm}
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
                rightIcon={
                  <Pressable onPress={() => setShowConfirm(!showConfirm)}>
                    <Ionicons
                      name={showConfirm ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color={theme.secondaryText}
                    />
                  </Pressable>
                }
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#0f172a" size="small" />
              ) : (
                <Text style={styles.primaryBtnText}>Save and Continue</Text>
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
