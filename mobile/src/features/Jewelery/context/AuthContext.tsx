import React from "react";
import { useAuthStore } from "@/src/features/common/auth/store/authStore";
import {
  loginRequest,
  registerRequest,
  requestOTPRequest,
  verifyOTPRequest,
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
 */
import axiosInstance from "@/src/api/axiosInstance";

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

    sendOtp: async (emailOrPhone: string, isRegistration: boolean = false): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await requestOTPRequest({ target: emailOrPhone, isRegistration });
        if (res?.statusCode === 200 || res?.message) {
          return { success: true };
        }
        return { success: false, error: res?.message || "Failed to send OTP" };
      } catch (err: any) {
        const errorMsg =
          err?.response?.data?.message || err?.message || "Failed to send OTP";
        return { success: false, error: errorMsg };
      }
    },

    verifyOtp: async (emailOrPhone: string, otp: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const response = await verifyOTPRequest({ email: emailOrPhone, otp });
        const data = response?.data;
        if (data?.user && data?.accessToken) {
          await setAuth(data.user, data.accessToken, data.refreshToken || "");
          return { success: true };
        }
        return { success: false, error: response?.message || "Invalid OTP" };
      } catch (err: any) {
        const errorMsg =
          err?.response?.data?.message || err?.message || "Invalid or expired OTP";
        return { success: false, error: errorMsg };
      }
    },

    signOut: async () => {
      await clearAuth();
    },

    resetPassword: async (phoneOrEmail: string, newPassword: string, email?: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const payload: any = { password: newPassword };
        if (email) payload.email = email;
        const response = await axiosInstance.patch("/users/profile", payload);
        if (response?.data?.statusCode === 200 || response?.status === 200) {
          if (response.data?.data) {
            await setAuth(response.data.data, useAuthStore.getState().token || "", useAuthStore.getState().refreshToken || "");
          }
          return { success: true };
        }
        return { success: false, error: response?.data?.message || "Failed to update security profile" };
      } catch (err: any) {
        const errorMsg = err?.response?.data?.message || err?.message || "Failed to update security profile";
        try {
          const response = await registerRequest({
            email: email || phoneOrEmail,
            password: newPassword,
            fullName: "",
          });
          const data = response?.data;
          if (data?.user && data?.accessToken) {
            await setAuth(data.user, data.accessToken, data.refreshToken || "");
          }
          return { success: true };
        } catch {
          return { success: false, error: errorMsg };
        }
      }
    },
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

