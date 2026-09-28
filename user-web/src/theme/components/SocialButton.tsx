import React, { useState } from "react";
import { Pressable, StyleSheet, View, ViewStyle, Text } from "react-native";

import { AppleIcon, GoogleIcon } from "@/src/components/common/BrandIcons";
import * as Haptics from "@/lib/haptics";
import { useTheme } from "../Provider/ThemeProvider";

interface SocialButtonProps {
  provider: "google" | "apple";
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export const SocialButton: React.FC<SocialButtonProps> = ({
  provider,
  onPress,
  disabled = false,
  style,
}) => {
  const theme = useTheme() as any;
  const [pressed, setPressed] = useState(false);

  const handlePressIn = () => {
    setPressed(true);
  };

  const handlePressOut = () => {
    setPressed(false);
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onPress) {
      onPress();
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    button: {
      flex: 1,
      height: 50,
      borderRadius: 50,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor:
        provider === "google"
          ? theme.secondaryBackground
          : theme.text === "#ffffff"
            ? "#ffffff"
            : "#000000",
      borderWidth: 1.5,
      borderColor: provider === "google" ? theme.border : "transparent",
      opacity: disabled ? 0.5 : 1,
    },
    iconText: {
      fontSize: 20,
      fontWeight: "700",
      color:
        provider === "google"
          ? theme.text
          : theme.text === "#ffffff"
            ? "#000000"
            : "#ffffff",
    },
  });

  return (
    <View style={[style, styles.container, { transform: [{ scale: pressed ? 0.95 : 1 }], transition: "transform 0.15s ease-out" }]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={styles.button}
        accessibilityRole="button"
        accessibilityLabel={`${provider === "google" ? "Google" : "Apple"} Login`}
        accessibilityState={{ disabled }}
      >
        <Text style={styles.iconText}>
          {provider === "google" ? (
            <GoogleIcon size={24} />
          ) : (
            <AppleIcon
              size={24}
              color={theme.text === "#ffffff" ? "#000000" : "#ffffff"}
            />
          )}
        </Text>
      </Pressable>
    </View>
  );
};
