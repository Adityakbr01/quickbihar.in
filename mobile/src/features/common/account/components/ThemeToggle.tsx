import React, { useEffect } from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";

// iOS switch metrics — fixed so it renders identically on Android, iOS, web.
const TRACK_W = 51;
const TRACK_H = 31;
const KNOB = 27;
const PAD = 2;

interface ThemeToggleProps {
  value: boolean;
  onToggle: () => void;
}

/**
 * iOS-style toggle. Custom-built (not RN Switch) so Android, iOS and web
 * render pixel-identical. ON = iOS green, OFF = theme well color.
 */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({ value, onToggle }) => {
  const theme = useTheme() as any;
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(value ? 1 : 0, { duration: 200 });
  }, [value, progress]);

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * (TRACK_W - KNOB - PAD * 2) }],
  }));

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel="Toggle dark mode"
      style={[
        styles.track,
        { backgroundColor: value ? "#34C759" : theme.isDark ? "#3A3A3C" : "#E9E9EA" },
      ]}
    >
      <Animated.View style={[styles.knob, knobStyle]} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  track: {
    width: TRACK_W,
    height: TRACK_H,
    borderRadius: TRACK_H / 2,
    padding: PAD,
    justifyContent: "center",
  },
  knob: {
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 3,
  },
});
