import React, { useEffect, useRef, useState } from "react";
import { useGoogleAuth } from "../hooks/useAuth";
import { APP_NAME } from "@/src/constants/app.constants";
import splashIcon from "@/assets/images/icons/splash-icon.png";
import googleIcon from "@/assets/svg/google-icon-logo.svg";

/**
 * Auth screen — WEB ONLY (Vite resolves *.web.tsx first, so native keeps
 * using auth.screen.tsx). Pure React + Tailwind, zero React Native.
 *
 * Google one-tap only. New users are registered automatically
 * server-side; legacy OTP users hit forced email-capture (in the hook).
 *
 * One unified design: calm dark hero (logo medallion + gold eyebrow,
 * parked ~10% above centre) with a sheet overlapping it — white in
 * light mode, dark surface in dark mode. Compact rhythm on short
 * screens so the sheet never expands into a scroll on mobile.
 */

const GOLD = "#C9A05A";
const THEME_KEY = "quickbihar-theme-mode-v1";
const GIS_SRC = "https://accounts.google.com/gsi/client";
const WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  "183149129805-vf8pkq6h066lcapjanjv1271g36jvij4.apps.googleusercontent.com";

const PALETTES = {
  light: {
    bg: "#ffffff",
    text: "#000000",
    subText: "#86868b",
    card: "#f9f9f9",
    border: "#e5e5e7",
    primary: "#80c314",
    error: "#ff3b30",
    googleBtnBg: "#FFFFFF",
    googleBtnBorder: "#E5E7EB",
  },
  dark: {
    bg: "#0f0f0f",
    text: "#ffffff",
    subText: "#8e8e93",
    card: "#1c1c1e",
    border: "#424245",
    primary: "#80c314",
    error: "#ff453a",
    googleBtnBg: "rgba(255,255,255,0.08)",
    googleBtnBorder: "rgba(255,255,255,0.18)",
  },
} as const;

type Palette = (typeof PALETTES)[keyof typeof PALETTES];

function useThemePalette(): { palette: Palette; isDark: boolean } {
  const read = (): boolean => {
    if (typeof window === "undefined") return true;
    try {
      return window.localStorage?.getItem(THEME_KEY) !== "light";
    } catch {
      return true;
    }
  };
  const [isDark, setIsDark] = useState(read);
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === THEME_KEY) setIsDark(e.newValue !== "light");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return { palette: isDark ? PALETTES.dark : PALETTES.light, isDark };
}

