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

export default function SignUpScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signUp, signIn } = useAuth();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const phoneRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const topPad = Platform.OS === "web" ? 16 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleSignUp = async () => {
    setError("");
    if (name.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }
    const cleanedEmail = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(cleanedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    const result = await signUp(name.trim(), cleanedEmail, password);
    if (!result.success) {
      setLoading(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(result.error ?? "Registration failed.");
      return;
    }
    const login = await signIn(cleanedEmail, password);
    setLoading(false);

    if (login.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/jewelery/(tabs)/profile" as any);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/jewelery/auth/sign-in" as any);
    }
  };

  const fieldBorder = (field: string) =>
    focusedField === field ? colors.gold : colors.midGray;

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
            {JEWELERY_MODULE_CONFIG.brandName}
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
            Join the circle.
          </Text>
          <Text
            style={[
              styles.subline,
              { color: colors.warmGray, fontFamily: "DMSans_300Light" },
            ]}
          >
            New collections. Artisan stories. Early access. Only for those who
            truly love jewellery.
          </Text>

          <View style={[styles.divider, { backgroundColor: colors.midGray }]} />

          {/* Name */}
          <View style={styles.fieldGroup}>
            <Text
              style={[
                styles.fieldLabel,
                { color: colors.warmGray, fontFamily: "DMSans_400Regular" },
              ]}
            >
              FULL NAME
            </Text>
            <View
              style={[
                styles.inputRow,
                { borderBottomColor: fieldBorder("name") },
              ]}
            >
              <TextInput
                style={[
                  styles.input,
                  { color: colors.ink, fontFamily: "DMSans_400Regular" },
                ]}
                placeholder="Your name"
                placeholderTextColor={colors.warmGray}
                value={name}
                onChangeText={setName}
                onFocus={() => setFocusedField("name")}
                onBlur={() => setFocusedField(null)}
                returnKeyType="next"
                onSubmitEditing={() => phoneRef.current?.focus()}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Phone (optional) */}
          <View style={styles.fieldGroup}>
            <Text
              style={[
                styles.fieldLabel,
                { color: colors.warmGray, fontFamily: "DMSans_400Regular" },
              ]}
            >
              MOBILE NUMBER{" "}
              <Text style={{ fontSize: 8, letterSpacing: 0 }}>(OPTIONAL)</Text>
            </Text>
            <View
              style={[
                styles.inputRow,
                { borderBottomColor: fieldBorder("phone") },
              ]}
            >
              <Text
                style={[
                  styles.countryCode,
                  { color: colors.ink, fontFamily: "DMSans_400Regular" },
                ]}
              >
                +91
              </Text>
              <View
                style={[styles.inputSep, { backgroundColor: colors.midGray }]}
              />
              <TextInput
                ref={phoneRef}
                style={[
                  styles.input,
                  { color: colors.ink, fontFamily: "DMSans_400Regular" },
                ]}
                placeholder="10-digit number"
                placeholderTextColor={colors.warmGray}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                onFocus={() => setFocusedField("phone")}
                onBlur={() => setFocusedField(null)}
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
                maxLength={10}
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text
              style={[
                styles.fieldLabel,
                { color: colors.warmGray, fontFamily: "DMSans_400Regular" },
              ]}
            >
              EMAIL ADDRESS
            </Text>
            <View
              style={[
                styles.inputRow,
                { borderBottomColor: fieldBorder("email") },
              ]}
            >
              <TextInput
                ref={emailRef}
                style={[
                  styles.input,
                  { color: colors.ink, fontFamily: "DMSans_400Regular" },
                ]}
                placeholder="For order updates"
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
            <Text
              style={[
                styles.fieldLabel,
                { color: colors.warmGray, fontFamily: "DMSans_400Regular" },
              ]}
            >
              PASSWORD
            </Text>
            <View
              style={[
                styles.inputRow,
                { borderBottomColor: fieldBorder("password") },
              ]}
            >
              <TextInput
                ref={passwordRef}
                style={[
                  styles.input,
                  { color: colors.ink, fontFamily: "DMSans_400Regular", flex: 1 },
                ]}
                placeholder="Min. 8 characters"
                placeholderTextColor={colors.warmGray}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                returnKeyType="done"
                onSubmitEditing={handleSignUp}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                <Feather name={showPassword ? "eye-off" : "eye"} size={16} color={colors.warmGray} />
              </Pressable>
            </View>
          </View>

          {/* Benefits */}
          <View
            style={[
              styles.benefitsBox,
              { backgroundColor: colors.champagne, borderColor: colors.gold },
            ]}
          >
            {[
              "Early access to new drops",
              "Exclusive member-only offers",
              "Artisan stories & craft guides",
              "Save wishlist across devices",
            ].map((b) => (
              <View key={b} style={styles.benefitRow}>
                <Feather name="check" size={12} color={colors.gold} />
                <Text
                  style={[
                    styles.benefitText,
                    { fontFamily: "DMSans_400Regular" },
                  ]}
                >
                  {b}
                </Text>
              </View>
            ))}
          </View>

          {/* Error */}
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
            onPress={handleSignUp}
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
                Create Account →
              </Text>
            )}
          </Pressable>

          <View style={styles.orRow}>
            <View
              style={[styles.orLine, { backgroundColor: colors.midGray }]}
            />
            <Text
              style={[
                styles.orText,
                { color: colors.warmGray, fontFamily: "DMSans_400Regular" },
              ]}
            >
              or
            </Text>
            <View
              style={[styles.orLine, { backgroundColor: colors.midGray }]}
            />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.secondaryBtn,
              {
                borderColor: colors.gold,
                backgroundColor: pressed ? colors.champagne : "transparent",
              },
            ]}
            onPress={() => router.replace("/jewelery/auth/sign-in" as any)}
          >
            <Text
              style={[
                styles.secondaryBtnText,
                { color: colors.gold, fontFamily: "DMSans_400Regular" },
              ]}
            >
              Already have an account? Sign in →
            </Text>
          </Pressable>

          <Text
            style={[
              styles.finePrint,
              { color: colors.warmGray, fontFamily: "DMSans_300Light" },
            ]}
          >
            By creating an account, you agree to our Terms of Service and
            Privacy Policy.
          </Text>
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
  countryCode: { fontSize: 15 },
  inputSep: { width: 1, height: 16 },
  input: { flex: 1, fontSize: 15, padding: 0 },
  benefitsBox: {
    borderWidth: 0.5,
    borderRadius: 4,
    padding: 14,
    gap: 8,
    marginBottom: 24,
  },
  benefitRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  benefitText: { fontSize: 12, lineHeight: 18 },
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
  primaryBtn: {
    paddingVertical: 16,
    borderRadius: 2,
    alignItems: "center",
    marginBottom: 20,
  },
  primaryBtnText: { fontSize: 13, letterSpacing: 2 },
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
  secondaryBtnText: { fontSize: 12, letterSpacing: 0.5 },
  finePrint: { fontSize: 10, lineHeight: 16, textAlign: "center" },
});
