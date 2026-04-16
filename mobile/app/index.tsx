import { Redirect } from "expo-router";
import { useAuthStore } from "@/src/features/auth/store/authStore";

export default function Index() {
  const { isAuthenticated, isInitialized } = useAuthStore();

  // While checking SecureStore, don't redirect anywhere
  if (!isInitialized) {
    return null; // Or a <SplashScreen /> component
  }

  // Landing on home allows "Guest Mode"
  return <Redirect href="/(tabs)/home" />;
}
