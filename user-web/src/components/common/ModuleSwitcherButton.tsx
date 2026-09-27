import React, { useCallback, useRef } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { useModuleStore } from "@/src/store/useModuleStore";
import { APP_MODULES } from "@/src/constants/modules";

/**
 * Catalog switcher pill — shows WHERE the tap goes (next catalog's icon +
 * name), so users instantly understand it. One tap cycles
 * Clothing → Jewelry → Food. Persists via useModuleStore.
 */
export const ModuleSwitcherButton: React.FC = () => {
  const theme = useTheme();
  const router = useRouter();
  const { currentModule, switchModule } = useModuleStore();
  const isNavigating = useRef(false);
  const currentIndex = APP_MODULES.findIndex((m) => m.id === currentModule.id);
  const nextModule = APP_MODULES[(currentIndex + 1) % APP_MODULES.length];
  const nextLabel = nextModule?.label ?? "next catalog";

  const handlePress = useCallback(() => {
    if (isNavigating.current) return;
    isNavigating.current = true;

    // Fire haptics in background
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    // Defer heavy route replacement to next animation frame for 60 FPS press animation
    requestAnimationFrame(() => {
      const next = switchModule();
      if (next?.route) {
        router.replace(next.route as any);
      }

      setTimeout(() => {
        isNavigating.current = false;
      }, 300);
    });
  }, [router, switchModule]);

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={`Switch to ${nextLabel} catalog`}
      style={({ pressed }) => [
        styles.pill,
        {
          backgroundColor: theme.tertiaryBackground,
          borderColor: (nextModule?.badgeColor ?? theme.text) + "90",
        },
        pressed && styles.pressed,
      ]}
    >
      <Ionicons
        name={(nextModule?.iconName ?? "sparkles-outline") as any}
        size={15}
        color={nextModule?.badgeColor ?? theme.text}
      />
      <Text
        style={[
          styles.label,
          { color: theme.text, fontFamily: "DMSans_500Medium" },
        ]}
        numberOfLines={1}
      >
        {nextLabel}
      </Text>
      <Ionicons name="arrow-forward" size={13} color={theme.tertiaryText} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 19,
    borderWidth: 1.5,
  },
  label: {
    fontSize: 12,
    letterSpacing: 0.3,
  },
  pressed: {
    opacity: 0.6,
    transform: [{ scale: 0.95 }],
  },
});
