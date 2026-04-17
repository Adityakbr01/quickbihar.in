import { useMutation } from "@tanstack/react-query";
import { authenticateRequest, logoutRequest } from "../api/auth.api";
import { useAuthStore } from "../store/authStore";
import { useCartStore } from "../../cart/store/cartStore";
import { useRouter } from "expo-router";

export const useAuthenticate = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  return useMutation({
    mutationFn: authenticateRequest,
    onSuccess: async (response) => {
      // The server returns an ApiResponse which has a .data property
      // We check if response and response.data exist to avoid "Cannot read property 'user' of undefined"
      const data = response?.data;

      if (!data || !data.user) {
        console.error("Malformed response from server:", response);
        throw new Error("Invalid response format from server");
      }

      const { user, accessToken, refreshToken } = data;
      await setAuth(user, accessToken, refreshToken);
      
      // Sync local cart items to server after login
      try {
        await useCartStore.getState().syncLocalCart();
      } catch (error) {
        console.error("Failed to sync cart after login:", error);
      }

      console.log("Authentication successful, state updated.");
      router.replace("/home");
    },
    onError: (error: any) => {
      console.error("Authentication failed:", error.message);
    },
  });
};

export const useLogout = () => {
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const router = useRouter();

  return useMutation({
    mutationFn: logoutRequest,
    onSettled: async () => {
      // We clear local auth regardless of whether the server call succeeded
      await clearAuth();
      // Clear cart on logout
      useCartStore.getState().clearCart();
      
      console.log("Logged out successfully.");
      router.replace("/auth");
    },
  });
};
