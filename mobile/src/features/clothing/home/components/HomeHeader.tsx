import React, { useRef } from "react";
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { BREAKPOINTS } from "@/src/utils/responsive";
import LazyLottie from "@/src/components/common/LazyLottie";
import * as Haptics from "expo-haptics";
import { SharedValue } from "react-native-reanimated";

import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { homeStyles as styles } from "../style/homeStyles";
import { useNotifications } from "@/src/features/common/notification/hooks/useNotifications";
// import { ModuleSwitcherButton } from "@/src/components/common/ModuleSwitcherButton";

const bellLottie = require("@/assets/lottie/Notification Bell.json");

interface HomeHeaderProps {
  menuOpen?: SharedValue<number>;
  toggleMenu?: () => void;
}

const HomeHeader: React.FC<HomeHeaderProps> = () => {
  const isWeb = Platform.OS === "web";
  const { width } = useWindowDimensions();
  const theme = useTheme();
  const router = useRouter();

  // Hooks must run unconditionally — before any early return.
  const { data: notifications = [] } = useNotifications();
  const lottieRef = useRef<any>(null);

  // Desktop web uses the custom top DesktopNavbar — hide the mobile
  // brand row there so we don't render two headers. Mobile untouched.
  if (isWeb && width >= BREAKPOINTS.desktopMin) return null;

  const hasUnread = notifications.some((n) => !n.isRead);

  const webPressableStyle = isWeb ? ({ cursor: "pointer" } as any) : {};

  return (
    <View style={styles.header}>
      <View style={localStyles.headerLeftContainer}>
        <Text
          accessibilityRole="header"
          aria-level={1}
          {...({ role: "heading" } as any)}
          style={[localStyles.brandText, { color: theme.text }]}
        >
          Quick Bihar
        </Text>
      </View>

      <View style={styles.headerRight}>
        {/* <ModuleSwitcherButton /> */}

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/account/notifications");
          }}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          {...({ title: "View notifications" } as any)}
          style={[
            styles.notifBtn,
            { backgroundColor: theme.tertiaryBackground },
            webPressableStyle,
          ]}
        >
          <LazyLottie
            ref={lottieRef}
            key={theme.text + "_" + hasUnread}
            source={bellLottie}
            autoPlay={hasUnread}
            loop={hasUnread}
            resizeMode="cover"
            style={[
              localStyles.bellLottie,
              Platform.OS === 'web' && { filter: theme.text === '#ffffff' ? 'invert(1)' : 'none' } as any
            ]}
            colorFilters={
              theme.text === "#ffffff"
                ? [{ keypath: "**", color: "#ffffff" }]
                : []
            }
          />
          {hasUnread && (
            <View
              style={[
                styles.notifDot,
                { borderColor: theme.secondaryBackground, backgroundColor: '#FF3830' },
              ]}
            />
          )}
        </Pressable>
      </View>
    </View>
  );
};

const localStyles = StyleSheet.create({
  headerLeftContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  bellLottie: {
    width: 28,
    height: 28,
  },
  brandText: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.5,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-condensed',
  },
});

export default HomeHeader;
