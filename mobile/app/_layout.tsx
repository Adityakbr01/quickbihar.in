import { ThemeProvider } from "@/src/theme/Provider/ThemeProvider";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Toast from "react-native-toast-message";
import { toastConfig } from "@/src/components/common/CustomToast";
import { useEffect } from "react";
import { useColorScheme } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryProvider } from "@/src/provider/QueryProvider";
import { useAuthStore } from "@/src/features/auth/store/authStore";

export default function RootLayout() {
  const scheme = useColorScheme();
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <SafeAreaProvider>
      <QueryProvider>
        <StatusBar style={scheme === "dark" ? "light" : "dark"} />
        <ThemeProvider>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          />
          <Toast config={toastConfig} />
        </ThemeProvider>
      </QueryProvider>
    </SafeAreaProvider>
  );
}
