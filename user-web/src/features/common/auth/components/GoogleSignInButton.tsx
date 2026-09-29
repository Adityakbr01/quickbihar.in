import { ChevronRight } from "lucide-react";

import * as Haptics from "@/lib/haptics";
import React, { useState } from "react";
import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes,
  signOutGoogleNative,
} from "../config/googleSignInConfig";
import googleIconLogo from "@/assets/svg/google-icon-logo.svg";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { cn } from "@/src/lib/utils";

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
  const isDark = theme.isDark ?? theme.text === "#ffffff";
  const [loading, setLoading] = useState(false);
  const [pressed, setPressed] = useState(false);

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

      // Force the account chooser: drop any cached Google session first so
      // signIn() always shows ALL accounts instead of silently reusing the
      // last one (e.g. stale cache from a logout before this fix shipped).
      // Never throws — safe to run on every tap.
      await signOutGoogleNative();

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
            if (
              String(err.code) === "10" ||
              err.message?.includes("DEVELOPER_ERROR")
            ) {
              onError?.(
                "DEVELOPER_ERROR (10): Keystore SHA-1 fingerprint Google Cloud Console me add nahi hai."
              );
            } else {
              onError?.(err.message ?? "Google sign-in failed.");
            }
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
  );
};
