import React from "react";
import { Pressable, StyleSheet, ViewStyle, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../Provider/ThemeProvider";
import ThemedText from "./ThemedText";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  style?: ViewStyle;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  checked,
  onChange,
  style,
}) => {
  const theme = useTheme() as any;
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.9);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const styles = StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 8,
    },
    iconContainer: {
      marginRight: 8,
    },
    label: {
      fontSize: 14,
      color: theme.text,
    },
  });

  return (
    <Pressable
      style={[styles.container, style]}
      onPress={() => onChange(!checked)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
    >
      <Animated.View style={[styles.iconContainer, animatedStyle]}>
        <Ionicons
          name={checked ? "checkbox" : "square-outline"}
          size={24}
          color={checked ? theme.primary : theme.secondaryText}
        />
      </Animated.View>
      <ThemedText style={styles.label}>{label}</ThemedText>
    </Pressable>
  );
};
