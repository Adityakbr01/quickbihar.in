import { ChevronRight } from "lucide-react";

import React, { useEffect, useRef, useState } from "react";
import googleIconLogo from "@/assets/svg/google-icon-logo.svg";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { cn } from "@/src/lib/utils";

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
  const isDark = theme.isDark ?? theme.text === "#ffffff";
  const [loading, setLoading] = useState(false);
  const [gisReady, setGisReady] = useState(false);
  const [pressed, setPressed] = useState(false);
  const gisMountRef = useRef<any>(null);

  // Web build has no app.json extra block — client ID comes from env.
  const google: any = {};
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
    <div className="relative w-full">
      {/* Real GIS Button Container (Transparent overlay for direct touch interaction) */}
      <div
        ref={gisMountRef}
        className="absolute inset-0 z-10 flex items-center justify-center overflow-hidden"
        style={{ opacity: 0.001 }}
      />

      <button
        type="button"
        aria-label={label}
        onClick={handlePress}
        disabled={loading || disabled}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onMouseLeave={() => setPressed(false)}
        onTouchStart={() => setPressed(true)}
        onTouchEnd={() => setPressed(false)}
        className={cn(
          "flex min-h-[52px] w-full cursor-pointer items-center justify-center rounded-xl border px-[18px] py-3.5 transition-opacity disabled:cursor-not-allowed",
        )}
        style={{
          backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#FFFFFF",
          borderColor: isDark ? "rgba(255,255,255,0.18)" : theme.border || "#E5E7EB",
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        }}
      >
        {loading ? (
          <span
            className="h-5 w-5 animate-spin rounded-full border-2 border-current opacity-70"
            style={{ color: theme.text, borderTopColor: "transparent" }}
          />
        ) : (
          <div className="flex w-full flex-row items-center gap-3">
            <div className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-white">
              <img
                src={googleIconLogo}
                alt=""
                className="h-[18px] w-[18px] object-contain"
              />
            </div>
            <span
              className="text-[15px] font-semibold"
              style={{ color: theme.text }}
            >
              {label}
            </span>
            <ChevronRight
              size={16}
              color={theme.secondaryText}
              className="ml-auto"
            />
          </div>
        )}
      </button>
    </div>
  );
};

export default GoogleSignInButton;
