import { requestResetRequest } from "@/src/features/common/auth/api/auth.api";
import { useColors } from "@/src/features/Jewelery/hooks/useColors";
import { JEWELERY_MODULE_CONFIG } from "@/src/constants/app.constants";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";


export default function ForgotPasswordScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [focused, setFocused] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleSendReset = async () => {
    setError("");
    const cleaned = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(cleaned)) {
      setError("Please enter your registered email address.");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      await requestResetRequest({ email: cleaned });
      setLoading(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSent(true);
    } catch (err: any) {
      setLoading(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(err?.response?.data?.message || err?.message || "Failed to send reset email.");
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.ivory }]}>
      <View style={[styles.topBar, { paddingTop: topPad + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Feather name="arrow-left" size={22} color={colors.ink} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.brand, { color: colors.gold, fontFamily: "CormorantGaramond_600SemiBold" }]}>
            {JEWELERY_MODULE_CONFIG.brandName}
          </Text>

          <Text style={[styles.headline, { color: colors.ink, fontFamily: "CormorantGaramond_400Regular_Italic" }]}>
            Forgot your{"\n"}password?
          </Text>
          <Text style={[styles.subline, { color: colors.warmGray, fontFamily: "DMSans_300Light" }]}>
            No worries. Enter your registered email and we'll send you a password reset link.
          </Text>

          <View style={[styles.divider, { backgroundColor: colors.midGray }]} />

          {sent ? (
            <View style={[styles.errorBox, { backgroundColor: "#f0fdf4", borderColor: colors.emerald }]}>
              <Feather name="check-circle" size={13} color={colors.emerald} />
              <Text style={[styles.errorText, { color: colors.ink, fontFamily: "DMSans_400Regular" }]}>
                Reset link sent! Check your email inbox (and spam folder) to set a new password.
              </Text>
            </View>
          ) : (
            <>
              {/* Email */}
              <View style={[styles.fieldGroup, { marginTop: 8 }]}>
                <Text style={[styles.fieldLabel, { color: colors.warmGray, fontFamily: "DMSans_400Regular" }]}>
                  REGISTERED EMAIL ADDRESS
                </Text>
                <View style={[styles.inputRow, { borderBottomColor: focused ? colors.gold : colors.midGray }]}>
                  <TextInput
                    style={[styles.input, { color: colors.ink, fontFamily: "DMSans_400Regular" }]}
                    placeholder="Enter your email"
                    placeholderTextColor={colors.warmGray}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    returnKeyType="done"
                    onSubmitEditing={handleSendReset}
                  />
                </View>
              </View>

              {!!error && (
                <View style={[styles.errorBox, { backgroundColor: "#fdf0f0", borderColor: colors.maroon }]}>
                  <Feather name="alert-circle" size={13} color={colors.maroon} />
                  <Text style={[styles.errorText, { color: colors.maroon, fontFamily: "DMSans_400Regular" }]}>
                    {error}
                  </Text>
                </View>
              )}

              <Pressable
                style={({ pressed }) => [
                  styles.primaryBtn,
                  { backgroundColor: pressed ? colors.goldLight : colors.gold, opacity: loading ? 0.7 : 1 },
                ]}
                onPress={handleSendReset}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.ivory} size="small" />
                ) : (
                  <Text style={[styles.primaryBtnText, { color: colors.ivory, fontFamily: "DMSans_500Medium" }]}>
                    Send Reset Link →
                  </Text>
                )}
              </Pressable>
            </>
          )}

          <Pressable onPress={() => router.back()} style={styles.backToSignIn}>
            <Text style={[styles.backText, { color: colors.gold, fontFamily: "DMSans_400Regular" }]}>
              ← Back to Sign In
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: { paddingHorizontal: 20, paddingBottom: 8 },
  scroll: { paddingHorizontal: 28, paddingTop: 16, gap: 0 },
  brand: { fontSize: 14, letterSpacing: 4, marginBottom: 28 },
  headline: { fontSize: 44, lineHeight: 50, marginBottom: 10 },
  subline: { fontSize: 14, lineHeight: 22, marginBottom: 28 },
  divider: { height: 0.5, marginBottom: 24 },
  stepsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  step: { alignItems: "center", gap: 6 },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNum: { fontSize: 12 },
  stepLabel: { fontSize: 9, letterSpacing: 0.3, textAlign: "center" },
  stepLine: { flex: 1, height: 1, marginBottom: 20, marginHorizontal: 6 },
  fieldGroup: { marginBottom: 24, gap: 8 },
  fieldLabel: { fontSize: 9, letterSpacing: 1.8 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1.5,
    paddingBottom: 10,
    gap: 10,
  },
  countryCode: { fontSize: 15 },
  inputSep: { width: 1, height: 16 },
  input: { flex: 1, fontSize: 15, padding: 0 },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderWidth: 1,
    borderRadius: 4,
    marginBottom: 16,
  },
  errorText: { fontSize: 12, flex: 1, lineHeight: 18 },
  primaryBtn: { paddingVertical: 16, borderRadius: 2, alignItems: "center", marginBottom: 20 },
  primaryBtnText: { fontSize: 13, letterSpacing: 1.5 },
  backToSignIn: { alignItems: "center", paddingVertical: 8 },
  backText: { fontSize: 12, letterSpacing: 0.3 },
});
