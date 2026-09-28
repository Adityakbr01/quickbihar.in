import { Lock, ShieldCheck, Store, TriangleAlert, Zap } from "lucide-react";

import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Gradient } from "@/src/components/common/Gradient";
import * as Haptics from "@/lib/haptics";
import { useSafeAreaInsets } from "@/src/hooks/useSafeAreaInsets";
import { createAuthStyles } from "../styles/auth.style";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { useGoogleAuth } from "../hooks/useAuth";
import { GoogleSignInButton } from "../components/GoogleSignInButton";
import { APP_NAME } from "@/src/constants/app.constants";
import { useIsDesktop } from "@/src/utils/responsive";
import splashIcon from "@/assets/images/icons/splash-icon.png";

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
  const styles = createAuthStyles(theme);
  const isDesktop = useIsDesktop();
  const { height: windowHeight } = useWindowDimensions();
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
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <ScrollView style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View style={[
            localStyles.hero,
            { height: isDesktop ? 340 : compact ? 232 : 260 },
          ]}
        >
          <Gradient colors={["#211913", "#14110D", "#0E0C09"]}
            locations={[0, 0.55, 1]}
            style={StyleSheet.absoluteFill}
          />
          <Gradient colors={[`${GOLD}24`, `${GOLD}0A`, "transparent"]}
            locations={[0, 0.55, 1]}
            style={StyleSheet.absoluteFill}
          />

          <View
            style={[
              localStyles.heroMarkBlock,
              { paddingTop: compact ? 56 : 70 },
            ]}
          >
            <View style={localStyles.glowWrap}>
              <View style={[localStyles.glow, { backgroundColor: `${GOLD}14` }]}
              />
              <View style={localStyles.logoRing}>
                <img src={splashIcon} alt="QuickBihar logo" aria-label="QuickBihar logo" style={Object.assign({}, localStyles.logoImage, { objectFit: "contain" as const })} />
              </View>
            </View>
            <Text style={localStyles.heroEyebrow}>
              BIHAR'S OWN MARKETPLACE
            </Text>
          </View>
        </View>

        <View style={[
            localStyles.sheet,
            {
              backgroundColor: theme.background,
              paddingBottom: insets.bottom + 20,
              paddingTop: compact ? 20 : 28,
            },
            isDesktop && [
              localStyles.sheetDesktop,
              { borderColor: theme.border },
            ],
          ]}
        >
          <View style={localStyles.titleBlock}>
            <Text style={[
                localStyles.title,
                { color: theme.text, fontSize: compact ? 27 : 30 },
              ]}
            >
              Welcome to {APP_NAME}
            </Text>
            <Text style={[
                localStyles.subtitle,
                { color: theme.secondaryText, marginTop: compact ? 6 : 8 },
              ]}
            >
              One-tap sign in to shop faster, track orders and share reviews.
            </Text>
          </View>

          <View
            style={[
              localStyles.assuranceRow,
              {
                backgroundColor: theme.secondaryBackground,
                borderColor: theme.border,
                marginTop: compact ? 16 : 24,
              },
            ]}
          >
            {ASSURANCES.map((item, i) => (
              <View key={item.label}
                style={[
                  localStyles.assuranceCell,
                  compact && { paddingVertical: 12 },
                  i > 0 && {
                    borderLeftWidth: StyleSheet.hairlineWidth,
                    borderLeftColor: theme.border,
                  },
                ]}
              >
                <item.icon size={20} color={theme.primary} />
                <Text style={[localStyles.assuranceLabel, { color: theme.text }]}>
                  {item.label}
                </Text>
              </View>
            ))}
          </View>

          <View
            style={[localStyles.ctaBlock, compact && { marginTop: 16 }]}
          >
            {apiError && (
              <View style={styles.errorBanner}
                accessibilityRole="alert"
                accessibilityLiveRegion="assertive"
              >
                <TriangleAlert size={20} color="#fca5a5" />
                <Text style={styles.errorBannerText}>{apiError}</Text>
              </View>
            )}
            <GoogleSignInButton mode="signin"
              disabled={googlePending}
              onSuccess={(idToken) => {
                handleGoogleSuccess(idToken).catch(() => {
                  /* error shown via apiError */
                });
              }}
              onError={(msg) => setApiError(msg)}
            />
            <View style={[localStyles.secureRow, compact && { marginTop: 10 }]}>
              <Lock size={12} color={theme.secondaryText} />
              <Text style={[localStyles.secureText, { color: theme.secondaryText }]}
              >
                Secured by Google — we never see your password. New here? Your
                account is created automatically.
              </Text>
            </View>
          </View>

          <View
            style={[localStyles.termsBlock, compact && { marginTop: 16 }]}
          >
            <Text style={[localStyles.termsText, { color: theme.secondaryText }]}>
              By continuing, you agree to our Terms of Service and Privacy
              Policy.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const localStyles = StyleSheet.create({
  hero: {
    overflow: "hidden",
  },
  heroMarkBlock: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  glowWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    width: 148,
    height: 148,
    borderRadius: 74,
  },
  logoRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    borderColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0E0C09",
  },
  logoImage: {
    width: 52,
    height: 56,
    borderRadius: 12,
  },
  heroEyebrow: {
    marginTop: 12,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2.6,
    color: GOLD,
  },
  sheet: {
    flex: 1,
    marginTop: -28,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    ...Platform.select({
      web: { maxWidth: 520, width: "100%", alignSelf: "center" } as any,
      default: {},
    }),
  },
  sheetDesktop: {
    marginTop: -48,
    borderRadius: 24,
    borderWidth: 1,
    paddingBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 8,
  },
  titleBlock: {
    alignItems: "center",
  },
  title: {
    fontWeight: "900",
    letterSpacing: -0.6,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  assuranceRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  assuranceCell: {
    flex: 1,
    alignItems: "center",
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 6,
  },
  assuranceLabel: {
    fontSize: 11.5,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 15,
  },
  ctaBlock: {
    marginTop: 24,
    width: "100%",
  },
  secureRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 16,
  },
  secureText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
  },
  termsBlock: {
    alignItems: "center",
    marginTop: 24,
  },
  termsText: {
    fontSize: 11.5,
    lineHeight: 17,
    textAlign: "center",
    paddingHorizontal: 24,
  },
});
