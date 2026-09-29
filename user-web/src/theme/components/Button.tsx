import React, { useState } from "react";
import * as Haptics from "@/lib/haptics";
import { useTheme } from "../Provider/ThemeProvider";
import ThemedText from "./ThemedText";


interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline";
  size?: "small" | "medium" | "large";
  loading?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
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
  const [pressed, setPressed] = useState(false);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onPress) {
      onPress();
    }
  };

  const sizeStyles = (() => {
    switch (size) {
      case "small":
        return { paddingTop: 8, paddingBottom: 8, paddingLeft: 16, paddingRight: 16, fontSize: 14 };
      case "medium":
        return { paddingTop: 10, paddingBottom: 10, paddingLeft: 20, paddingRight: 20, fontSize: 15 };
      case "large":
      default:
        return { paddingTop: 14, paddingBottom: 14, paddingLeft: 24, paddingRight: 24, fontSize: 16 };
    }
  })();

  const variantStyles: React.CSSProperties = (() => {
    switch (variant) {
      case "secondary":
        return {
          backgroundColor: theme.secondaryBackground,
          borderColor: theme.border,
          borderWidth: 1.5,
          borderStyle: "solid",
        };
      case "outline":
        return {
          backgroundColor: "transparent",
          borderColor: disabled || loading ? theme.border : theme.primary,
          borderWidth: 1.5,
          borderStyle: "solid",
        };
      case "primary":
      default:
        return {
          backgroundColor: theme.primary,
        };
    }
  })();

  const getTextColor = () => {
    if (variant === "secondary" || variant === "outline") {
      return disabled || loading ? theme.secondaryText : theme.text;
    }
    return "#ffffff";
  };

  return (
    <div
      className="transition-transform duration-150"
      style={{ ...style, transform: pressed ? "scale(0.97)" : undefined }}
    >
      <button
        type="button"
        onClick={handlePress}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onMouseLeave={() => setPressed(false)}
        disabled={disabled || loading}
        aria-label={accessibilityLabel || title}
        aria-description={accessibilityHint}
        className="flex w-full cursor-pointer items-center justify-center rounded-[25px]"
        style={{
          paddingTop: sizeStyles.paddingTop,
          paddingBottom: sizeStyles.paddingBottom,
          paddingLeft: sizeStyles.paddingLeft,
          paddingRight: sizeStyles.paddingRight,
          ...variantStyles,
          opacity: disabled || loading ? 0.6 : 1,
        }}
      >
        {loading ? (
          <span
            className="block h-5 w-5 animate-spin rounded-full border-2 border-t-transparent"
            style={{ borderColor: `${getTextColor()}40`, borderTopColor: getTextColor() }}
          />
        ) : (
          <ThemedText className="font-semibold" style={{ color: getTextColor(), fontSize: sizeStyles.fontSize }}>{title}</ThemedText>
        )}
      </button>
    </div>
  );
};
