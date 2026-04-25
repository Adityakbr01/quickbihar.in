import { useMutation } from "@tanstack/react-query";
import { loginRequest, registerRequest, requestOTPRequest, verifyOTPRequest, logoutRequest } from "../api/auth.api";
import { useAuthStore } from "../store/authStore";
import { useCartStore } from "../../cart/store/cartStore";
import { useRouter } from "expo-router";

/**
 * Hook for logging in with email + password
 * Backend: POST /auth/login
 */
export const useLogin = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  return useMutation({
    mutationFn: loginRequest,
    onSuccess: async (response) => {
      const data = response?.data;

      if (!data || !data.user || !data.accessToken) {
        console.error("Malformed login response:", response);
        throw new Error("Invalid response format from server");
      }

      const { user, accessToken, refreshToken } = data;
      await setAuth(user, accessToken, refreshToken);

      try {
        await useCartStore.getState().syncLocalCart();
      } catch (error) {
        console.error("Failed to sync cart after login:", error);
      }

      router.replace("/home");
    },
  });
};

/**
 * Hook for registering a new account
 * Backend: POST /auth/register → returns user + sends OTP
 */
export const useRegister = () => {
  return useMutation({
    mutationFn: registerRequest,
  });
};

/**
 * Hook for requesting OTP
 * Backend: POST /auth/request-otp
 */
export const useRequestOTP = () => {
  return useMutation({
    mutationFn: requestOTPRequest,
  });
};

/**
 * Hook for verifying OTP (auto-login after verification)
 * Backend: POST /auth/verify-otp → returns user + tokens
 */
export const useVerifyOTP = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  return useMutation({
    mutationFn: verifyOTPRequest,
    onSuccess: async (response) => {
      const data = response?.data;

      if (!data || !data.user || !data.accessToken) {
        console.error("Malformed OTP verify response:", response);
        throw new Error("Invalid response format from server");
      }

      const { user, accessToken, refreshToken } = data;
      await setAuth(user, accessToken, refreshToken);

      try {
        await useCartStore.getState().syncLocalCart();
      } catch (error) {
        console.error("Failed to sync cart after OTP login:", error);
      }

      router.replace("/home");
    },
  });
};

/**
 * Hook for logging out
 * Backend: POST /auth/logout
 */
export const useLogout = () => {
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const router = useRouter();

  return useMutation({
    mutationFn: logoutRequest,
    onSettled: async () => {
      await clearAuth();
      useCartStore.getState().clearCart();
      router.replace("/auth");
    },
  });
};

// Legacy alias
export const useAuthenticate = useLogin;