function useViewport() {
  const read = () => ({
    w: typeof window === "undefined" ? 390 : window.innerWidth,
    h: typeof window === "undefined" ? 844 : window.innerHeight,
  });
  const [vp, setVp] = useState(read);
  useEffect(() => {
    const onResize = () => setVp(read());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return vp;
}

/* ── Inline stroke icons (lucide-style, currentColor) ── */
const Icon = ({
  d,
  size = 20,
  children,
}: {
  d?: string;
  size?: number;
  children?: React.ReactNode;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {d && <path d={d} />}
    {children}
  </svg>
);

const BoltIcon = ({ size = 20 }: { size?: number }) => (
  <Icon size={size} d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12L13 2z" />
);
const ShieldCheckIcon = ({ size = 20 }: { size?: number }) => (
  <Icon size={size}>
    <path d="M12 3l7 2.8v5.4c0 4.4-2.9 7.3-7 8.8-4.1-1.5-7-4.4-7-8.8V5.8L12 3z" />
    <path d="M9.3 11.8l2 2 3.6-4" />
  </Icon>
);
const StoreIcon = ({ size = 20 }: { size?: number }) => (
  <Icon size={size}>
    <path d="M4 9l1.2-4.2h13.6L20 9" />
    <path d="M4 9h16v10H4z" />
    <path d="M9.5 19v-4.5h5V19" />
  </Icon>
);
const LockIcon = () => (
  <svg
    width={12}
    height={12}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    className="mt-[2px] shrink-0"
  >
    <path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5zm-3 8V7a3 3 0 1 1 6 0v3H9z" />
  </svg>
);
const ChevronIcon = () => (
  <svg
    width={16}
    height={16}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className="ml-auto opacity-60"
  >
    <path d="M9 5l7 7-7 7" />
  </svg>
);
const AlertIcon = () => (
  <svg
    width={20}
    height={20}
    viewBox="0 0 24 24"
    fill="none"
    stroke="#fca5a5"
    strokeWidth={1.8}
    strokeLinecap="round"
    aria-hidden="true"
    className="shrink-0"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5V13" />
    <circle cx="12" cy="16.4" r="0.4" fill="#fca5a5" />
  </svg>
);

const ASSURANCES = [
  { label: "Express delivery", Icon: BoltIcon },
  { label: "100% genuine", Icon: ShieldCheckIcon },
  { label: "Local stores", Icon: StoreIcon },
];

export default function AuthScreen() {
  const { palette: t } = useThemePalette();
  const { w, h } = useViewport();
  const isDesktop = w >= 1024;
  const compact = h < 740;
  const [apiError, setApiError] = useState<string | null>(null);
  const [gisLoading, setGisLoading] = useState(false);
  const gisMountRef = useRef<HTMLDivElement>(null);
  const [gisReady, setGisReady] = useState(false);

  const { mutate: googleAuth, isPending: googlePending } = useGoogleAuth();

  const handleGoogleSuccess = (idToken: string) => {
    setApiError(null);
    googleAuth(
      { idToken, client: "mobile" },
      {
        onSuccess: () => {},
        onError: (err: any) => {
          setApiError(err?.message || "Google sign-in failed.");
        },
      }
    );
  };

  /* ── Google Identity Services ── */
  useEffect(() => {
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
      setApiError("Could not load Google Sign-In. Check your network.");
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
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          width: 320,
        });
      }
    } catch (err: any) {
      console.warn("[AuthScreen] GIS init failed:", err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gisReady]);

  const handleGooglePress = () => {
    if (gisLoading || googlePending) return;
    const googleAuthApi = (window as any).google?.accounts?.id;
    if (!googleAuthApi) {
      setApiError("Google Sign-In is initializing. Please tap again.");
      return;
    }
    setGisLoading(true);
    try {
      const mount = gisMountRef.current;
      const button = mount?.querySelector("[role='button']") as HTMLElement | null;
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

  const heroH = isDesktop ? 340 : compact ? 232 : 260;

  return (
    <div
      className="flex min-h-dvh w-full flex-col"
      style={{ backgroundColor: t.bg }}
    >
      {/* ── Hero ── */}
      <section
        className="relative w-full overflow-hidden"
        style={{ height: heroH }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#211913_0%,#14110D_55%,#0E0C09_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(201,160,90,0.14),rgba(201,160,90,0.04)_55%,transparent_100%)]" />

        <div
          className="auth-rise relative flex h-full flex-col items-center"
          style={{
            paddingTop: compact ? 56 : 70,
            animationDelay: "100ms",
          }}
        >
          <div className="relative flex items-center justify-center">
            <div
              className="absolute h-[148px] w-[148px] rounded-full"
              style={{ backgroundColor: `${GOLD}14` }}
            />
            <div
              className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#0E0C09]"
              style={{ border: `1.5px solid ${GOLD}` }}
            >
              <img
                src={splashIcon}
                alt="QuickBihar logo"
                className="h-[56px] w-[52px] rounded-xl"
              />
            </div>
          </div>
          <p
            className="mt-3 text-[11px] font-extrabold"
            style={{ color: GOLD, letterSpacing: "0.24em" }}
          >
            BIHAR'S OWN MARKETPLACE
          </p>
        </div>
      </section>

      {/* ── Sheet ── */}
      <main
        className={[
          "mx-auto -mt-7 w-full max-w-[520px] flex-1 rounded-t-[28px] px-6",
          isDesktop
            ? "-mt-12 rounded-3xl border pb-8 shadow-2xl"
            : "pb-5",
        ].join(" ")}
        style={{
          backgroundColor: t.bg,
          borderColor: t.border,
          paddingTop: compact ? 20 : 28,
          paddingBottom: isDesktop ? 32 : 20,
        }}
      >
        <div className="auth-rise text-center" style={{ animationDelay: "220ms" }}>
          <h1
            className="font-black tracking-tight"
            style={{
              color: t.text,
              fontSize: compact ? 27 : 30,
              letterSpacing: "-0.6px",
            }}
          >
            Welcome to {APP_NAME}
          </h1>
          <p
            className="px-2 text-center text-sm leading-6"
            style={{ color: t.subText, marginTop: compact ? 6 : 8 }}
          >
            One-tap sign in to shop faster, track orders and share reviews.
          </p>
        </div>

        <div
          className="auth-rise grid grid-cols-3 overflow-hidden rounded-2xl border"
          style={{
            backgroundColor: t.card,
            borderColor: t.border,
            marginTop: compact ? 16 : 24,
            animationDelay: "320ms",
          }}
        >
          {ASSURANCES.map(({ label, Icon: ItemIcon }, i) => (
            <div
              key={label}
              className="flex flex-col items-center gap-2 px-1.5"
              style={{
                paddingTop: compact ? 12 : 16,
                paddingBottom: compact ? 12 : 16,
                borderLeft: i > 0 ? `0.5px solid ${t.border}` : undefined,
              }}
            >
              <span style={{ color: t.primary }}>
                <ItemIcon />
              </span>
              <span
                className="text-center text-[11.5px] font-bold leading-[15px]"
                style={{ color: t.text }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>

        <div
          className="auth-rise w-full"
          style={{ marginTop: compact ? 16 : 24, animationDelay: "420ms" }}
        >
          {apiError && (
            <div
              role="alert"
              className="mb-5 flex items-center gap-2.5 rounded-xl border p-3.5 text-sm font-medium"
              style={{
                backgroundColor: "rgba(239,68,68,0.15)",
                borderColor: "rgba(239,68,68,0.5)",
                color: t.error,
              }}
            >
              <AlertIcon />
              <span className="flex-1">{apiError}</span>
            </div>
          )}

          {/* Real GIS button sits transparently on top for direct taps */}
          <div className="relative w-full">
            <div
              ref={gisMountRef}
              className="absolute inset-0 z-10 flex items-center justify-center overflow-hidden"
              style={{ opacity: 0.001 }}
            />
            <button
              type="button"
              onClick={handleGooglePress}
              disabled={gisLoading || googlePending}
              className="flex min-h-[52px] w-full cursor-pointer items-center gap-3 rounded-xl border px-[18px] py-3.5 text-left transition-opacity disabled:opacity-70"
              style={{
                backgroundColor: t.googleBtnBg,
                borderColor: t.googleBtnBorder,
              }}
            >
              {gisLoading || googlePending ? (
                <span
                  className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-current opacity-70"
                  style={{
                    color: t.text,
                    borderTopColor: "transparent",
                  }}
                />
              ) : (
                <>
                  <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-white">
                    <img
                      src={googleIcon}
                      alt=""
                      className="h-[18px] w-[18px]"
                    />
                  </span>
                  <span
                    className="text-[15px] font-semibold"
                    style={{ color: t.text }}
                  >
                    Continue with Google
                  </span>
                  <ChevronIcon />
                </>
              )}
            </button>
          </div>

          <div
            className="flex justify-center gap-1.5 px-4 text-center text-xs leading-[17px]"
            style={{ marginTop: compact ? 10 : 14, color: t.subText }}
          >
            <LockIcon />
            <p>
              Secured by Google — we never see your password. New here? Your
              account is created automatically.
            </p>
          </div>
        </div>

        <div
          className="auth-rise"
          style={{ marginTop: compact ? 16 : 24, animationDelay: "520ms" }}
        >
          <p
            className="px-6 text-center text-[11.5px] leading-[17px]"
            style={{ color: t.subText }}
          >
            By continuing, you agree to our Terms of Service and Privacy
            Policy.
          </p>
        </div>
      </main>
    </div>
  );
}
