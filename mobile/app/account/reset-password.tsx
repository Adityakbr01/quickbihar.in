/**
 * DEPRECATED: this screen is kept as a thin redirect to the new
 * `/account/set-password` so any leftover deep link / hard-coded
 * route pointing here still lands somewhere sane. The actual
 * password-change UI lives in /account/set-password.tsx.
 */
import { router } from "expo-router";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";

export default function ClothingResetPasswordScreen() {
  const theme = useTheme() as any;

  useEffect(() => {
    router.replace("/account/set-password" as any);
  }, []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.background,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ActivityIndicator color={theme.primary} size="small" />
    </View>
  );
}

