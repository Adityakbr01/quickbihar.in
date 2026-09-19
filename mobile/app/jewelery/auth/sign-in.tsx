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
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { googleAuthRequest } from "@/src/features/common/auth/api/auth.api";
import { GoogleSignInButton } from "@/src/features/common/auth/components/GoogleSignInButton";
import { useAuthStore } from "@/src/features/common/auth/store/authStore";
import { useCartStore } from "@/src/features/common/cart/store/cartStore";
import { goBack } from "@/src/utils/navigation";
import { useColors } from "@/src/features/Jewelery/hooks/useColors";
import { JEWELERY_MODULE_CONFIG } from "@/src/constants/app.constants";

/**
 * Jewelery auth — same one-tap flow as clothing (`auth.screen.tsx`):
 * Google sign-in only. New users are registered automatically by the
 * server (/auth/google). No passwords, no OTP screens.
 */
export default function SignInScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setAuth } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const topPad = Platform.OS === "web" ? 16 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleGoogleSuccess = async (idToken: string) => {
    setError("");
    setLoading(true);
    try {
      const response = await googleAuthRequest({ idToken, client: "mobile" });
      const data = response?.data;
      if (data?.user && data?.accessToken) {
        await setAuth(data.user, data.accessToken, data.refreshToken || "");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        useCartStore.getState().syncLocalCart().catch(() => {});
        router.replace("/jewelery/(tabs)/profile" as any);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setError(response?.message || "Google sign-in failed.");
      }
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(err?.response?.data?.message || err?.message || "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.ivory }]}>
      <View style={[styles.topBar, { paddingTop: topPad + 8 }]}>
        <Pressable onPress={() => goBack(router)} hitSlop={12}>
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
            Welcome back.
          </Text>
          <Text style={[styles.subline, { color: colors.warmGray, fontFamily: "DMSans_300Light" }]}>
            One-tap sign in to access your wishlist, orders and exclusive drops. New users are registered automatically.
          </Text>

          <View style={[styles.divider, { backgroundColor: colors.midGray }]} />

          {!!error && (
            <View style={[styles.errorBox, { backgroundColor: "#fdf0f0", borderColor: colors.maroon }]}>
              <Feather name="alert-circle" size={13} color={colors.maroon} />
              <Text style={[styles.errorText, { color: colors.maroon, fontFamily: "DMSans_400Regular" }]}>
                {error}
              </Text>
            </View>
          )}

          {loading ? (
            <ActivityIndicator color={colors.gold} size="small" />
          ) : (
            <GoogleSignInButton
              mode="signin"
              onSuccess={(idToken) => {
                handleGoogleSuccess(idToken).catch(() => {});
              }}
              onError={(msg) => setError(msg)}
            />
          )}

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
  divider: {
    height: 0.5,
    marginBottom: 24,
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
  finePrint: {
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
    marginTop: 20,
  },
});
