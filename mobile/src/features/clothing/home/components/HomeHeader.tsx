import React from "react";
import { Platform, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { BREAKPOINTS } from "@/src/utils/responsive";
import { SharedValue } from "react-native-reanimated";

import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { homeStyles as styles } from "../style/homeStyles";
import { ModuleSwitcherButton } from "@/src/components/common/ModuleSwitcherButton";

interface HomeHeaderProps {
  menuOpen?: SharedValue<number>;
  toggleMenu?: () => void;
}

const HomeHeader: React.FC<HomeHeaderProps> = () => {
  const isWeb = Platform.OS === "web";
  const { width } = useWindowDimensions();
  const theme = useTheme();

  // Desktop web uses the custom top DesktopNavbar — hide the mobile
  // brand row there so we don't render two headers. Mobile untouched.
  if (isWeb && width >= BREAKPOINTS.desktopMin) return null;

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
        <ModuleSwitcherButton />
      </View>
    </View>
  );
};

const localStyles = StyleSheet.create({
  headerLeftContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandText: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.5,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-condensed',
  },
});

export default HomeHeader;
