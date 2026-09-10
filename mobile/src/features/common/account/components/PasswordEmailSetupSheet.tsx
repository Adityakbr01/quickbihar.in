import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, LinearTransition } from "react-native-reanimated";

import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { useAuthStore } from "@/src/features/common/auth/store/authStore";
import axiosInstance from "@/src/api/axiosInstance";
import { Sheet, SheetHeader, useSheet } from "@/src/components/common/BottomSheet";
import { useAccountStore } from "../store/accountStore";

/**
 * Bottom sheet version of the "Password & Email Setup" form.
 *
 * Opened from the account screen via `useAccountStore().setPasswordSheetVisible(true)`.
 * Mounted once at the top level of the account screen so the sheet's
 * ref is stable across open/close cycles.
 *
 * Design notes (per UX review):
 *  • No field-card backgrounds — keep the sheet airy and minimal.
 *  • Inputs use the theme's `secondaryBackground` so they read as a
 *    subtle surface in BOTH light and dark mode (no hard-coded white).
 *  • The close button is intentionally omitted from the header — users
 *    can still dismiss via drag, the native grabber, or system back.
 *  • The primary CTA uses WHITE text on the brand primary colour. The
 *    brand primary is a bright lime-green; dark text on it fails
 *    contrast and looks like an inverted button.
 *  • The email field is pre-filled with the logged-in account's email and is
 *    READ-ONLY — only the password is editable here. The single exception is
 *    legacy OTP accounts carrying a synthetic `<phone>@quickbihar.local`
 *    email (or no email at all): they must type a real address once, so the
 *    field stays editable until a real email is saved.
 */
