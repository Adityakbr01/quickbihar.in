import { Redirect } from "expo-router";
import { useAuthStore } from "@/src/features/auth/store/authStore";

export default function Index() {
  const { isAuthenticated, isInitialized } = useAuthStore();

  // While checking SecureStore, don't redirect anywhere
  if (!isInitialized) {
    return null; // Or a <SplashScreen /> component
  }

  if (!isAuthenticated) {
    return <Redirect href="/auth" />;
  }

  return <Redirect href="/home" />;
}
