import { toastConfig } from "@/src/components/common/CustomToast";
import { useAuthStore } from "@/src/features/common/auth/store/authStore";
import { usePushNotifications } from "@/src/hooks/usePushNotifications";
import { QueryProvider } from "@/src/provider/QueryProvider";
import { SocketListenerProvider } from "@/src/provider/SocketListenerProvider";
import { ThemeProvider } from "@/src/theme/Provider/ThemeProvider";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useColorScheme, View, Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

function AppNotificationsInit() {
  usePushNotifications();
  return null;
}

export default function RootLayout() {
  const scheme = useColorScheme();
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    async function prepare() {
      try {
        await initializeAuth();
      } catch (e) {
        console.warn(e);
      }
    }
    prepare();
  }, [initializeAuth]);

  const isDark = scheme === "dark";
  const fallbackBgColor = isDark ? "#0f0f0f" : "#ffffff";

  return (
    <View style={{ flex: 1 }}>
      {Platform.OS === "web" && (
        <style dangerouslySetInnerHTML={{ __html: `
          html, body, #root {
            height: 100dvh !important;
            min-height: 100dvh !important;
            margin: 0;
            padding: 0;
            overflow: hidden;
            background-color: ${fallbackBgColor};
          }
        `}} />
      )}
      <SafeAreaProvider>
        <QueryProvider>
          <AppNotificationsInit />
          <StatusBar style={scheme === "dark" ? "light" : "dark"} />
          <ThemeProvider>
            <SocketListenerProvider>
              <Stack
                screenOptions={{
                  headerShown: false,
                }}
              />
              <Toast config={toastConfig} />
            </SocketListenerProvider>
          </ThemeProvider>
        </QueryProvider>
      </SafeAreaProvider>
    </View>
  );
}
