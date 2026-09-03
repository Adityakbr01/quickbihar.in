import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes,
} from "@react-native-google-signin/google-signin";

import { useTheme } from "@/src/theme/Provider/ThemeProvider";

interface GoogleSignInButtonProps {
  /**
   * Called with the Google `idToken` on a successful native sign-in.
   * The parent should POST it to `/auth/google` and let the server
   * create / link the user. We do NOT auto-navigate from this
   * component — the auth flow lives in the parent (useAuth hook).
   */
  onSuccess: (idToken: string) => void | Promise<void>;
  onError?: (message: string) => void;
  /** When true, shows a subtle "Link account" label instead of "Continue with Google". */
  mode?: "signin" | "link";
  disabled?: boolean;
}

/**
 * Google sign-in button. Triggers the native Google account chooser
 * (Android: Credential Manager / iOS: ASWebAuthenticationSession),
 * then bubbles the id_token up via `onSuccess`. The server does the
 * actual identity verification + user creation.
 */
export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
  mode = "signin",
  disabled = false,
}) => {
  const theme = useTheme() as any;
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    if (loading || disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      setLoading(true);

      // Check Play Services on Android (no-op on iOS).
      try {
        await GoogleSignin.hasPlayServices({
          showPlayServicesUpdateDialog: true,
        });
      } catch {
        // iOS will throw here, which is fine.
      }

      const response = await GoogleSignin.signIn();
      // Native returns { type: "success", data: User }; web returns
      // User directly. Unwrap both shapes uniformly.
      const user = (response as any)?.data ?? response;
      const idToken = (user as any)?.idToken;

      if (!idToken) {
        throw new Error(
          "Google sign-in succeeded but no id_token was returned. Check your OAuth client configuration."
        );
      }

      await onSuccess(idToken);
    } catch (err: any) {
      // Silently ignore user-cancellation; report everything else.
      if (isErrorWithCode(err)) {
        switch (err.code) {
          case statusCodes.SIGN_IN_CANCELLED:
          case statusCodes.IN_PROGRESS:
            return;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            onError?.("Google Play Services are not available on this device.");
            return;
          default:
            onError?.(err.message ?? "Google sign-in failed.");
            return;
        }
      }
      onError?.(err?.message ?? "Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const label =
    mode === "link" ? "Link Google Account" : "Continue with Google";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={handlePress}
      disabled={loading || disabled}
      android_ripple={{ color: "rgba(255,255,255,0.08)" }}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: theme.cardBackground || "rgba(255,255,255,0.08)",
          borderColor: "rgba(255,255,255,0.18)",
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={theme.text} size="small" />
      ) : (
        <View style={styles.row}>
          {/* The "G" mark — a 22pt Google brand circle so the
              button reads as a Google button even without an asset. */}
          <View style={styles.gBadge}>
            <Text style={styles.gBadgeText}>G</Text>
          </View>
          <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={theme.secondaryText}
            style={{ marginLeft: "auto" }}
          />
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    width: "100%",
  },
  gBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  gBadgeText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#4285F4",
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
  },
});
