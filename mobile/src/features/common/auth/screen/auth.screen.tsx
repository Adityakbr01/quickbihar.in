import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import LivingPixelOcean from "@/src/components/LivingPixelOcean";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeInDown,
  FadeInUp,
  LinearTransition,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { createAuthStyles } from "../styles/auth.style";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { useGoogleAuth } from "../hooks/useAuth";
import { GoogleSignInButton } from "../components/GoogleSignInButton";

/**
 * Auth screen — post-OTP cutover.
 *
 *   Primary path:   Google sign-in (one-tap)
 *   Secondary path: email + password
 *
 * OTP code is gone. Legacy OTP users hit a forced email-capture
 * screen once they successfully authenticate (the hook redirects
 * there if `user.legacyOtpOnly === true`).
 */
export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme() as any;
  const styles = createAuthStyles(theme);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);

  const { mutate: googleAuth, isPending: googlePending } = useGoogleAuth();

  const handleGoogleSuccess = async (idToken: string) => {
    setApiError(null);
    setApiSuccess(null);
    await new Promise<void>((resolve, reject) => {
      googleAuth(
        { idToken, client: "mobile" },
        {
          onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            resolve();
          },
          onError: (err: any) => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            const msg = err?.message || "Google sign-in failed.";
            setApiError(msg);
            reject(err);
          },
        }
      );
    });
  };

  return (
    <View style={styles.screen}>
      {/* Top 35% Ocean background with smooth gradient fade */}
      <View style={localStyles.oceanContainer} pointerEvents="none">
        <LivingPixelOcean />
        <LinearGradient
          colors={["transparent", theme.background]}
          style={StyleSheet.absoluteFill}
        />
      </View>
      <StatusBar
        barStyle={
          theme.background === "#ffffff" ? "dark-content" : "light-content"
        }
        translucent
        backgroundColor="transparent"
      />

      <View
        style={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 30,
            paddingBottom: insets.bottom + 20,
            justifyContent: "space-between",
          },
        ]}
      >
        {/* Top Spacer / Branding Area */}
        <View style={{ alignItems: "center", marginTop: 40 }}>
          <Animated.View
            entering={FadeInDown.delay(200).duration(600)}
            style={{ alignItems: "center", marginTop: 16 }}
          >
            <Text style={styles.title}>QuickBihar</Text>

          </Animated.View>

          {/* Value props / Trust badges */}
          <Animated.View
            entering={FadeInDown.delay(300).duration(600)}
            style={localStyles.featuresList}
          >
            <View style={localStyles.featureItem}>
              <Ionicons name="speedometer-outline" size={18} color="#38bdf8" />
              <Text style={[localStyles.featureText, { color: theme.secondaryText }]}>
                30-Min Express Delivery
              </Text>
            </View>
            <View style={localStyles.featureItem}>
              <Ionicons name="storefront-outline" size={18} color="#4ade80" />
              <Text style={[localStyles.featureText, { color: theme.secondaryText }]}>
                Best Local Stores & Malls
              </Text>
            </View>
            <View style={localStyles.featureItem}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#a78bfa" />
              <Text style={[localStyles.featureText, { color: theme.secondaryText }]}>
                100% Genuine Products
              </Text>
            </View>
          </Animated.View>
        </View>

        {/* Action Center: Single Google Sign In Button */}
        <View style={{ width: "100%", paddingHorizontal: 4, marginBottom: 20 }}>
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

          <Animated.View
            entering={FadeInDown.delay(400).duration(600)}
            style={{ width: "100%" }}
          >
            <GoogleSignInButton
              mode="signin"
              disabled={googlePending}
              onSuccess={(idToken) => {
                handleGoogleSuccess(idToken).catch(() => {
                  /* error shown via apiError */
                });
              }}
              onError={(msg) => setApiError(msg)}
            />
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(500).duration(600)}
            style={{ marginTop: 12, alignItems: "center" }}
          >
            <Text style={{ color: theme.tertiaryText, fontSize: 13, textAlign: "center" }}>
              One-tap sign in <br/> New users will be registered automatically
            </Text>
          </Animated.View>
        </View>

        {/* Terms Footer */}
        <Animated.View
          entering={FadeInUp.delay(600).duration(600)}
          style={{ alignItems: "center", marginBottom: 10 }}
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
            </Text>{" "}
            and{" "}
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
    </View>
  );
}

const localStyles = StyleSheet.create({
  oceanContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "35%",
    overflow: "hidden",
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  featuresList: {
    marginTop: 28,
    gap: 12,
    alignItems: "flex-start",
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  featureText: {
    fontSize: 14,
    fontWeight: "500",
  },
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
