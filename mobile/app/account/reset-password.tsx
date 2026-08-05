import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
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
import axiosInstance from "@/src/api/axiosInstance";

export default function ClothingResetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme() as any;
  const { user, token, refreshToken, setAuth } = useAuthStore();

  const params = useLocalSearchParams<{
    phone?: string;
    flow?: "signup" | "forgot";
    name?: string;
    email?: string;
  }>();

  const [fullName, setFullName] = useState(params.name || user?.fullName || "");
  const [email, setEmail] = useState(params.email || user?.email || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const confirmRef = useRef<any>(null);

  const validate = () => {
    if (params.flow === "signup") {
      if (!fullName.trim()) {
        setError("Please enter your full name.");
        return false;
      }
      if (!email.trim() || !email.includes("@")) {
        setError("Please enter a valid email address (e.g. name@example.com) for password login.");
        return false;
      }
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }
    return true;
  };

  const getStrength = () => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong", "Very Strong"];
  const strengthColor = ["", "#ef4444", "#f97316", "#eab308", "#22c55e", "#10b981"];

  const handleSubmit = async () => {
    setError("");
    if (!validate()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);

    try {
      const payload: any = { password };
      if (email.trim()) payload.email = email.trim();
      if (fullName.trim()) payload.fullName = fullName.trim();

      const response = await axiosInstance.patch("/users/profile", payload);
      setLoading(false);

      if (response?.data?.statusCode === 200 || response?.status === 200) {
        if (response.data?.data) {
          await setAuth(response.data.data, token || "", refreshToken || "");
        }
        setSuccess(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace("/account/profile-info" as any);
          }
        }, 1800);
      } else {
        setError(response?.data?.message || "Could not update security profile.");
      }
    } catch (err: any) {
      setLoading(false);
      const msg = err?.response?.data?.message || err?.message || "Failed to update security profile.";
      setError(msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const strength = getStrength();

  if (success) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: theme.background, justifyContent: "center", alignItems: "center" },
        ]}
      >
        <View style={styles.successCard}>
          <View style={styles.successIconCircle}>
            <Ionicons name="checkmark-circle-outline" size={54} color="#22c55e" />
          </View>
          <Text style={[styles.title, { color: theme.text, textAlign: "center", marginTop: 16 }]}>
            {params.flow === "signup" ? "Registration Complete!" : "Security Updated!"}
          </Text>
          <Text style={[styles.subtitle, { color: theme.secondaryText, textAlign: "center", marginTop: 8 }]}>
            Your email and password have been successfully configured. Returning to your profile...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Background Ocean */}
      <View style={styles.oceanContainer} pointerEvents="none">
        <LivingPixelOcean />
        <LinearGradient colors={["transparent", theme.background]} style={StyleSheet.absoluteFill} />
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
          {/* Header Bar */}
          {params.flow !== "signup" && (
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
          )}

          <View style={{ marginTop: 20, marginBottom: 24 }}>
            <Text style={[styles.title, { color: theme.text }]}>
              {params.flow === "signup" ? "Complete Your Profile" : "Password & Email Setup"}
            </Text>
            <Text style={[styles.subtitle, { color: theme.secondaryText, marginTop: 6 }]}>
              {params.flow === "signup"
                ? "Enter your name, email address, and set a secure password for your account."
                : "Update your password or link your email address for password login."}
            </Text>
          </View>

          {/* Error Banner */}
          {error ? (
            <Animated.View entering={FadeInDown} layout={LinearTransition} style={styles.errorBanner}>
              <Ionicons name="warning-outline" size={20} color="#fca5a5" />
              <Text style={styles.errorBannerText}>{error}</Text>
            </Animated.View>
          ) : null}

          {/* Card Form */}
          <View style={[styles.glassCard, { backgroundColor: theme.cardBackground || "rgba(255,255,255,0.06)" }]}>
            {params.flow === "signup" && (
              <View style={{ marginBottom: 16 }}>
                <TextInput
                  label="Full Name"
                  variant="glass"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChangeText={setFullName}
                  icon={<Ionicons name="person-outline" size={20} color={theme.secondaryText} />}
                />
              </View>
            )}

            <View style={{ marginBottom: 16 }}>
              <TextInput
                label="Email Address (for password login)"
                variant="glass"
                placeholder="name@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                icon={<Ionicons name="mail-outline" size={20} color={theme.secondaryText} />}
              />
            </View>

            <View style={{ marginBottom: 16 }}>
              <TextInput
                label="New Password"
                variant="glass"
                placeholder="At least 6 characters"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                onSubmitEditing={() => confirmRef.current?.focus()}
                icon={<Ionicons name="lock-closed-outline" size={20} color={theme.secondaryText} />}
                rightIcon={
                  <Pressable onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={theme.secondaryText} />
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
                            idx <= strength ? strengthColor[strength] : "rgba(255,255,255,0.1)",
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text style={{ color: strengthColor[strength], fontSize: 12, marginTop: 4, fontWeight: "600" }}>
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
                icon={<Ionicons name="shield-checkmark-outline" size={20} color={theme.secondaryText} />}
                rightIcon={
                  <Pressable onPress={() => setShowConfirm(!showConfirm)}>
                    <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={20} color={theme.secondaryText} />
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
                <Text style={styles.primaryBtnText}>
                  {params.flow === "signup" ? "Complete Registration" : "Save Password & Email"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
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
  errorBannerText: {
    color: "#fca5a5",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  glassCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  strengthTrack: {
    flexDirection: "row",
    height: 4,
    gap: 6,
  },
  strengthSegment: {
    flex: 1,
    borderRadius: 2,
  },
  primaryBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    color: "#0f172a",
    fontSize: 15,
    fontWeight: "700",
  },
  successCard: {
    padding: 28,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    maxWidth: "85%",
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(34, 197, 94, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
});
