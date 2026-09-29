import { Lock, ShieldCheck, Store, TriangleAlert, Zap } from "lucide-react";

import React, { useEffect, useState } from "react";
import { Gradient } from "@/src/components/common/Gradient";
import * as Haptics from "@/lib/haptics";
import { useSafeAreaInsets } from "@/src/hooks/useSafeAreaInsets";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { useGoogleAuth } from "../hooks/useAuth";
import { GoogleSignInButton } from "../components/GoogleSignInButton";
import { APP_NAME } from "@/src/constants/app.constants";
import { useIsDesktop } from "@/src/utils/responsive";
import { cn } from "@/src/lib/utils";
import splashIcon from "@/assets/images/icons/splash-icon.webp";

/**
 * Auth screen (native) — Google one-tap only. Web uses auth.screen.web.tsx.
 *
 * One unified design: calm dark hero (logo medallion + gold eyebrow,
 * parked ~10% above centre) with a sheet overlapping it — white in
 * light mode, dark surface in dark mode. Compact rhythm on short
 * screens so the sheet never expands into a scroll.
 */
const GOLD = "#C9A05A";

const ASSURANCES = [
  { icon: Zap, label: "Express delivery" },
  { icon: ShieldCheck, label: "100% genuine" },
  { icon: Store, label: "Local stores" },
];

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme() as any;
  const isDesktop = useIsDesktop();
  const [windowHeight, setWindowHeight] = useState(() =>
    typeof window !== "undefined" ? window.innerHeight : 800,
  );
  useEffect(() => {
    const onResize = () => setWindowHeight(window.innerHeight);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const compact = windowHeight < 740;
  const [apiError, setApiError] = useState<string | null>(null);

  const { mutate: googleAuth, isPending: googlePending } = useGoogleAuth();

  const handleGoogleSuccess = async (idToken: string) => {
    setApiError(null);
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
    <div
      className="flex min-h-dvh w-full flex-col"
      style={{ backgroundColor: theme.background }}
    >
      <div className="flex flex-1 flex-col overflow-auto">
        <section
          className="relative w-full overflow-hidden"
          style={{ height: isDesktop ? 340 : compact ? 232 : 260 }}
        >
          <Gradient
            colors={["#211913", "#14110D", "#0E0C09"]}
            locations={[0, 0.55, 1]}
            style={{ position: "absolute", inset: 0 }}
          />
          <Gradient
            colors={[`${GOLD}24`, `${GOLD}0A`, "transparent"]}
            locations={[0, 0.55, 1]}
            style={{ position: "absolute", inset: 0 }}
          />

          <div
            className="relative flex flex-1 flex-col items-center justify-start"
            style={{ paddingTop: compact ? 56 : 70 }}
          >
            <div className="relative flex items-center justify-center">
              <div
                className="absolute h-[148px] w-[148px] rounded-full"
                style={{ backgroundColor: `${GOLD}14` }}
              />
              <div
                className="flex h-[72px] w-[72px] items-center justify-center rounded-full"
                style={{
                  border: `1.5px solid ${GOLD}`,
                  backgroundColor: "#0E0C09",
                }}
              >
                <img
                  src={splashIcon}
                  alt="QuickBihar logo"
                  aria-label="QuickBihar logo"
                  className="h-[56px] w-[52px] rounded-xl object-contain"
                />
              </div>
            </div>
            <p
              className="mt-3 text-[11px] font-extrabold"
              style={{ color: GOLD, letterSpacing: 2.6 }}
            >
              BIHAR'S OWN MARKETPLACE
            </p>
          </div>
        </section>

        <main
          className={cn(
            "mx-auto flex w-full max-w-[520px] flex-1 flex-col rounded-t-[28px] px-6",
            isDesktop && "rounded-3xl border shadow-2xl",
          )}
          style={{
            backgroundColor: theme.background,
            borderColor: theme.border,
            marginTop: isDesktop ? -48 : -28,
            paddingBottom: isDesktop ? 32 : insets.bottom + 20,
            paddingTop: compact ? 20 : 28,
          }}
        >
          <div className="flex flex-col items-center">
            <h1
              className="text-center font-black tracking-tight"
              style={{
                color: theme.text,
                fontSize: compact ? 27 : 30,
                letterSpacing: -0.6,
              }}
            >
              Welcome to {APP_NAME}
            </h1>
            <p
              className="px-2 text-center text-sm leading-[21px]"
              style={{
                color: theme.secondaryText,
                marginTop: compact ? 6 : 8,
              }}
            >
              One-tap sign in to shop faster, track orders and share reviews.
            </p>
          </div>

          <div
            className="grid grid-cols-3 overflow-hidden rounded-2xl border"
            style={{
              backgroundColor: theme.secondaryBackground,
              borderColor: theme.border,
              marginTop: compact ? 16 : 24,
            }}
          >
            {ASSURANCES.map((item, i) => (
              <div
                key={item.label}
                className="flex flex-1 flex-col items-center gap-2 px-1.5"
                style={{
                  paddingTop: compact ? 12 : 16,
                  paddingBottom: compact ? 12 : 16,
                  ...(i > 0
                    ? { borderLeft: `1px solid ${theme.border}` }
                    : null),
                }}
              >
                <item.icon size={20} color={theme.primary} />
                <span
                  className="text-center text-[11.5px] leading-[15px] font-bold"
                  style={{ color: theme.text }}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          <div
            className="w-full"
            style={{ marginTop: compact ? 16 : 24 }}
          >
            {apiError && (
              <div
                role="alert"
                aria-live="assertive"
                className="mb-5 flex flex-row items-center gap-2.5 rounded-xl border p-3.5"
                style={{
                  backgroundColor: "rgba(239, 68, 68, 0.15)",
                  borderColor: "rgba(239, 68, 68, 0.5)",
                }}
              >
                <TriangleAlert size={20} color="#fca5a5" />
                <span
                  className="flex-1 text-sm font-medium"
                  style={{ color: theme.error }}
                >
                  {apiError}
                </span>
              </div>
            )}
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
            <div
              className="flex flex-row items-start justify-center gap-1.5 px-4"
              style={{ marginTop: compact ? 10 : 14 }}
            >
              <Lock size={12} color={theme.secondaryText} />
              <p
                className="flex-1 text-center text-xs leading-[17px]"
                style={{ color: theme.secondaryText }}
              >
                Secured by Google — we never see your password. New here? Your
                account is created automatically.
              </p>
            </div>
          </div>

          <div
            className="flex items-center justify-center"
            style={{ marginTop: compact ? 16 : 24 }}
          >
            <p
              className="px-6 text-center text-[11.5px] leading-[17px]"
              style={{ color: theme.secondaryText }}
            >
              By continuing, you agree to our Terms of Service and Privacy
              Policy.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
