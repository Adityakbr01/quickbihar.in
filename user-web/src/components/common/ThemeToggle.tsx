import React, { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";

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
  const knobStyle = {
    transform: [{ translateX: (value ? 1 : 0) * (TRACK_W - KNOB - PAD * 2) }],
    transition: "transform 0.2s ease-out",
  };

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
      <View style={[styles.knob, knobStyle]} />
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