const PasswordEmailSetupSheet = () => {
  const theme = useTheme() as any;
  const { user, token, refreshToken, setAuth } = useAuthStore();
  const isVisible = useAccountStore((state) => state.isPasswordSheetVisible);
  const setVisible = useAccountStore((state) => state.setPasswordSheetVisible);
  const sheet = useSheet();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const confirmRef = useRef<any>(null);

  // Reset fields whenever the sheet is (re-)opened so a previous half-filled
  // form never leaks into the next open — but pre-fill the logged-in
  // account's email (still editable). Synthetic legacy-OTP emails
  // (`<phone>@quickbihar.local`) are skipped so the user types a real one.
  useEffect(() => {
    if (isVisible) {
      const current = typeof user?.email === "string" ? user.email.trim() : "";
      const isSynthetic = /^\d{10}@quickbihar\.local$/i.test(current);
      setEmail(isSynthetic ? "" : current);
      setPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      setShowConfirm(false);
      setError("");
      setSuccess(false);
    }
  }, [isVisible, user?.email]);

  // Imperative present/dismiss driven by the store flag.
  useEffect(() => {
    if (isVisible) {
      sheet.current?.present();
    } else {
      sheet.current?.dismiss();
    }
  }, [isVisible, sheet]);

  const validate = () => {
    if (!email.trim() || !email.includes("@")) {
      setError(
        "Please add your email address (e.g. name@example.com) for password login.",
      );
      return false;
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
  const strengthColor = [
    "",
    "#ef4444",
    "#f97316",
    "#eab308",
    "#22c55e",
    "#10b981",
  ];

  const handleSubmit = async () => {
    setError("");
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);

    try {
      const payload: any = { password, email: email.trim() };

      const response = await axiosInstance.patch("/users/profile", payload);
      setLoading(false);

      if (response?.data?.statusCode === 200 || response?.status === 200) {
        if (response.data?.data) {
          await setAuth(response.data.data, token || "", refreshToken || "");
        }
        setSuccess(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => {
          setVisible(false);
        }, 1500);
      } else {
        setError(response?.data?.message || "Could not update security profile.");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (err: any) {
      setLoading(false);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update security profile.";
      setError(msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const strength = getStrength();

  // Email is locked: users may only set a password here. Exception — legacy
  // OTP accounts with a synthetic `<phone>@quickbihar.local` email (or no
  // email) must enter a real address once, so it stays editable for them.
  const storedEmail = typeof user?.email === "string" ? user.email.trim() : "";
  const hasRealEmail =
    storedEmail !== "" && !/^\d{10}@quickbihar\.local$/i.test(storedEmail);
  const isEmailLocked = hasRealEmail;

  // Theme tokens (re-derived so they're obvious in the JSX below)
  const inputBg = theme.secondaryBackground; // subtle surface, works in both modes
  const inputBorder = theme.border;
  const inputText = theme.text;
  const inputPlaceholder = theme.tertiaryText; // muted so it never competes with real text

  return (
    <Sheet
      ref={sheet}
      detents={["auto", 0.65]}
      backgroundColor={theme.background}
      onDidDismiss={() => {
        if (isVisible) setVisible(false);
      }}
    >
      {/*
        Header WITHOUT a close button — the native grabber + drag-to-dismiss
        is the only way to close. Keeps the chrome minimal.
      */}
      <SheetHeader
        title="Password & Email Setup"
        subtitle="Link your email and set a secure password for password login."
        hideCloseButton
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flexShrink: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {success ? (
            <Animated.View
              entering={FadeInDown}
              style={[
                styles.successCard,
                {
                  backgroundColor: theme.tertiaryBackground,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.successIconCircle}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={48}
                  color="#22c55e"
                />
              </View>
              <Text style={[styles.successTitle, { color: theme.text }]}>
                Security Updated!
              </Text>
              <Text
                style={[styles.successSubtitle, { color: theme.secondaryText }]}
              >
                Your email and password are saved. Closing…
              </Text>
            </Animated.View>
          ) : (
            <>
              {/* Error banner */}
              {error ? (
                <Animated.View
                  entering={FadeInDown}
                  layout={LinearTransition}
                  style={[
                    styles.errorBanner,
                    { backgroundColor: "rgba(239, 68, 68, 0.12)" },
                  ]}
                >
                  <Ionicons name="alert-circle" size={18} color="#fca5a5" />
                  <Text style={styles.errorBannerText}>{error}</Text>
                </Animated.View>
              ) : null}

              {/* ── Field: Email ─────────────────────────────────────── */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: theme.text }]}>
                  Email Address
                </Text>
                <View
                  style={[
                    styles.inputRow,
                    {
                      backgroundColor: inputBg,
                      borderColor: inputBorder,
                      opacity: isEmailLocked ? 0.6 : 1,
                    },
                  ]}
                >
                  <Ionicons
                    name="mail-outline"
                    size={18}
                    color={theme.secondaryText}
                  />
                  <TextInput
                    style={[styles.input, { color: inputText }]}
                    placeholder="Please add your email"
                    placeholderTextColor={inputPlaceholder}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={email}
                    onChangeText={setEmail}
                    returnKeyType="next"
                    onSubmitEditing={() => confirmRef.current?.focus()}
                    editable={!isEmailLocked}
                    selectTextOnFocus={!isEmailLocked}
                  />
                  {isEmailLocked ? (
                    <Ionicons
                      name="lock-closed-outline"
                      size={16}
                      color={theme.secondaryText}
                    />
                  ) : null}
                </View>
                {isEmailLocked ? (
                  <Text
                    style={{
                      color: theme.tertiaryText,
                      fontSize: 12,
                      marginTop: 6,
                    }}
                  >
                    Email is linked to your account and can&apos;t be changed
                    here.
                  </Text>
                ) : null}
              </View>

              {/* ── Field: New Password ──────────────────────────────── */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: theme.text }]}>
                  New Password
                </Text>
                <View
                  style={[
                    styles.inputRow,
                    { backgroundColor: inputBg, borderColor: inputBorder },
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={theme.secondaryText}
                  />
                  <TextInput
                    style={[styles.input, { color: inputText }]}
                    placeholder="At least 6 characters"
                    placeholderTextColor={inputPlaceholder}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    onSubmitEditing={() => confirmRef.current?.focus()}
                    returnKeyType="next"
                  />
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setShowPassword(!showPassword);
                    }}
                    hitSlop={10}
                    style={styles.eyeBtn}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color={theme.secondaryText}
                    />
                  </Pressable>
                </View>

                {password.length > 0 && (
                  <Animated.View
                    entering={FadeInDown}
                    style={{ marginTop: 10 }}
                  >
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
                                  : theme.border,
                            },
                          ]}
                        />
                      ))}
                    </View>
                    <Text
                      style={{
                        color: strengthColor[strength],
                        fontSize: 12,
                        marginTop: 6,
                        fontWeight: "700",
                        letterSpacing: 0.2,
                      }}
                    >
                      {strengthLabel[strength]}
                    </Text>
                  </Animated.View>
                )}
              </View>

              {/* ── Field: Confirm Password ──────────────────────────── */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: theme.text }]}>
                  Confirm Password
                </Text>
                <View
                  style={[
                    styles.inputRow,
                    { backgroundColor: inputBg, borderColor: inputBorder },
                  ]}
                >
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={18}
                    color={theme.secondaryText}
                  />
                  <TextInput
                    ref={confirmRef}
                    style={[styles.input, { color: inputText }]}
                    placeholder="Re-enter password"
                    placeholderTextColor={inputPlaceholder}
                    secureTextEntry={!showConfirm}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    onSubmitEditing={handleSubmit}
                    returnKeyType="done"
                  />
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setShowConfirm(!showConfirm);
                    }}
                    hitSlop={10}
                    style={styles.eyeBtn}
                  >
                    <Ionicons
                      name={showConfirm ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color={theme.secondaryText}
                    />
                  </Pressable>
                </View>
              </View>

              {/* Primary CTA — WHITE text on brand primary */}
              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  {
                    backgroundColor: theme.primary,
                    opacity: loading ? 0.7 : 1,
                  },
                ]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="shield-checkmark" size={18} color="#fff" />
                    <Text style={styles.primaryBtnText}>
                      Save Password &amp; Email
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Sheet>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 32,
  },

  // Error banner — uses rgba so it works in light + dark mode alike
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.4)",
    marginBottom: 14,
    gap: 8,
  },
  errorBannerText: {
    color: "#fca5a5",
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
    lineHeight: 18,
  },

  // Field group — no card bg, just spacing
  field: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
    marginBottom: 8,
  },

  // Input row — icon + TextInput + (optional) eye button
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    paddingVertical: 0,
  },
  eyeBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  // Strength meter
  strengthTrack: {
    flexDirection: "row",
    height: 4,
    gap: 6,
  },
  strengthSegment: {
    flex: 1,
    borderRadius: 2,
  },

  // Primary CTA — white text on theme primary
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 4,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  primaryBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.4,
  },

  // Success card
  successCard: {
    padding: 28,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    marginTop: 8,
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(34, 197, 94, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginTop: 16,
    textAlign: "center",
  },
  successSubtitle: {
    fontSize: 13,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 18,
  },
});

export default PasswordEmailSetupSheet;
