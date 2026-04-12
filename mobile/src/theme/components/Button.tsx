import React from "react";
import {
  Pressable,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "../Provider/ThemeProvider";
import ThemedText from "./ThemedText";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline";
  size?: "small" | "medium" | "large";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "large",
  loading = false,
  disabled = false,
  style,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const theme = useTheme() as any;
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.97);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return {
          paddingVertical: 8,
          paddingHorizontal: 16,
          fontSize: 14,
        };
      case "medium":
        return {
          paddingVertical: 10,
          paddingHorizontal: 20,
          fontSize: 15,
        };
      case "large":
      default:
        return {
          paddingVertical: 14,
          paddingHorizontal: 24,
          fontSize: 16,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  const getVariantStyles = () => {
    switch (variant) {
      case "secondary":
        return {
          backgroundColor: theme.secondaryBackground,
          borderColor: theme.border,
          borderWidth: 1.5,
        };
      case "outline":
        return {
          backgroundColor: "transparent",
          borderColor: disabled || loading ? theme.border : theme.primary,
          borderWidth: 1.5,
        };
      case "primary":
      default:
        return {
          backgroundColor: theme.primary,
        };
    }
  };

  const getTextColor = () => {
    if (variant === "secondary" || variant === "outline") {
      return disabled || loading ? theme.secondaryText : theme.text;
    }
    return "#ffffff";
  };

  const styles = StyleSheet.create({
    button: {
      borderRadius: 25,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: sizeStyles.paddingVertical,
      paddingHorizontal: sizeStyles.paddingHorizontal,
      ...getVariantStyles(),
      opacity: disabled || loading ? 0.6 : 1,
    },
    text: {
      color: getTextColor(),
      fontSize: sizeStyles.fontSize,
      fontWeight: "600",
    },
  });

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={styles.button}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || title}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: disabled || loading }}
      >
        {loading ? (
          <ActivityIndicator color={getTextColor()} size="small" />
        ) : (
          <ThemedText style={styles.text}>{title}</ThemedText>
        )}
      </Pressable>
    </Animated.View>
  );
};
