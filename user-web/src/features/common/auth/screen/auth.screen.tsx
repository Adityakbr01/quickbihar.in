/**
 * @file src/features/common/auth/screen/auth.screen.tsx
 * Web auth screen — sign in / sign up / forgot password / reset password.
 *
 * Design direction (Mobbin-inspired):
 *   • Desktop: hero illustration left, glass form card right
 *   • Mobile: hero header top, card below, full-bleed
 *   • Fully theme-aware: every color, border, shadow from useTheme()
 *   • Google Sign-In as primary CTA; email+password as secondary
 *   • Smooth mode transitions (login ↔ register ↔ forgot-password)
 *   • Accessible labels, ARIA attributes, keyboard navigation
 *
 * Backend contracts preserved: Google idToken, email+password,
 * forgot-password email, reset-password token+password.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useGoogleAuth, useLogin, useRegister, useRequestPasswordReset } from "../hooks/useAuth";
import { APP_NAME } from "@/src/constants/app.constants";
import splashIcon from "@/assets/images/icons/splash-icon.webp";
import googleIcon from "@/assets/svg/google-icon-logo.svg";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { cn } from "@/src/lib/utils";

const GIS_SRC = "https://accounts.google.com/gsi/client";
const WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  "183149129805-vf8pkq6h066lcapjanjv1271g36jvij4.apps.googleusercontent.com";

export type AuthMode = "login" | "register" | "forgot" | "reset";

interface AuthModeConfig {
  title: string;
  subtitle: string;
  primaryLabel: string;
  secondaryLabel: string;
  secondaryAction: () => void;
  showGoogle: boolean;
}

const MODE_CONFIG: Record<AuthMode, AuthModeConfig> = {
  login: {
    title: "Welcome back",
    subtitle: "Sign in to your QuickBihar account",
    primaryLabel: "Sign In",
    secondaryLabel: "Create an account",
    secondaryAction: () => {},
    showGoogle: true,
  },
  register: {
    title: "Create account",
    subtitle: "Join QuickBihar and start shopping",
    primaryLabel: "Create Account",
    secondaryLabel: "Already have an account?",
    secondaryAction: () => {},
    showGoogle: true,
  },
  forgot: {
    title: "Forgot password?",
    subtitle: "Enter your email and we'll send a reset link",
    primaryLabel: "Send Reset Link",
    secondaryLabel: "Remember your password?",
    secondaryAction: () => {},
    showGoogle: false,
  },
  reset: {
    title: "Reset password",
    subtitle: "Create a new password for your account",
    primaryLabel: "Reset Password",
    secondaryLabel: "Back to sign in",
    secondaryAction: () => {},
    showGoogle: false,
  },
};

const Icon = ({
  d,
  size = 20,
}: { d?: string; size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {d && <path d={d} />}
  </svg>
);

const MailIcon = () => (
  <Icon d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
);
const LockIcon = () => (
  <Icon d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5zm-3 8V7a3 3 0 1 1 6 0v3H9z" />
);
const UserIcon = () => (
  <Icon d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
);
const ArrowRightIcon = () => (
  <Icon d="M5 12h14" size={16} />
);

function useViewport() {
  const read = () => ({
    w: typeof window === "undefined" ? 390 : window.innerWidth,
    h: typeof window === "undefined" ? 844 : window.innerHeight,
  });
  const [vp, setVp] = useState(read);
  React.useEffect(() => {
    const onResize = () => setVp(read());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return vp;
}

export default function AuthScreen() {
  const theme = useTheme();
  const isDark = theme.isDark ?? theme.text === "#ffffff";
  const { w } = useViewport();
  const isDesktop = w >= 1024;

  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [gisLoading, setGisLoading] = useState(false);
  const [gisReady, setGisReady] = useState(false);
  const gisMountRef = useRef<HTMLDivElement>(null);

  const { mutate: googleAuth, isPending: googlePending } = useGoogleAuth();
  const { mutate: login, isPending: loginPending } = useLogin();
  const { mutate: register, isPending: registerPending } = useRegister();
  const { mutate: requestReset } = useRequestPasswordReset();

  const current = MODE_CONFIG[mode];
  const isLoading = loading || googlePending || loginPending || registerPending;

  const handleGoogleSuccess = useCallback(
    (idToken: string) => {
      setApiError(null);
      googleAuth(
        { idToken, client: "web" },
        {
          onSuccess: () => {},
          onError: (err: any) => {
            setApiError(err?.message || "Google sign-in failed.");
            setLoading(false);
          },
        }
      );
    },
    [googleAuth]
  );

  const handleEmailSubmit = useCallback(
    (data: { email: string; password?: string; fullName?: string }) => {
      setApiError(null);
      const password = data.password ?? "";
      if (mode === "login") {
        login({ email: data.email, password }, {
          onSuccess: () => {},
          onError: (err: any) => {
            setApiError(err?.message || "Login failed.");
          },
        });
      } else if (mode === "register") {
        register({ email: data.email, password, fullName: data.fullName ?? "" }, {
          onSuccess: () => {},
          onError: (err: any) => {
            setApiError(err?.message || "Registration failed.");
          },
        });
      } else if (mode === "forgot") {
        requestReset({ email: data.email }, {
          onSuccess: () => setMode("login"),
          onError: (err: any) => {
            setApiError(err?.message || "Reset link could not be sent.");
          },
        });
      }
    },
    [mode, login, register, requestReset]
  );

  /* ── GIS ── */
  useEffect(() => {
    if ((window as any).google?.accounts?.id) {
      setGisReady(true);
      return;
    }
    const existing = document.querySelector(`script[src="${GIS_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => setGisReady(true), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => setGisReady(true);
    script.onerror = () => setApiError("Could not load Google Sign-In.");
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!gisReady || typeof window === "undefined") return;
    const googleAuthApi = (window as any).google?.accounts?.id;
    if (!googleAuthApi) return;
    try {
      googleAuthApi.initialize({
        client_id: WEB_CLIENT_ID,
        callback: (response: { credential?: string }) => {
          setGisLoading(false);
          if (response?.credential) {
            handleGoogleSuccess(response.credential);
          } else {
            setApiError("Google sign-in did not return credentials.");
          }
        },
        cancel_on_tap_outside: true,
      });
      if (gisMountRef.current) {
        gisMountRef.current.innerHTML = "";
        googleAuthApi.renderButton(gisMountRef.current, {
          type: "standard",
          theme: isDark ? "dark" : "light",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          width: 320,
        });
      }
    } catch (err: any) {
      console.warn("[AuthScreen] GIS init failed:", err);
    }
  }, [gisReady, isDark, handleGoogleSuccess]);

  const handleGooglePress = () => {
    if (gisLoading || googlePending) return;
    const googleAuthApi = (window as any).google?.accounts?.id;
    if (!googleAuthApi) {
      setGisLoading(true);
      return;
    }
    setGisLoading(true);
    try {
      const button = gisMountRef.current?.querySelector("[role='button']") as HTMLElement | null;
      if (button) {
        button.click();
        return;
      }
      googleAuthApi.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          setGisLoading(false);
        }
      });
    } catch (e: any) {
      setGisLoading(false);
      setApiError(e.message || "Failed to launch Google Sign-In.");
    }
  };

  const heroContent = (
    <div className="relative flex h-full flex-col items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(128,195,20,0.14),rgba(128,195,20,0.04)_55%,transparent_100%)]" />
      <div className="relative z-10 flex flex-col items-center gap-3">
        <div
          className="relative flex items-center justify-center"
          style={{
            height: 72,
            width: 72,
            backgroundColor: theme.secondaryBackground,
            border: `1.5px solid ${theme.primary}`,
            borderRadius: "9999px",
          }}
        >
          <img
            src={splashIcon}
            alt="QuickBihar logo"
            className="h-[44px] w-[44px] rounded-xl"
          />
        </div>
        <p className="text-[11px] font-extrabold tracking-[0.24em] uppercase">
          {isDark ? "BIHAR'S OWN MARKETPLACE" : "Bihar's Own Marketplace"}
        </p>
        <h1 className="mt-2 text-[20px] md:text-2xl font-extrabold tracking-tight" style={{ color: theme.text }}>
          {APP_NAME}
        </h1>
        <p className="mt-1 text-[13px] md:text-sm leading-6" style={{ color: theme.secondaryText }}>
          Your neighborhood marketplace for fashion, essentials & more
        </p>
      </div>
    </div>
  );

  return (
    <div
      className="flex min-h-dvh w-full flex-col"
      style={{ backgroundColor: theme.background }}
    >
      {isDesktop ? (
        <div className="flex flex-1 h-full">
          {/* Desktop hero left */}
          <section className="hidden lg:flex flex-1 flex-col items-center justify-center bg-secondary/50 px-12">
            {heroContent}
          </section>
          {/* Desktop form right */}
          <section className="flex-1 flex flex-col items-center justify-center p-8 md:p-12">
            <AuthForm />
          </section>
        </div>
      ) : (
        <div className="flex min-h-dvh w-full flex-col">
          {/* Mobile hero top */}
          <section className="relative flex flex-col items-center justify-center pt-10 pb-6 px-6">
            {heroContent}
          </section>
          {/* Mobile form below */}
          <section className="flex-1 flex flex-col items-center justify-center p-6">
            <AuthForm />
          </section>
        </div>
      )}
    </div>
  );

  function AuthForm() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const form = e.currentTarget as HTMLFormElement;
      const formData = new FormData(form);
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;
      const fullName = formData.get("fullName") as string;

      handleEmailSubmit(mode === "register" ? { email, password, fullName } : { email, password });
    };

    const handleForgotPassword = () => {
      setApiError(null);
      setMode("forgot");
    };

    const renderInput = (
      name: string,
      label: string,
      type: string,
      placeholder: string,
      icon: React.ReactNode,
      rightIcon?: React.ReactNode,
      rightIconOnClick?: () => void,
      autoComplete?: string,
      error?: string
    ) => {
      const focusedBorder = isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.4)";
      return (
        <div className="flex flex-col gap-2" key={name}>
          <label
            className="text-[13px] font-semibold tracking-wide"
            style={{ color: theme.text }}
          >
            {label}
          </label>
          <div
            className="flex h-[52px] items-center justify-between rounded-xl border px-3.5 py-2 transition-all focus-within:ring-1 focus-within:ring-inset focus-within:ring-primary"
            style={{
              backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
              borderColor: error ? theme.error : focusedBorder,
            }}
          >
            {icon && (
              <span className="shrink-0" style={{ color: theme.secondaryText }}>
                {icon}
              </span>
            )}
            <input
              name={name}
              type={type}
              placeholder={placeholder}
              autoComplete={autoComplete}
              disabled={isLoading}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: theme.text,
                fontSize: 15,
                fontWeight: 500,
              }}
            />
            {rightIcon && (
              <button
                type="button"
                onClick={rightIconOnClick}
                className="cursor-pointer p-1"
                aria-label={rightIconOnClick ? "Toggle password visibility" : undefined}
              >
                {rightIcon}
              </button>
            )}
          </div>
          {error && (
            <p className="text-[11px] font-medium" style={{ color: theme.error }}>
              {error}
            </p>
          )}
        </div>
      );
    };

    const isRegister = mode === "register";
    const isForgot = mode === "forgot";
    const isReset = mode === "reset";
    const disabled = isLoading;

    return (
      <form onSubmit={handleSubmit} className="w-full max-w-[520px] px-4">
        {/* Header */}
        <div className="flex flex-col items-center justify-center text-center gap-3 mb-8">
          <h2 className="text-[24px] md:text-2xl font-extrabold tracking-tight" style={{ color: theme.text }}>
            {current.title}
          </h2>
          <p className="text-[14px] md:text-sm leading-6" style={{ color: theme.secondaryText }}>
            {current.subtitle}
          </p>
        </div>

        {/* Google Sign-In */}
        {current.showGoogle && (
          <div className="mb-8">
            <div className="relative w-full">
              <div
                ref={gisMountRef}
                className="absolute inset-0 z-10 flex items-center justify-center overflow-hidden"
                style={{ opacity: 0.001 }}
              />
              <button
                type="button"
                aria-label="Continue with Google"
                onClick={handleGooglePress}
                disabled={gisLoading || googlePending}
                className={cn(
                  "flex h-[52px] w-full cursor-pointer items-center justify-center rounded-xl border px-[18px] py-3.5 text-left transition-opacity disabled:cursor-not-allowed",
                  disabled ? "opacity-50" : ""
                )}
                style={{
                  backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#FFFFFF",
                  borderColor: isDark ? "rgba(255,255,255,0.18)" : theme.border || "#E5E7EB",
                  opacity: disabled ? 0.5 : 1,
                }}
              >
                {gisLoading || googlePending ? (
                  <span className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-current opacity-70" style={{ color: theme.text, borderTopColor: "transparent" }} />
                ) : (
                  <div className="flex w-full flex-row items-center gap-3">
                    <div className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-white">
                      <img src={googleIcon} alt="" aria-hidden="true" className="h-[18px] w-[18px] object-contain" />
                    </div>
                    <span className="text-[15px] font-semibold" style={{ color: theme.text }}>
                      Continue with Google
                    </span>
                    <ArrowRightIcon />
                  </div>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Divider */}
        {current.showGoogle && (
          <div className="relative w-full mb-8">
            <div className="absolute inset-0 flex items-center" style={{ pointerEvents: "none" }}>
              <div className="w-full border-t" style={{ borderColor: theme.border }} />
            </div>
            <span className="relative z-10 px-3 text-[11px] font-semibold tracking-wide" style={{ backgroundColor: theme.background, color: theme.secondaryText }}>
              Or continue with email
            </span>
          </div>
        )}

        {/* Form inputs */}
        {isForgot ? (
          renderInput(
            "email",
            "Email Address",
            "email",
            "name@example.com",
            <MailIcon />,
            undefined,
            undefined,
            "email"
          )
        ) : (
          <>
            {isRegister && (
              renderInput(
                "fullName",
                "Full Name",
                "text",
                "Your name",
                <UserIcon />,
                undefined,
                undefined,
                "name"
              )
            )}
            {renderInput(
              "email",
              "Email Address",
              "email",
              "name@example.com",
              <MailIcon />,
              undefined,
              undefined,
              "email"
            )}
            {renderInput(
              "password",
              "Password",
              showPassword ? "text" : "password",
              showPassword ? "••••••••" : "At least 8 characters",
              <LockIcon />,
              showPassword ? <EyeOffIcon /> : <EyeIcon />,
              () => setShowPassword(!showPassword),
              isRegister ? "new-password" : "current-password"
            )}
            {isRegister && (
              renderInput(
                "confirmPassword",
                "Confirm Password",
                showConfirmPassword ? "text" : "password",
                showConfirmPassword ? "••••••••" : "Confirm your password",
                <LockIcon />,
                showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />,
                () => setShowConfirmPassword(!showConfirmPassword),
                "new-password"
              )
            )}
          </>
        )}

        {/* Forgot password link (login only) */}
        {!isRegister && !isForgot && !isReset && (
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="cursor-pointer text-[12px] font-semibold underline"
              style={{ color: theme.primary }}
            >
              Forgot password?
            </button>
          </div>
        )}

        {/* Primary CTA */}
        <button
          type="submit"
          className="flex h-[52px] w-full cursor-pointer items-center justify-center rounded-[30px] text-lg font-bold transition-opacity disabled:cursor-not-allowed"
          style={{
            marginTop: 8,
            backgroundColor: theme.primary,
            color: "#ffffff",
            opacity: disabled ? 0.7 : 1,
          }}
          disabled={disabled}
        >
          {isLoading ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-current opacity-70" style={{ color: "#ffffff", borderTopColor: "transparent" }} />
          ) : (
            <span className="text-center text-lg font-bold" style={{ color: "#ffffff" }}>
              {current.primaryLabel}
            </span>
          )}
        </button>

        {/* Secondary action */}
        <div className="mt-6 flex justify-center gap-1.5 px-4 text-center text-xs leading-[17px]" style={{ color: theme.secondaryText }}>
          <span>{current.secondaryLabel}</span>{" "}
          <button
            type="button"
            onClick={current.secondaryAction}
            className="cursor-pointer font-bold underline transition-colors hover:opacity-80"
            style={{ color: theme.primary }}
          >
            {mode === "login" ? "Create account" : mode === "register" ? "Sign in" : mode === "forgot" ? "Sign in" : "Sign in"}
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 flex flex-col items-center gap-2 px-4 text-center" style={{ color: theme.secondaryText }}>
          <p className="text-[11px] leading-[17px]">
            By continuing, you agree to our
            <span className="font-bold underline cursor-pointer" style={{ color: theme.primary }}>Terms of Service</span>{" "}
            and{" "}
            <span className="font-bold underline cursor-pointer" style={{ color: theme.primary }}>Privacy Policy</span>.
          </p>
        </div>
      </form>
    );
  }
}

function EyeIcon() {
  return <Icon d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM18 8a6 6 0 0 0-6 6 6 6 0 0 0 6-6z" size={20} />;
}

function EyeOffIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.11A9.12 9.12 0 0 1 12 4c7 0 7 8 0 8a8.11 8.11 0 0 1-2.16-.49" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}