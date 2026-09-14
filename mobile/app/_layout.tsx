import { toastConfig } from "@/src/components/common/CustomToast";
import { SheetProvider } from "@/src/components/common/BottomSheet";
import { useAuthStore } from "@/src/features/common/auth/store/authStore";
import { configureGoogleSignIn } from "@/src/features/common/auth/config/googleSignInConfig";
import { usePushNotifications } from "@/src/hooks/usePushNotifications";
import { QueryProvider } from "@/src/provider/QueryProvider";
import { SocketListenerProvider } from "@/src/provider/SocketListenerProvider";
import { ThemeProvider, useTheme } from "@/src/theme/Provider/ThemeProvider";
import { TrueSheetProvider } from "@lodev09/react-native-true-sheet";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View, Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import * as SplashScreen from "expo-splash-screen";

function AppNotificationsInit() {
  usePushNotifications();
  return null;
}

// ponytail: splash stays until the persisted theme paints first frame —
// otherwise light-mode users eat one dark frame on native cold start.
if (Platform.OS !== "web") {
  SplashScreen.preventAutoHideAsync().catch(() => {});
}

/** StatusBar + web shell background follow the app theme (not device setting). */
function ThemedChrome() {
  const theme = useTheme();

  useEffect(() => {
    if (Platform.OS !== "web" && theme.ready) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [theme.ready]);
  return (
    <>
      {Platform.OS === "web" && (
        <style dangerouslySetInnerHTML={{ __html: `
          html, body, #root {
            height: 100dvh !important;
            min-height: 100dvh !important;
            margin: 0;
            padding: 0;
            overflow: hidden;
            background-color: ${theme.background};
            color-scheme: ${theme.isDark ? "dark" : "light"};
          }
        `}} />
      )}
      <StatusBar style={theme.isDark ? "light" : "dark"} />
    </>
  );
}

function ThemedApp() {
  const theme = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ThemedChrome />
      <TrueSheetProvider>
        <SheetProvider>
          <SocketListenerProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: theme.background },
              }}
            />
            <Toast config={toastConfig} />
          </SocketListenerProvider>
        </SheetProvider>
      </TrueSheetProvider>
    </View>
  );
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

  return (
    <SafeAreaProvider>
      <QueryProvider>
        <AppNotificationsInit />
        <ThemeProvider>
          <ThemedApp />
        </ThemeProvider>
      </QueryProvider>
    </SafeAreaProvider>
  );
}
