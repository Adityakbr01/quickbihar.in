import { useAuth } from "@/src/features/Jewelery/context/AuthContext";
import { useColors } from "@/src/features/Jewelery/hooks/useColors";
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
  const { sendOtp } = useAuth();

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleSendOtp = async () => {
    setError("");
    const inputVal = phone.trim();
    if (!inputVal) {
      setError("Please enter your registered email or phone number.");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    const result = await sendOtp(inputVal);
    setLoading(false);

    if (result.success) {
      router.push({
        pathname: "/jewelery/auth/otp" as any,
        params: { phone: inputVal, email: inputVal, flow: "forgot" },
      });
    } else {
      setError(result.error || "Failed to send OTP.");
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
            AABHUSHAN
          </Text>

          <Text style={[styles.headline, { color: colors.ink, fontFamily: "CormorantGaramond_400Regular_Italic" }]}>
            Forgot your{"\n"}password?
          </Text>
          <Text style={[styles.subline, { color: colors.warmGray, fontFamily: "DMSans_300Light" }]}>
            No worries. Enter your registered mobile number and we'll send you a verification code.
          </Text>

          <View style={[styles.divider, { backgroundColor: colors.midGray }]} />

          {/* Steps visual */}
          <View style={styles.stepsRow}>
            {["Enter number", "Verify OTP", "New password"].map((step, i) => (
              <React.Fragment key={step}>
                <View style={styles.step}>
                  <View style={[
                    styles.stepDot,
                    { backgroundColor: i === 0 ? colors.gold : colors.midGray },
                  ]}>
                    <Text style={[styles.stepNum, { color: i === 0 ? colors.ivory : colors.warmGray, fontFamily: "DMSans_500Medium" }]}>
                      {i + 1}
                    </Text>
                  </View>
                  <Text style={[styles.stepLabel, { color: i === 0 ? colors.ink : colors.warmGray, fontFamily: "DMSans_400Regular" }]}>
                    {step}
                  </Text>
                </View>
                {i < 2 && <View style={[styles.stepLine, { backgroundColor: colors.midGray }]} />}
              </React.Fragment>
            ))}
          </View>

          {/* Phone */}
          <View style={[styles.fieldGroup, { marginTop: 32 }]}>
            <Text style={[styles.fieldLabel, { color: colors.warmGray, fontFamily: "DMSans_400Regular" }]}>
              REGISTERED MOBILE NUMBER
            </Text>
            <View style={[styles.inputRow, { borderBottomColor: focused ? colors.gold : colors.midGray }]}>
              <Text style={[styles.countryCode, { color: colors.ink, fontFamily: "DMSans_400Regular" }]}>+91</Text>
              <View style={[styles.inputSep, { backgroundColor: colors.midGray }]} />
              <TextInput
                style={[styles.input, { color: colors.ink, fontFamily: "DMSans_400Regular" }]}
                placeholder="Enter your number"
                placeholderTextColor={colors.warmGray}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                returnKeyType="done"
                onSubmitEditing={handleSendOtp}
                maxLength={10}
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
            onPress={handleSendOtp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.ivory} size="small" />
            ) : (
              <Text style={[styles.primaryBtnText, { color: colors.ivory, fontFamily: "DMSans_500Medium" }]}>
                Send Verification Code →
              </Text>
            )}
          </Pressable>

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
