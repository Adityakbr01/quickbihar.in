import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputKeyPressEventData,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/src/features/Jewelery/context/AuthContext";
import { useColors } from "@/src/features/Jewelery/hooks/useColors";
import { JEWELERY_MODULE_CONFIG } from "@/src/constants/app.constants";
const OTP_LENGTH = 6;

export default function OtpScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signUp, verifyOtp, sendOtp } = useAuth();

  const params = useLocalSearchParams<{
    target?: string;
    phone?: string;
    email?: string;
    flow: "signup" | "forgot" | "login" | "setPassword";
    name?: string;
    password?: string;
  }>();

  // Active OTP target key: params.target -> params.phone -> params.email
  const activeTarget = (params.target || params.phone || params.email || "").trim();

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(30);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleDigitChange = (text: string, index: number) => {
    const cleaned = text.replace(/\D/g, "").slice(-1);
    const updated = [...digits];
    updated[index] = cleaned;
    setDigits(updated);
    setError("");

    if (cleaned && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    if (index === OTP_LENGTH - 1 && cleaned) {
      Keyboard.dismiss();
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number,
  ) => {
    if (e.nativeEvent.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = digits.join("");
    if (code.length < OTP_LENGTH) {
      setError("Please enter the complete 6-digit OTP.");
      return;
    }

    setLoading(true);
    const result = await verifyOtp(activeTarget, code);
    setLoading(false);

    if (!result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(result.error || "Incorrect OTP. Please check and try again.");
      setDigits(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (params.password) {
      try {
        await signUp(params.name ?? "", activeTarget, params.password);
      } catch {
        // Ignored as verifyOtp has already authenticated user
      }
    }

    if (params.flow === "forgot") {
      router.push({
        pathname: "/jewelery/auth/reset-password" as any,
        params: { phone: activeTarget, flow: "forgot" },
      });
    } else if (params.flow === "signup") {
      router.push({
        pathname: "/jewelery/auth/reset-password" as any,
        params: {
          phone: activeTarget,
          name: params.name,
          email: params.email,
          flow: "signup",
        },
      });
    } else {
      router.replace("/jewelery/(tabs)/profile" as any);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await sendOtp(activeTarget);
    if (result.success) {
      setCountdown(30);
      setDigits(Array(OTP_LENGTH).fill(""));
      setError("");
      inputRefs.current[0]?.focus();
    } else {
      setError(result.error || "Failed to resend OTP.");
    }
  };

  const isPhone = !activeTarget.includes("@");
  const maskedTarget = isPhone
    ? `+91 ×××××${activeTarget.slice(-5)}`
    : activeTarget;

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
        <View style={[styles.content, { paddingBottom: bottomPad + 40 }]}>
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
            Verify it's you.
          </Text>
          <Text
            style={[
              styles.subline,
              { color: colors.warmGray, fontFamily: "DMSans_300Light" },
            ]}
          >
            We've sent a 6-digit code to{"\n"}
            <Text style={{ color: colors.ink, fontFamily: "DMSans_500Medium" }}>
              {maskedTarget}
            </Text>
          </Text>



          {/* OTP boxes */}
          <View style={styles.otpRow}>
            {digits.map((d, i) => (
              <TextInput
                key={i}
                ref={(r) => {
                  inputRefs.current[i] = r;
                }}
                style={[
                  styles.otpBox,
                  {
                    borderColor: d ? colors.gold : colors.midGray,
                    backgroundColor: d ? colors.champagne : colors.pearl,
                    color: colors.ink,
                    fontFamily: "CormorantGaramond_600SemiBold",
                  },
                ]}
                value={d}
                onChangeText={(t) => handleDigitChange(t, i)}
                onKeyPress={(e) => handleKeyPress(e, i)}
                keyboardType="number-pad"
                maxLength={2}
                textAlign="center"
                selectTextOnFocus
              />
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

          {/* Verify button */}
          <Pressable
            style={({ pressed }) => [
              styles.primaryBtn,
              {
                backgroundColor: pressed ? colors.goldLight : colors.gold,
                opacity: loading ? 0.7 : 1,
              },
            ]}
            onPress={handleVerify}
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
                Verify OTP
              </Text>
            )}
          </Pressable>

          {/* Resend */}
          <Pressable
            onPress={handleResend}
            disabled={countdown > 0}
            style={styles.resendRow}
          >
            <Text
              style={[
                styles.resendText,
                {
                  color: countdown > 0 ? colors.warmGray : colors.gold,
                  fontFamily: "DMSans_400Regular",
                },
              ]}
            >
              {countdown > 0
                ? `Resend OTP in ${countdown}s`
                : "Didn't receive it? Resend OTP"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: { paddingHorizontal: 20, paddingBottom: 8 },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 16,
  },
  brand: { fontSize: 14, letterSpacing: 4, marginBottom: 28 },
  headline: { fontSize: 44, lineHeight: 50, marginBottom: 10 },
  subline: { fontSize: 14, lineHeight: 22, marginBottom: 24 },

  otpRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 28,
  },
  otpBox: {
    flex: 1,
    height: 56,
    borderWidth: 1.5,
    borderRadius: 4,
    fontSize: 24,
    lineHeight: 28,
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
  errorText: { fontSize: 12, flex: 1, lineHeight: 18 },
  primaryBtn: {
    paddingVertical: 16,
    borderRadius: 2,
    alignItems: "center",
    marginBottom: 20,
  },
  primaryBtnText: { fontSize: 13, letterSpacing: 2 },
  resendRow: { alignItems: "center" },
  resendText: { fontSize: 12, letterSpacing: 0.3 },
});
