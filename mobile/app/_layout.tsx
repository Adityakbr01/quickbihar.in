import { toastConfig } from "@/src/components/common/CustomToast";
import { SheetProvider } from "@/src/components/common/BottomSheet";
import { useAuthStore } from "@/src/features/common/auth/store/authStore";
import { configureGoogleSignIn } from "@/src/features/common/auth/config/googleSignInConfig";
import { usePushNotifications } from "@/src/hooks/usePushNotifications";
import { QueryProvider } from "@/src/provider/QueryProvider";
import { SocketListenerProvider } from "@/src/provider/SocketListenerProvider";
import { ThemeProvider } from "@/src/theme/Provider/ThemeProvider";
import { TrueSheetProvider } from "@lodev09/react-native-true-sheet";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View, Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

function AppNotificationsInit() {
  usePushNotifications();
  return null;
}

export default function RootLayout() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    async function prepare() {
      try {
        // Wire the native Google sign-in SDK once at app start. The
        // config is a no-op on web / in Expo Go without the native
        // module, so the rest of the app keeps working.
        configureGoogleSignIn();
        await initializeAuth();
      } catch (e) {
        console.warn(e);
      }
    }
    prepare();
  }, [initializeAuth]);

  const fallbackBgColor = "#0f0f0f";

  return (
    <View style={{ flex: 1, backgroundColor: fallbackBgColor }}>
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
          <StatusBar style="light" />
          <ThemeProvider>
            <TrueSheetProvider>
              <SheetProvider>
                <SocketListenerProvider>
                  <Stack
                    screenOptions={{
                      headerShown: false,
                      contentStyle: { backgroundColor: "#0f0f0f" },
                    }}
                  />
                  <Toast config={toastConfig} />
                </SocketListenerProvider>
              </SheetProvider>
            </TrueSheetProvider>
          </ThemeProvider>
        </QueryProvider>
      </SafeAreaProvider>
    </View>
  );
}
