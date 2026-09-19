import React from "react";
import { useAuthStore } from "@/src/features/common/auth/store/authStore";
import {
  loginRequest,
  registerRequest,
} from "@/src/features/common/auth/api/auth.api";

export interface User {
  name: string;
  phone: string;
  email?: string;
  joinedAt: string;
}

/**
 * Jewelery auth bridge — connects Jewelery components directly to
 * the single global Zustand auth store (`useAuthStore` in `common/auth`)
 * and backend authentication API.
 *
 * Supported methods: email+password (login/register) and Google (via
 * sign-in screen). Phone-OTP was retired with the server's post-OTP
 * cutover (/auth/request-otp + /auth/verify-otp no longer exist).
 */
export function useAuth() {
  const { user, setAuth, clearAuth, isInitialized } = useAuthStore();

  return {
    user: user
      ? {
          name: user.fullName || user.username || "User",
          phone: user.phone || "",
          email: user.email,
          joinedAt: (user as any).createdAt || new Date().toISOString(),
        }
      : null,
    isLoading: !isInitialized,

    signIn: async (phoneOrEmail: string, password: string) => {
      try {
        const response = await loginRequest({ email: phoneOrEmail, password });
        const data = response?.data;
        if (data?.user && data?.accessToken) {
          await setAuth(data.user, data.accessToken, data.refreshToken || "");
          return { success: true };
        }
        return { success: false, error: response?.message || "Invalid credentials" };
      } catch (err: any) {
        const errorMsg =
          err?.response?.data?.message || err?.message || "Sign in failed";
        return { success: false, error: errorMsg };
      }
    },

    signUp: async (name: string, phoneOrEmail: string, password: string) => {
      try {
        const response = await registerRequest({
          email: phoneOrEmail,
          password,
          fullName: name,
        });
        return { success: true, data: response?.data };
      } catch (err: any) {
        const errorMsg =
          err?.response?.data?.message || err?.message || "Registration failed";
        return { success: false, error: errorMsg };
      }
    },

    signOut: async () => {
      await clearAuth();
    },
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
