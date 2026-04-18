import { toastConfig } from "@/src/components/common/CustomToast";
import { useAuthStore } from "@/src/features/auth/store/authStore";
import { QueryProvider } from "@/src/provider/QueryProvider";
import { ThemeProvider } from "@/src/theme/Provider/ThemeProvider";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useColorScheme, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { usePushNotifications } from "@/src/hooks/usePushNotifications";
import Constants from "expo-constants";
import { SocketListenerProvider } from "@/src/provider/SocketListenerProvider";



export default function RootLayout() {
  const scheme = useColorScheme();
  const initializeAuth = useAuthStore((state) => state.initializeAuth)

  // Initialize push notifications logic (UX optimized / Expo Go guarded internally)
  usePushNotifications();

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


  return (
    <View style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryProvider>
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
