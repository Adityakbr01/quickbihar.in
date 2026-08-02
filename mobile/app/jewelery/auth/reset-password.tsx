import { Feather } from "@expo/vector-icons";
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
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/src/features/Jewelery/context/AuthContext";
import { useColors } from "@/src/features/Jewelery/hooks/useColors";

export default function ResetPasswordScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signUp, resetPassword } = useAuth();

  const params = useLocalSearchParams<{
    phone: string;
    flow: "signup" | "forgot";
    name?: string;
    email?: string;
  }>();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const confirmRef = useRef<TextInput>(null);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const validate = () => {
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
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
    "#c0392b",
    "#e67e22",
    "#f1c40f",
    "#27ae60",
    "#1e8449",
  ];

  const handleSubmit = async () => {
    setError("");
    if (!validate()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);

    if (params.flow === "signup") {
      const targetEmail = params.email || params.phone;
      const result = await signUp(
        params.name ?? "",
        targetEmail,
        password,
      );
      setLoading(false);
      if (result.success) {
        setSuccess(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => router.replace("/jewelery/(tabs)/profile" as any), 1800);
      } else {
        setError(result.error ?? "Registration failed.");
      }
    } else {
      const ok = await resetPassword(params.phone, password);
      setLoading(false);
      if (ok) {
        setSuccess(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => router.replace("/jewelery/auth/sign-in" as any), 1800);
      } else {
        setError("Could not reset password. Account not found.");
      }
    }
  };

  const strength = getStrength();

  if (success) {
    return (
      <View
        style={[
          styles.root,
          {
            backgroundColor: colors.ivory,
            alignItems: "center",
            justifyContent: "center",
          },
        ]}
      >
        <View
          style={[styles.successCircle, { backgroundColor: colors.emerald }]}
        >
          <Feather name="check" size={36} color={colors.gold} />
        </View>
        <Text
          style={[
            styles.successTitle,
            {
              color: colors.ink,
              fontFamily: "CormorantGaramond_400Regular_Italic",
            },
          ]}
        >
          {params.flow === "signup"
            ? "Welcome to Aabhushan."
            : "Password reset."}
        </Text>
        <Text
          style={[
            styles.successSub,
            { color: colors.warmGray, fontFamily: "DMSans_300Light" },
          ]}
        >
          {params.flow === "signup"
            ? "Your account is ready. Explore the collection."
            : "You can now sign in with your new password."}
        </Text>
      </View>
    );
  }

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
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: bottomPad + 40 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text
            style={[
              styles.brand,
              {
                color: colors.gold,
                fontFamily: "CormorantGaramond_600SemiBold",
              },
            ]}
          >
            AABHUSHAN
          </Text>

          <Text
            style={[
              styles.headline,
              {
                color: colors.ink,
                fontFamily: "CormorantGaramond_400Regular_Italic",
              },
            ]}
          >
            {params.flow === "signup"
              ? "Set your\npassword."
              : "New\npassword."}
          </Text>
          <Text
            style={[
              styles.subline,
              { color: colors.warmGray, fontFamily: "DMSans_300Light" },
            ]}
          >
            {params.flow === "signup"
              ? "Choose a secure password for your Aabhushan account."
              : "Create a new password for your account."}
          </Text>

          <View style={[styles.divider, { backgroundColor: colors.midGray }]} />

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text
              style={[
                styles.fieldLabel,
                { color: colors.warmGray, fontFamily: "DMSans_400Regular" },
              ]}
            >
              {params.flow === "signup" ? "CREATE PASSWORD" : "NEW PASSWORD"}
            </Text>
            <View
              style={[
                styles.inputRow,
                {
                  borderBottomColor:
                    focusedField === "pw" ? colors.gold : colors.midGray,
                },
              ]}
            >
              <TextInput
                style={[
                  styles.input,
                  { color: colors.ink, fontFamily: "DMSans_400Regular" },
                ]}
                placeholder="Min. 6 characters"
                placeholderTextColor={colors.warmGray}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedField("pw")}
                onBlur={() => setFocusedField(null)}
                returnKeyType="next"
                onSubmitEditing={() => confirmRef.current?.focus()}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={8}
              >
                <Feather
                  name={showPassword ? "eye-off" : "eye"}
                  size={16}
                  color={colors.warmGray}
                />
              </Pressable>
            </View>

            {/* Strength bar */}
            {password.length > 0 && (
              <View style={styles.strengthRow}>
                <View style={styles.strengthBars}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <View
                      key={i}
                      style={[
                        styles.strengthBar,
                        {
                          backgroundColor:
                            i <= strength
                              ? strengthColor[strength]
                              : colors.midGray,
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text
                  style={[
                    styles.strengthLabel,
                    {
                      color: strengthColor[strength],
                      fontFamily: "DMSans_400Regular",
                    },
                  ]}
                >
                  {strengthLabel[strength]}
                </Text>
              </View>
            )}
          </View>

          {/* Confirm */}
          <View style={styles.fieldGroup}>
            <Text
              style={[
                styles.fieldLabel,
                { color: colors.warmGray, fontFamily: "DMSans_400Regular" },
              ]}
            >
              CONFIRM PASSWORD
            </Text>
            <View
              style={[
                styles.inputRow,
                {
                  borderBottomColor:
                    focusedField === "confirm" ? colors.gold : colors.midGray,
                },
              ]}
            >
              <TextInput
                ref={confirmRef}
                style={[
                  styles.input,
                  { color: colors.ink, fontFamily: "DMSans_400Regular" },
                ]}
                placeholder="Re-enter password"
                placeholderTextColor={colors.warmGray}
                secureTextEntry={!showConfirm}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onFocus={() => setFocusedField("confirm")}
                onBlur={() => setFocusedField(null)}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />
              <Pressable
                onPress={() => setShowConfirm(!showConfirm)}
                hitSlop={8}
              >
                <Feather
                  name={showConfirm ? "eye-off" : "eye"}
                  size={16}
                  color={colors.warmGray}
                />
              </Pressable>
              {confirmPassword.length > 0 && (
                <Feather
                  name={
                    password === confirmPassword ? "check-circle" : "x-circle"
                  }
                  size={16}
                  color={
                    password === confirmPassword ? "#27ae60" : colors.maroon
                  }
                  style={{ marginLeft: 6 }}
                />
              )}
            </View>
          </View>

          {!!error && (
            <View
              style={[
                styles.errorBox,
                { backgroundColor: "#fdf0f0", borderColor: colors.maroon },
              ]}
            >
              <Feather name="alert-circle" size={13} color={colors.maroon} />
              <Text
                style={[
                  styles.errorText,
                  { color: colors.maroon, fontFamily: "DMSans_400Regular" },
                ]}
              >
                {error}
              </Text>
            </View>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.primaryBtn,
              {
                backgroundColor: pressed ? colors.goldLight : colors.gold,
                opacity: loading ? 0.7 : 1,
              },
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.ivory} size="small" />
            ) : (
              <Text
                style={[
                  styles.primaryBtnText,
                  { color: colors.ivory, fontFamily: "DMSans_500Medium" },
                ]}
              >
                {params.flow === "signup" ? "Create Account" : "Reset Password"}
              </Text>
            )}
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
  divider: { height: 0.5, marginBottom: 32 },
  fieldGroup: { marginBottom: 24, gap: 8 },
  fieldLabel: { fontSize: 9, letterSpacing: 1.8 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1.5,
    paddingBottom: 10,
    gap: 10,
  },
  input: { flex: 1, fontSize: 15, padding: 0 },
  strengthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  strengthBars: { flexDirection: "row", gap: 4, flex: 1 },
  strengthBar: { flex: 1, height: 3, borderRadius: 2 },
  strengthLabel: { fontSize: 10, letterSpacing: 0.3 },
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
  primaryBtn: { paddingVertical: 16, borderRadius: 2, alignItems: "center" },
  primaryBtnText: { fontSize: 13, letterSpacing: 2 },
  successCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  successTitle: {
    fontSize: 32,
    lineHeight: 40,
    textAlign: "center",
    marginBottom: 12,
  },
  successSub: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 260,
  },
});
