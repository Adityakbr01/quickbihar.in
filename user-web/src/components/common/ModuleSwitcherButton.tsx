import React, { useCallback, useRef } from "react";
import { Pressable, StyleSheet, Text } from "@/components/primitives";
import { ArrowRight, Sparkles } from "lucide-react";
import * as Haptics from "@/lib/haptics";
import { useNavigate } from "react-router-dom";
import { replaceTo } from "@/src/utils/navigation";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { useModuleStore } from "@/src/store/useModuleStore";
import { APP_MODULES } from "@/src/constants/modules";

/**
 * Catalog switcher pill — shows WHERE the tap goes (next catalog's icon +
 * name), so users instantly understand it. One tap cycles
 * Clothing <-> Jewelry (Food hidden for now). Persists via useModuleStore.
 */
export const ModuleSwitcherButton: React.FC<{ compact?: boolean }> = ({
  compact = false,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { currentModule, setModule } = useModuleStore();
  const isNavigating = useRef(false);
  // Food module hidden for now — switcher cycles Clothing <-> Jewelry only.
  const visibleModules = APP_MODULES.filter((m) => m.id !== "food");
  const currentIndex = visibleModules.findIndex((m) => m.id === currentModule.id);
  const nextModule =
    visibleModules[(currentIndex + 1 + visibleModules.length) % visibleModules.length];
  const nextLabel = nextModule?.label ?? "next catalog";
  const NextIcon = nextModule?.iconName ?? Sparkles;

  const handlePress = useCallback(() => {
    if (isNavigating.current) return;
    isNavigating.current = true;

    // Fire haptics in background
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    // Defer heavy route replacement to next animation frame for 60 FPS press animation
    requestAnimationFrame(() => {
      setModule(nextModule.id);
      if (nextModule?.route) {
        replaceTo(navigate, nextModule.route as any);
      }

      setTimeout(() => {
        isNavigating.current = false;
      }, 300);
    });
  }, [navigate, setModule, nextModule]);

  return (
    <Pressable onPress={handlePress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={`Switch to ${nextLabel} catalog`}
      style={({ pressed }) => [
        styles.pill,
        {
          backgroundColor: theme.tertiaryBackground,
          borderColor: (nextModule?.badgeColor ?? theme.text) + "90",
          ...(compact ? { paddingHorizontal: 10, gap: 4 } : null),
        },
        pressed && styles.pressed,
      ]}
    >
      <NextIcon size={15} color={nextModule?.badgeColor ?? theme.text} />
      <Text style={[
          styles.label,
          {
            color: theme.text,
            fontFamily: "DMSans_500Medium",
            ...(compact ? { fontSize: 11 } : null),
          },
        ]}
        numberOfLines={1}
      >
        {nextLabel}
      </Text>
      <ArrowRight size={13} color={theme.tertiaryText} />
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
