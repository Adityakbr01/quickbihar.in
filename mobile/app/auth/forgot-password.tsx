import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
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
import { useRequestPasswordReset } from "@/src/features/common/auth/hooks/useAuth";

/**
 * Forgot-password screen.
 *
 * User enters their email; we POST /auth/request-reset. The server
 * ALWAYS returns 200 to avoid email enumeration, so we always show
 * the same success screen ("If the email is on file, we sent a link").
 *
 * The link in the email is a deep link back into the app:
 *   QuickBihar://auth/reset-password?token=...
 * which the deep-link handler routes to reset-password-confirm.tsx.
 */
export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme() as any;
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { mutate: requestReset, isPending } = useRequestPasswordReset();

  const handleSubmit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setError(null);
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    requestReset(
      { email: trimmed },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setSubmitted(true);
        },
        onError: (err: any) => {
          // Even on error, don't reveal whether the email exists.
          // We still show the success state for any non-validation error.
          const msg = err?.message || "";
          if (
            msg.toLowerCase().includes("rate") ||
            msg.toLowerCase().includes("limit")
          ) {
            setError("Too many attempts. Please wait a minute and try again.");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
          }
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setSubmitted(true);
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (router.canGoBack()) router.back();
              else router.replace("/auth" as any);
            }}
          >
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </TouchableOpacity>

          <View style={{ marginTop: 20, marginBottom: 24 }}>
            <Text style={[styles.title, { color: theme.text }]}>
              Forgot Password
            </Text>
            <Text
              style={[styles.subtitle, { color: theme.secondaryText, marginTop: 6 }]}
            >
              Enter the email address on your account. We'll send you a
              one-time link to reset your password.
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
              { backgroundColor: theme.cardBackground || "rgba(255,255,255,0.06)" },
            ]}
          >
            {submitted ? (
              <View style={{ alignItems: "center", paddingVertical: 12 }}>
                <View style={styles.successIcon}>
                  <Ionicons
                    name="mail-unread-outline"
                    size={32}
                    color={theme.primary}
                  />
                </View>
                <Text
                  style={{
                    color: theme.text,
                    fontSize: 16,
                    fontWeight: "700",
                    marginTop: 12,
                    textAlign: "center",
                  }}
                >
                  Check your inbox
                </Text>
                <Text
                  style={{
                    color: theme.secondaryText,
                    fontSize: 13,
                    marginTop: 8,
                    textAlign: "center",
                    lineHeight: 19,
                  }}
                >
                  If {email || "that email"} is on file, we just sent a
                  password-reset link. It expires in 15 minutes.
                </Text>
                <TouchableOpacity
                  style={[styles.primaryBtn, { backgroundColor: theme.primary, marginTop: 20 }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.replace("/auth/login" as any);
                  }}
                >
                  <Text style={styles.primaryBtnText}>Back to Sign In</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <TextInput
                  label="Email Address"
                  variant="glass"
                  placeholder="name@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  value={email}
                  onChangeText={setEmail}
                  editable={!isPending}
                  onSubmitEditing={handleSubmit}
                  icon={
                    <Ionicons
                      name="mail-outline"
                      size={20}
                      color={theme.secondaryText}
                    />
                  }
                />

                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
                    { backgroundColor: theme.primary, marginTop: 20 },
                  ]}
                  onPress={handleSubmit}
                  disabled={isPending}
                  activeOpacity={0.85}
                >
                  {isPending ? (
                    <ActivityIndicator color="#0f172a" size="small" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Send Reset Link</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
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
  primaryBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: "#0f172a", fontSize: 15, fontWeight: "700" },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(34, 197, 94, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
});
