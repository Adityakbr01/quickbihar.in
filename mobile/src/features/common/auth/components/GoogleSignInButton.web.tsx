import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Constants from "expo-constants";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";

interface GoogleSignInButtonProps {
  onSuccess: (idToken: string) => void | Promise<void>;
  onError?: (message: string) => void;
  mode?: "signin" | "link";
  disabled?: boolean;
}

const GIS_SRC = "https://accounts.google.com/gsi/client";

/**
 * Google Sign-In button for Web platform using Google Identity Services (GIS).
 * Does not rely on native Google Play Services, ensuring full functionality
 * on mobile web browsers (Chrome, Safari, Brave) and desktop.
 */
export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
  mode = "signin",
  disabled = false,
}) => {
  const theme = useTheme() as any;
  const [loading, setLoading] = useState(false);
  const [gisReady, setGisReady] = useState(false);
  const gisMountRef = useRef<any>(null);

  const extra = (Constants.expoConfig?.extra as any) ?? {};
  const google = extra.google ?? {};
  const webClientId =
    google.webClientId ||
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
    "183149129805-vf8pkq6h066lcapjanjv1271g36jvij4.apps.googleusercontent.com";

  // 1. Load Google Identity Services script
  useEffect(() => {
    if (typeof window === "undefined") return;

    if ((window as any).google?.accounts?.id) {
      setGisReady(true);
      return;
    }

    const existing = document.querySelector(`script[src="${GIS_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => setGisReady(true), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => setGisReady(true);
    script.onerror = () =>
      onError?.("Could not load Google Sign-In. Check your network.");
    document.head.appendChild(script);
  }, [onError]);

  // 2. Initialize GIS when ready
  useEffect(() => {
    if (!gisReady || !webClientId || typeof window === "undefined") return;
    const googleAuth = (window as any).google?.accounts?.id;
    if (!googleAuth) return;

    try {
      googleAuth.initialize({
        client_id: webClientId,
        callback: (response: { credential?: string }) => {
          setLoading(false);
          if (response?.credential) {
            onSuccess(response.credential);
          } else {
            onError?.("Google sign-in did not return credentials.");
          }
        },
        cancel_on_tap_outside: true,
      });

      // If hidden mount node is available, render Google's real button
      // so users can click or tap it directly
      if (gisMountRef.current) {
        const domNode = gisMountRef.current as HTMLElement;
        domNode.innerHTML = "";
        googleAuth.renderButton(domNode, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: mode === "link" ? "signin_with" : "continue_with",
          shape: "rectangular",
          width: 320,
        });
      }
    } catch (err: any) {
      console.warn("[GoogleSignInButton.web] GIS init failed:", err);
    }
  }, [gisReady, webClientId, mode, onSuccess, onError]);

  const handlePress = () => {
    if (loading || disabled) return;
    const googleAuth = (window as any).google?.accounts?.id;

    if (!googleAuth) {
      onError?.("Google Sign-In is initializing. Please tap again.");
      return;
    }

    setLoading(true);

    // Try finding the rendered iframe button inside our mount and clicking it
    try {
      if (gisMountRef.current) {
        const iframe = (gisMountRef.current as HTMLElement).querySelector(
          "iframe"
        );
        const button = (gisMountRef.current as HTMLElement).querySelector(
          "[role='button']"
        ) as HTMLElement;
        if (button) {
          button.click();
          return;
        }
      }
      // Fallback: prompt One Tap / chooser
      googleAuth.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          setLoading(false);
        }
      });
    } catch (e: any) {
      setLoading(false);
      onError?.(e.message || "Failed to launch Google Sign-In.");
    }
  };

  const label =
    mode === "link" ? "Link Google Account" : "Continue with Google";

  return (
    <View style={styles.wrapper}>
      {/* Real GIS Button Container (Transparent overlay for direct touch interaction) */}
      <View
        ref={gisMountRef}
        style={styles.hiddenGisMount}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={handlePress}
        disabled={loading || disabled}
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
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    position: "relative",
  },
  hiddenGisMount: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.001,
    zIndex: 10,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
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

export default GoogleSignInButton;
