import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  LinearTransition,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { createAuthStyles } from "../styles/auth.style";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { useLogin, useRegister, useVerifyOTP } from "../hooks/useAuth";
import { LoginForm } from "../components/LoginForm";
import { RegisterForm } from "../components/RegisterForm";
import { OTPForm } from "../components/OTPForm";
import { AuthMode } from "../components/auth.types";

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme() as any;
  const styles = createAuthStyles(theme);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);
  const [mode, setMode] = useState<AuthMode>("login");
  const [otpEmail, setOtpEmail] = useState("");

  const { mutate: login, isPending: loginPending } = useLogin();
  const { mutate: register, isPending: registerPending } = useRegister();
  const { mutate: verifyOTP, isPending: otpPending } = useVerifyOTP();

  const loading = loginPending || registerPending || otpPending;

  const switchMode = (newMode: AuthMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setApiError(null);
    setApiSuccess(null);
    setMode(newMode);
  };

  const ANIMATION_START = 100;
  const getDelay = (index: number) => ANIMATION_START + index * 100;

  const sharedProps = {
    loading,
    apiError,
    setApiError,
    apiSuccess,
    setApiSuccess,
    switchMode,
    setOtpEmail,
  };

  return (
    <View style={styles.screen}>
      <StatusBar
        barStyle={
          theme.background === "#ffffff" ? "dark-content" : "light-content"
        }
        translucent
        backgroundColor="transparent"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={[
              styles.scrollContent,
              {
                paddingTop: insets.top + 40,
                paddingBottom: insets.bottom + 40,
              },
            ]}
          >
            {/* Header */}
            <Animated.View
              style={styles.header}
              entering={FadeInDown.delay(getDelay(1)).duration(600)}
            >
              <Text style={styles.title}>
                {mode === "login"
                  ? "Sign In"
                  : mode === "register"
                    ? "Create Account"
                    : "Verify Email"}
              </Text>
              <Text style={styles.subtitle}>
                {mode === "login"
                  ? "Welcome back! Enter your details to continue."
                  : mode === "register"
                    ? "Create a new account to get started."
                    : `Enter the 6-digit code sent to ${otpEmail}`}
              </Text>
            </Animated.View>

            {/* Success Banner */}
            {apiSuccess && (
              <Animated.View
                entering={FadeInDown}
                layout={LinearTransition}
                style={localStyles.successBanner}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color="#86efac"
                />
                <Text style={localStyles.successBannerText}>{apiSuccess}</Text>
              </Animated.View>
            )}

            {/* Error Banner */}
            {apiError && (
              <Animated.View
                entering={FadeInDown}
                layout={LinearTransition}
                style={styles.errorBanner}
              >
                <Ionicons name="warning-outline" size={20} color="#fca5a5" />
                <Text style={styles.errorBannerText}>{apiError}</Text>
              </Animated.View>
            )}

            {/* Conditional Forms */}
            <Animated.View
              entering={FadeInDown.delay(getDelay(2)).duration(600)}
            >
              {mode === "login" && <LoginForm {...sharedProps} login={login} />}
              {mode === "register" && <RegisterForm {...sharedProps} register={register} />}
              {mode === "otp" && (
                <OTPForm {...sharedProps} otpEmail={otpEmail} verifyOTP={verifyOTP} />
              )}
            </Animated.View>

            {/* Mode Toggle */}
            {mode !== "otp" && (
              <Animated.View
                entering={FadeInDown.delay(getDelay(4)).duration(600)}
                style={{ marginTop: 24, alignItems: "center" }}
              >
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() =>
                    switchMode(mode === "login" ? "register" : "login")
                  }
                  disabled={loading}
                >
                  <Text
                    style={{
                      color: theme.secondaryText,
                      fontSize: 14,
                      fontWeight: "500",
                    }}
                  >
                    {mode === "login"
                      ? "Don't have an account? "
                      : "Already have an account? "}
                    <Text
                      style={{
                        color: theme.text,
                        fontWeight: "700",
                        textDecorationLine: "underline",
                      }}
                    >
                      {mode === "login" ? "Sign Up" : "Sign In"}
                    </Text>
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* Back to login from OTP */}
            {mode === "otp" && (
              <Animated.View
                entering={FadeInUp.delay(200).duration(400)}
                style={{ marginTop: 24, alignItems: "center" }}
              >
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => switchMode("login")}
                  disabled={loading}
                >
                  <Text
                    style={{
                      color: theme.secondaryText,
                      fontSize: 14,
                      fontWeight: "500",
                    }}
                  >
                    ← Back to Sign In
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* Terms Footer */}
            <Animated.View
              entering={FadeInDown.delay(getDelay(5)).duration(600)}
              style={{ marginTop: 30, alignItems: "center" }}
            >
              <Text
                style={{
                  color: theme.tertiaryText,
                  fontSize: 12,
                  textAlign: "center",
                  lineHeight: 18,
                }}
              >
                By continuing, you agree to our{" "}
                <Text
                  style={{
                    fontWeight: "600",
                    color: theme.secondaryText,
                    textDecorationLine: "underline",
                  }}
                >
                  Terms of Service
                </Text>
                {"\n"}and{" "}
                <Text
                  style={{
                    fontWeight: "600",
                    color: theme.secondaryText,
                    textDecorationLine: "underline",
                  }}
                >
                  Privacy Policy
                </Text>
                .
              </Text>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const localStyles = StyleSheet.create({
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(34, 197, 94, 0.15)",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.5)",
    marginBottom: 20,
    gap: 10,
  },
  successBannerText: {
    color: "#86efac",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
});
