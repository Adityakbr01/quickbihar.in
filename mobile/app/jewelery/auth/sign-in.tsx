import { Feather } from "@expo/vector-icons";
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
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/src/features/Jewelery/context/AuthContext";
import { useColors } from "@/src/features/Jewelery/hooks/useColors";
import { JEWELERY_MODULE_CONFIG } from "@/src/constants/app.constants";
export default function SignInScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signIn, sendOtp } = useAuth();

  const [authTab, setAuthTab] = useState<"otp" | "password">("otp");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const passwordRef = useRef<TextInput>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleSendOtp = async () => {
    setError("");
    const cleanedPhone = phone.trim();
    if (cleanedPhone.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    const result = await sendOtp(cleanedPhone);
    setLoading(false);

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push({
        pathname: "/jewelery/auth/otp" as any,
        params: { target: cleanedPhone, phone: cleanedPhone, flow: "login" },
      });
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(result.error ?? "Failed to send OTP.");
    }
  };

  const handlePasswordSignIn = async () => {
    setError("");
    const identifier = email.trim();
    if (!identifier) {
      setError("Please enter your email address.");
      return;
    }
    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    const result = await signIn(identifier, password);
    setLoading(false);

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/jewelery/(tabs)/profile" as any);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(result.error ?? "Sign in failed.");
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.ivory }]}>
      {/* Header */}
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
          {/* Brand mark */}
          <Text style={[styles.brand, { color: colors.gold, fontFamily: "CormorantGaramond_600SemiBold" }]}>
            {JEWELERY_MODULE_CONFIG.brandName}
          </Text>

          <Text style={[styles.headline, { color: colors.ink, fontFamily: "CormorantGaramond_400Regular_Italic" }]}>
            Welcome back.
          </Text>
          <Text style={[styles.subline, { color: colors.warmGray, fontFamily: "DMSans_300Light" }]}>
            Sign in to access your wishlist, orders and exclusive drops.
          </Text>

          {/* Mode Switcher Tabs */}
          <View style={[styles.tabBar, { borderColor: colors.midGray, backgroundColor: colors.pearl }]}>
            <Pressable
              style={[
                styles.tabItem,
                authTab === "otp" && { backgroundColor: colors.gold },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setAuthTab("otp");
                setError("");
              }}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: authTab === "otp" ? colors.ivory : colors.warmGray, fontFamily: "DMSans_500Medium" },
                ]}
              >
                Mobile OTP
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.tabItem,
                authTab === "password" && { backgroundColor: colors.gold },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setAuthTab("password");
                setError("");
              }}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: authTab === "password" ? colors.ivory : colors.warmGray, fontFamily: "DMSans_500Medium" },
                ]}
              >
                Email & Password
              </Text>
            </Pressable>
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.midGray }]} />

          {/* Tab 1: Phone OTP */}
          {authTab === "otp" ? (
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.warmGray, fontFamily: "DMSans_400Regular" }]}>
                MOBILE NUMBER
              </Text>
              <View style={[
                styles.inputRow,
                { borderBottomColor: focusedField === "phone" ? colors.gold : colors.midGray },
              ]}>
                <Text style={[styles.countryCode, { color: colors.ink, fontFamily: "DMSans_400Regular" }]}>+91</Text>
                <View style={[styles.inputSep, { backgroundColor: colors.midGray }]} />
                <TextInput
                  style={[styles.input, { color: colors.ink, fontFamily: "DMSans_400Regular" }]}
                  placeholder="Enter 10-digit mobile number"
                  placeholderTextColor={colors.warmGray}
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  onFocus={() => setFocusedField("phone")}
                  onBlur={() => setFocusedField(null)}
                  returnKeyType="done"
                  onSubmitEditing={handleSendOtp}
                  maxLength={10}
                />
              </View>
            </View>
          ) : (
            /* Tab 2: Email & Password */
            <>
              {/* Email */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.warmGray, fontFamily: "DMSans_400Regular" }]}>
                  EMAIL ADDRESS
                </Text>
                <View style={[
                  styles.inputRow,
                  { borderBottomColor: focusedField === "email" ? colors.gold : colors.midGray },
                ]}>
                  <TextInput
                    style={[styles.input, { color: colors.ink, fontFamily: "DMSans_400Regular", flex: 1 }]}
                    placeholder="Enter your email"
                    placeholderTextColor={colors.warmGray}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.warmGray, fontFamily: "DMSans_400Regular" }]}>
                  PASSWORD
                </Text>
                <View style={[
                  styles.inputRow,
                  { borderBottomColor: focusedField === "password" ? colors.gold : colors.midGray },
                ]}>
                  <TextInput
                    ref={passwordRef}
                    style={[styles.input, { color: colors.ink, fontFamily: "DMSans_400Regular", flex: 1 }]}
                    placeholder="Enter your password"
                    placeholderTextColor={colors.warmGray}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    returnKeyType="done"
                    onSubmitEditing={handlePasswordSignIn}
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                    <Feather name={showPassword ? "eye-off" : "eye"} size={16} color={colors.warmGray} />
                  </Pressable>
                </View>
              </View>

              {/* Forgot password */}
              <Pressable
                style={styles.forgotRow}
                onPress={() => router.push("/jewelery/auth/forgot-password" as any)}
              >
                <Text style={[styles.forgotText, { color: colors.gold, fontFamily: "DMSans_400Regular" }]}>
                  Forgot password?
                </Text>
              </Pressable>
            </>
          )}

          {/* Error Banner */}
          {!!error && (
            <View style={[styles.errorBox, { backgroundColor: "#fdf0f0", borderColor: colors.maroon }]}>
              <Feather name="alert-circle" size={13} color={colors.maroon} />
              <Text style={[styles.errorText, { color: colors.maroon, fontFamily: "DMSans_400Regular" }]}>
                {error}
              </Text>
            </View>
          )}

          {/* Primary Action Button */}
          <Pressable
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: pressed ? colors.goldLight : colors.gold, opacity: loading ? 0.7 : 1 },
            ]}
            onPress={authTab === "otp" ? handleSendOtp : handlePasswordSignIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.ivory} size="small" />
            ) : (
              <Text style={[styles.primaryBtnText, { color: colors.ivory, fontFamily: "DMSans_500Medium" }]}>
                {authTab === "otp" ? "Get OTP →" : "Sign In"}
              </Text>
            )}
          </Pressable>

          {/* Divider with OR */}
          <View style={styles.orRow}>
            <View style={[styles.orLine, { backgroundColor: colors.midGray }]} />
            <Text style={[styles.orText, { color: colors.warmGray, fontFamily: "DMSans_400Regular" }]}>or</Text>
            <View style={[styles.orLine, { backgroundColor: colors.midGray }]} />
          </View>

          {/* Sign up link */}
          <Pressable
            style={({ pressed }) => [
              styles.secondaryBtn,
              { borderColor: colors.gold, backgroundColor: pressed ? colors.champagne : "transparent" },
            ]}
            onPress={() => router.replace("/jewelery/auth/sign-up" as any)}
          >
            <Text style={[styles.secondaryBtnText, { color: colors.gold, fontFamily: "DMSans_400Regular" }]}>
              Create an account →
            </Text>
          </Pressable>

          <Text style={[styles.finePrint, { color: colors.warmGray, fontFamily: "DMSans_300Light" }]}>
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  scroll: {
    paddingHorizontal: 28,
    paddingTop: 16,
    gap: 0,
  },
  brand: {
    fontSize: 14,
    letterSpacing: 4,
    marginBottom: 28,
  },
  headline: {
    fontSize: 44,
    lineHeight: 50,
    marginBottom: 10,
  },
  subline: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 28,
  },
  tabBar: {
    flexDirection: "row",
    borderRadius: 8,
    borderWidth: 1,
    padding: 3,
    marginBottom: 20,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  tabText: {
    fontSize: 12,
    letterSpacing: 0.5,
  },
  divider: {
    height: 0.5,
    marginBottom: 24,
  },
  fieldGroup: {
    marginBottom: 24,
    gap: 8,
  },
  fieldLabel: {
    fontSize: 9,
    letterSpacing: 1.8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1.5,
    paddingBottom: 10,
    gap: 10,
  },
  countryCode: {
    fontSize: 15,
  },
  inputSep: {
    width: 1,
    height: 16,
  },
  input: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  forgotRow: {
    alignSelf: "flex-end",
    marginBottom: 28,
    marginTop: -8,
  },
  forgotText: {
    fontSize: 12,
    letterSpacing: 0.3,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderWidth: 1,
    borderRadius: 4,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
  primaryBtn: {
    paddingVertical: 16,
    borderRadius: 2,
    alignItems: "center",
    marginBottom: 20,
  },
  primaryBtnText: {
    fontSize: 13,
    letterSpacing: 2,
  },
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  orLine: { flex: 1, height: 0.5 },
  orText: { fontSize: 12 },
  secondaryBtn: {
    paddingVertical: 15,
    borderRadius: 2,
    alignItems: "center",
    borderWidth: 1,
    marginBottom: 28,
  },
  secondaryBtnText: {
    fontSize: 13,
    letterSpacing: 1,
  },
  finePrint: {
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
  },
});
