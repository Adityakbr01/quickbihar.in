import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";

import {
  googleAuthRequest,
  linkGoogleRequest,
  loginRequest,
  logoutRequest,
  registerRequest,
  requestResetRequest,
  resetPasswordRequest,
  setPasswordRequest,
  updateProfileRequest,
} from "../api/auth.api";
import { getRoleLandingRoute, useAuthStore } from "../store/authStore";
import { useCartStore } from "@/src/features/common/cart/store/cartStore";
import { queryClient } from "@/src/provider/QueryProvider";

/**
 * Runs after any successful auth response (login, register, Google).
 * Persists tokens + user, syncs the cart, then routes to the role's
 * home. Centralized so each hook doesn't reinvent the wiring.
 */
const finalizeAuth = async (
  setAuth: ReturnType<typeof useAuthStore.getState>["setAuth"],
  data: any,
  router: ReturnType<typeof useRouter>
) => {
  if (!data || !data.user || !data.accessToken) {
    throw new Error("Invalid response format from server");
  }
  const { user, accessToken, refreshToken } = data;
  await setAuth(user, accessToken, refreshToken);

  // Drop any cached profile from a previous account so the new session never
  // renders the old account's avatar/name (per-user query keys already
  // isolate caches; this is belt-and-suspenders for the same-user case).
  queryClient.removeQueries({ queryKey: ["userProfile"] });

  try {
    await useCartStore.getState().syncLocalCart();
  } catch (error) {
    console.error("Failed to sync cart after auth:", error);
  }

  // Legacy OTP users come back with legacyOtpOnly === true. Send them
  // through the forced email-capture flow before they hit the home.
  if (user.legacyOtpOnly) {
    router.replace("/auth/legacy-email-capture" as any);
    return;
  }

  router.replace(getRoleLandingRoute(user.role));
};

/**
 * Email + password sign-in.
 * Backend: POST /auth/login
 */
export const useLogin = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  return useMutation({
    mutationFn: loginRequest,
    onSuccess: async (response) => {
      await finalizeAuth(setAuth, response?.data, router);
    },
  });
};

/**
 * New email + password account creation.
 * Backend: POST /auth/register
 */
export const useRegister = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  return useMutation({
    mutationFn: registerRequest,
    onSuccess: async (response) => {
      await finalizeAuth(setAuth, response?.data, router);
    },
  });
};

/**
 * Google sign-in. The idToken comes from the native GoogleSignin
 * SDK; we just forward it to the server. Server creates the user
 * (or links to an existing email) and returns tokens.
 *
 * Backend: POST /auth/google
 */
export const useGoogleAuth = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  return useMutation({
    mutationFn: googleAuthRequest,
    onSuccess: async (response) => {
      await finalizeAuth(setAuth, response?.data, router);
    },
  });
};

/**
 * Link a Google identity to the currently logged-in user.
 * Used from the Account screen — server pushes a new "google"
 * subdoc onto identities[] and returns the updated user.
 *
 * Backend: POST /auth/link-google
 */
export const useLinkGoogle = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  return useMutation({
    mutationFn: linkGoogleRequest,
    onSuccess: async (response) => {
      const user = response?.data?.user;
      const token = useAuthStore.getState().token;
      const refreshToken = useAuthStore.getState().refreshToken;
      if (user && token) {
        await setAuth(user, token, refreshToken || "");
      }
    },
  });
};

/**
 * Set / change password for the currently logged-in user.
 *
 * Backend: POST /auth/set-password
 */
export const useSetPassword = () => {
  return useMutation({
    mutationFn: setPasswordRequest,
  });
};

/**
 * Request a password-reset email. Always 200s server-side
 * (no email enumeration) so the hook resolves regardless.
 *
 * Backend: POST /auth/request-reset
 */
export const useRequestPasswordReset = () => {
  return useMutation({
    mutationFn: requestResetRequest,
  });
};

/**
 * Consume a reset link. The `token` arrived in the email deep link
 * as a query param. Server marks the JWT used, updates the password
 * identity, and returns a small success envelope.
 *
 * Backend: POST /auth/reset-password
 */
export const useResetPassword = () => {
  return useMutation({
    mutationFn: resetPasswordRequest,
  });
};

/**
 * Patch the authenticated user's name / email / phone. Used by the
 * legacy email-capture screen to swap the synthetic email for a real
 * one. Exposed via the user router already — the hook just thin-wraps.
 */
export const useUpdateProfile = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  return useMutation({
    mutationFn: updateProfileRequest,
    onSuccess: async (response) => {
      const user = response?.data?.data;
      const token = useAuthStore.getState().token;
      const refreshToken = useAuthStore.getState().refreshToken;
      if (user && token) {
        await setAuth(user, token, refreshToken || "");
      }
    },
  });
};

/**
 * Logout — clears tokens locally then hits the server.
 * Backend: POST /auth/logout
 */
export const useLogout = () => {
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const router = useRouter();

  return useMutation({
    mutationFn: logoutRequest,
    onSettled: async () => {
      await clearAuth();
      queryClient.removeQueries({ queryKey: ["userProfile"] });
      useCartStore.getState().clearCart();
      router.replace("/auth");
    },
  });
};
