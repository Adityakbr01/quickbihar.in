import React from "react";
import { Pressable, StyleSheet, ViewStyle, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { SymbolView } from "expo-symbols";
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
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

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
    <Animated.View style={[animatedStyle, style, styles.container]}>
      <Pressable
        onPress={onPress}
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
            <Ionicons name="logo-google" size={24} color={theme.text} />
          ) : (
            <SymbolView
              name="applelogo"
              size={24}
              tintColor={theme.text === "#ffffff" ? "#000000" : "#ffffff"}
              fallback={
                <Ionicons
                  name="logo-apple"
                  size={24}
                  color={theme.text === "#ffffff" ? "#000000" : "#ffffff"}
                />
              }
            />
          )}
        </Text>
      </Pressable>
    </Animated.View>
  );
};
