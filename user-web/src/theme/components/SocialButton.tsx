import React, { useState } from "react";

import { AppleIcon, GoogleIcon } from "@/src/components/common/BrandIcons";
import * as Haptics from "@/lib/haptics";
import { useTheme } from "../Provider/ThemeProvider";

interface SocialButtonProps {
  provider: "google" | "apple";
  onPress: () => void;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export const SocialButton: React.FC<SocialButtonProps> = ({
  provider,
  onPress,
  disabled = false,
  style,
}) => {
  const theme = useTheme() as any;
  const [pressed, setPressed] = useState(false);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onPress) {
      onPress();
    }
  };

  const bg =
    provider === "google"
      ? theme.secondaryBackground
      : theme.text === "#ffffff"
        ? "#ffffff"
        : "#000000";
  const fg =
    provider === "google"
      ? theme.text
      : theme.text === "#ffffff"
        ? "#000000"
        : "#ffffff";

  return (
    <div
      className="flex-1 transition-transform duration-150"
      style={{ ...style, transform: pressed ? "scale(0.95)" : undefined }}
    >
      <button
        type="button"
        onClick={handlePress}
        onMouseDown={() => !disabled && setPressed(true)}
        onMouseUp={() => !disabled && setPressed(false)}
        onMouseLeave={() => !disabled && setPressed(false)}
        disabled={disabled}
        aria-label={`${provider === "google" ? "Google" : "Apple"} Login`}
        className="flex h-[50px] w-full cursor-pointer items-center justify-center rounded-full border-[1.5px]"
        style={{
          backgroundColor: bg,
          borderColor: provider === "google" ? theme.border : "transparent",
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <span className="text-xl font-bold" style={{ color: fg }}>
          {provider === "google" ? (
            <GoogleIcon size={24} />
          ) : (
            <AppleIcon
              size={24}
              color={theme.text === "#ffffff" ? "#000000" : "#ffffff"}
            />
          )}
        </span>
      </button>
    </div>
  );
};
