import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import LottieView from "lottie-react-native";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { styles } from "../styles/auth.style";
import { lightTheme } from "@/src/theme/colors";
import { useLogin, useRegister, useVerifyOTP } from "../hooks/useAuth";
import { LoginForm } from "../components/LoginForm";
import { RegisterForm } from "../components/RegisterForm";
import { OTPForm } from "../components/OTPForm";
import { AuthMode } from "../components/auth.types";

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);
  const [mode, setMode] = useState<AuthMode>("login");
  const [otpEmail, setOtpEmail] = useState("");

  const { isPending: loginPending } = useLogin();
  const { isPending: registerPending } = useRegister();
  const { isPending: otpPending } = useVerifyOTP();

  const loading = loginPending || registerPending || otpPending;

  const switchMode = (newMode: AuthMode) => {
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
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
      <LinearGradient
        colors={lightTheme.spgradient}
        locations={[0, 0.28, 0.62, 0.9, 9.2]}
        start={{ x: -0.4, y: 0 }}
        end={{ x: -0.8, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 40 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Lottie Animation */}
          <Animated.View
            style={styles.iconContainer}
            entering={FadeInDown.delay(getDelay(0)).duration(600)}
          >
            <LottieView
              source={require("@/assets/lottie/Gift box.json")}
              autoPlay
              loop
              style={{ width: 340, height: 240 }}
            />
          </Animated.View>

          {/* Header */}
          <Animated.View
            style={styles.header}
            entering={FadeInDown.delay(getDelay(1)).duration(600)}
          >
            <Text style={styles.title}>
              {mode === "login"
                ? "Welcome Back"
                : mode === "register"
                  ? "Create Account"
                  : "Verify Email"}
            </Text>
            <Text style={styles.subtitle}>
              {mode === "login"
                ? "Sign in with your email and password."
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
          <Animated.View entering={FadeInDown.delay(getDelay(2)).duration(600)}>
            {mode === "login" && <LoginForm {...sharedProps} />}
            {mode === "register" && <RegisterForm {...sharedProps} />}
            {mode === "otp" && <OTPForm {...sharedProps} otpEmail={otpEmail} />}
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
                    color: "rgba(255,255,255,0.7)",
                    fontSize: 14,
                    fontWeight: "500",
                  }}
                >
                  {mode === "login"
                    ? "Don't have an account? "
                    : "Already have an account? "}
                  <Text
                    style={{
                      color: "#ffffff",
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
                    color: "rgba(255,255,255,0.7)",
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
                color: "rgba(255,255,255,0.5)",
                fontSize: 12,
                textAlign: "center",
                lineHeight: 18,
              }}
            >
              By continuing, you agree to our{" "}
              <Text
                style={{
                  fontWeight: "600",
                  color: "rgba(255,255,255,0.8)",
                  textDecorationLine: "underline",
                }}
              >
                Terms of Service
              </Text>
              {"\n"}and{" "}
              <Text
                style={{
                  fontWeight: "600",
                  color: "rgba(255,255,255,0.8)",
                  textDecorationLine: "underline",
                }}
              >
                Privacy Policy
              </Text>
              .
            </Text>
          </Animated.View>
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
