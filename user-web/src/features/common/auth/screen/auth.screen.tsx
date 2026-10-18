/**
 * @file src/features/common/auth/screen/auth.screen.tsx
 * Single-screen 1-tap Google Authentication.
 * Includes only: Logo, Title, App Name, and Google Login.
 */

import React, { useCallback, useState } from "react";
import { useGoogleAuth } from "../hooks/useAuth";
import { APP_NAME } from "@/src/constants/app.constants";
import splashIcon from "@/assets/images/icons/splash-icon.webp";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import GoogleSignInButton from "../components/GoogleSignInButton";

const LockIcon = () => (
  <svg
    width={13}
    height={13}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    className="shrink-0"
  >
    <path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5zm-3 8V7a3 3 0 1 1 6 0v3H9z" />
  </svg>
);

const AlertIcon = () => (
  <svg
    width={18}
    height={18}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className="shrink-0"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

export default function AuthScreen() {
  const theme = useTheme();
  const isDark = theme.isDark ?? theme.text === "#ffffff";
  const [apiError, setApiError] = useState<string | null>(null);

  const { mutate: googleAuth, isPending: googlePending } = useGoogleAuth();

  const handleGoogleSuccess = useCallback(
    (idToken: string) => {
      setApiError(null);
      googleAuth(
        { idToken, client: "web" },
        {
          onError: (err: any) => {
            setApiError(
              err?.message || "Google sign-in failed. Please try again."
            );
          },
        }
      );
    },
    [googleAuth]
  );

  return (
    <div
      className="relative flex min-h-dvh w-full flex-col items-center justify-center overflow-hidden px-4 py-8 selection:bg-[#80c314]/20"
      style={{ backgroundColor: theme.background }}
    >
      {/* Ambient background glows */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[450px] w-[500px] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
        style={{
          background: isDark
            ? "radial-gradient(circle, rgba(201,160,90,0.18) 0%, rgba(20,17,13,0) 70%)"
            : "radial-gradient(circle, rgba(201,160,90,0.14) 0%, rgba(255,255,255,0) 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-20 right-0 h-[350px] w-[350px] rounded-full opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(128,195,20,0.12) 0%, rgba(0,0,0,0) 70%)",
        }}
      />

      {/* Main Container Card */}
      <div
        className="relative z-10 flex w-full max-w-[420px] flex-col items-center rounded-3xl border p-8 sm:p-10 shadow-2xl backdrop-blur-md transition-all duration-300"
        style={{
          backgroundColor: isDark
            ? "rgba(22, 22, 24, 0.85)"
            : "rgba(255, 255, 255, 0.92)",
          borderColor: isDark
            ? "rgba(255, 255, 255, 0.12)"
            : "rgba(0, 0, 0, 0.08)",
          boxShadow: isDark
            ? "0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 40px -10px rgba(201, 160, 90, 0.12)"
            : "0 25px 50px -12px rgba(0, 0, 0, 0.08), 0 0 30px -10px rgba(128, 195, 20, 0.1)",
        }}
      >
        {/* ── 1. LOGO ── */}
        <div className="relative mb-4 flex items-center justify-center">
          <div
            className="absolute h-24 w-24 rounded-full blur-lg opacity-40"
            style={{ backgroundColor: "#C9A05A" }}
          />
          <div
            className="relative flex h-[76px] w-[76px] items-center justify-center rounded-2xl p-1.5 shadow-md transition-transform hover:scale-105"
            style={{
              backgroundColor: isDark ? "#121214" : "#FFFFFF",
              border: `1.5px solid ${isDark ? "#C9A05A" : "#80C314"}`,
            }}
          >
            <img
              src={splashIcon}
              alt={`${APP_NAME} logo`}
              className="h-[56px] w-[56px] rounded-xl object-contain"
            />
          </div>
        </div>

        {/* ── 2. APP NAME & EYEBROW ── */}
        <p
          className="text-[11px] font-black uppercase tracking-[0.24em]"
          style={{ color: "#C9A05A" }}
        >
          Bihar's Own Marketplace
        </p>

        {/* ── 3. TITLE & SUBTITLE ── */}
        <h1
          className="mt-3 text-center text-2xl font-extrabold tracking-tight sm:text-[28px]"
          style={{ color: theme.text }}
        >
          Welcome to {APP_NAME}
        </h1>
        <p
          className="mt-2 text-center text-[13.5px] leading-relaxed"
          style={{ color: theme.secondaryText }}
        >
          One-tap sign in to shop faster, track your orders, and discover local
          collections.
        </p>

        {/* Error Notification */}
        {apiError && (
          <div
            role="alert"
            className="mt-5 flex w-full items-center gap-2.5 rounded-xl border p-3 text-xs font-medium animate-in fade-in slide-in-from-top-1"
            style={{
              backgroundColor: isDark
                ? "rgba(239, 68, 68, 0.12)"
                : "rgba(254, 242, 242, 0.9)",
              borderColor: isDark ? "rgba(239, 68, 68, 0.35)" : "#FCA5A5",
              color: theme.error || "#EF4444",
            }}
          >
            <AlertIcon />
            <span className="flex-1 leading-snug">{apiError}</span>
          </div>
        )}

        {/* ── 4. GOOGLE LOGIN ── */}
        <div className="mt-7 w-full">
          <GoogleSignInButton
            onSuccess={handleGoogleSuccess}
            onError={(msg) => setApiError(msg)}
            disabled={googlePending}
          />

          <div
            className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs leading-[17px]"
            style={{ color: theme.secondaryText }}
          >
            <LockIcon />
            <span>Secured by Google — we never see your password.</span>
          </div>
        </div>

        {/* Footer info */}
        <div
          className="mt-8 border-t pt-5 w-full text-center"
          style={{ borderColor: theme.border }}
        >
          <p
            className="text-[11px] leading-relaxed"
            style={{ color: theme.secondaryText }}
          >
            By continuing, you agree to our{" "}
            <a
              href="/terms"
              target="_blank"
              rel="noreferrer"
              className="font-semibold underline transition-opacity hover:opacity-80"
              style={{ color: theme.primary }}
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="/privacy"
              target="_blank"
              rel="noreferrer"
              className="font-semibold underline transition-opacity hover:opacity-80"
              style={{ color: theme.primary }}
            >
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
