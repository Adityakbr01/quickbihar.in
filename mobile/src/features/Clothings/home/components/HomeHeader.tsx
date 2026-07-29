import React, { useRef } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import * as Haptics from "expo-haptics";
import { SharedValue } from "react-native-reanimated";

import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { homeStyles as styles } from "../style/homeStyles";
import { useNotifications } from "@/src/features/Clothings/notification/hooks/useNotifications";
import { ModuleSwitcherButton } from "@/src/components/common/ModuleSwitcherButton";

const bellLottie = require("@/assets/lottie/Notification Bell.json");

interface HomeHeaderProps {
  menuOpen?: SharedValue<number>;
  toggleMenu?: () => void;
}

const HomeHeader: React.FC<HomeHeaderProps> = () => {
  const isWeb = Platform.OS === "web";
  const theme = useTheme();
  const router = useRouter();

  const { data: notifications = [] } = useNotifications();
  const hasUnread = notifications.some((n) => !n.isRead);
  const lottieRef = useRef<LottieView>(null);

  const webPressableStyle = isWeb ? ({ cursor: "pointer" } as any) : {};

  return (
    <View style={styles.header}>
      <View style={localStyles.headerLeftContainer}>
        <Text style={[localStyles.brandText, { color: theme.text }]}>
          Quick Bihar
        </Text>
      </View>

      <View style={styles.headerRight}>
        <ModuleSwitcherButton />

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/account/notifications");
          }}
          style={[
            styles.notifBtn,
            { backgroundColor: theme.tertiaryBackground },
            webPressableStyle,
          ]}
        >
          <LottieView
            ref={lottieRef}
            key={theme.text + "_" + hasUnread}
            source={bellLottie}
            autoPlay={hasUnread}
            loop={hasUnread}
            resizeMode="cover"
            renderMode="SOFTWARE"
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
    width: 48,
    height: 48,
  },
  brandText: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.5,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-condensed',
  },
});

export default HomeHeader;
