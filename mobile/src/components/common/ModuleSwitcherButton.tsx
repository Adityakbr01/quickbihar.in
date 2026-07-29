import React, { useCallback, useRef } from "react";
import { Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { useModuleStore } from "@/src/store/useModuleStore";

export const ModuleSwitcherButton: React.FC = () => {
  const theme = useTheme();
  const router = useRouter();
  const { currentModule, switchModule } = useModuleStore();
  const isNavigating = useRef(false);

  const handlePress = useCallback(() => {
    if (isNavigating.current) return;
    isNavigating.current = true;

    // Fire haptics in background
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    // Defer heavy route replacement to next animation frame for 60 FPS press animation
    requestAnimationFrame(() => {
      const nextModule = switchModule();
      if (nextModule?.route) {
        router.replace(nextModule.route as any);
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
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: theme.tertiaryBackground,
          borderColor: currentModule.badgeColor + "80",
        },
        pressed && styles.pressed,
      ]}
    >
      <Ionicons name="swap-horizontal" size={20} color={theme.text} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.6,
    transform: [{ scale: 0.9 }],
  },
});
