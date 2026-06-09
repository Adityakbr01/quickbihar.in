import { Redirect } from "expo-router";
import { useAuthStore } from "@/src/features/common/auth/store/authStore";

export default function Index() {
  const { isInitialized } = useAuthStore();

  if (!isInitialized) {
    return null;
  }

  return <Redirect href="/(tabs)/clothing" />;
}
