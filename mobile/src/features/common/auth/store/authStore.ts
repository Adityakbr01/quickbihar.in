import { create } from "zustand";
import { authStorage } from "@/src/lib/authStorage";
import { signOutGoogleNative } from "../config/googleSignInConfig";

export enum RoleEnum {
  USER = "USER",
  SELLER = "SELLER",
  DELIVERY = "DELIVERY",
  ADMIN = "ADMIN",
  SUPER_ADMIN = "SUPER_ADMIN",
}

/**
 * Legacy/client alias for the DELIVERY role name — some tokens/records carry
 * "RIDER" for what is canonically the DELIVERY role. Use this in role-name
 * comparisons instead of a bare "RIDER" literal. Mirrors the server's
 * RIDER_ROLE_ALIAS (rbac.types.ts).
 */
export const RIDER_ROLE_ALIAS = "RIDER";

interface Role {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Normalizes a user's role to its name string. Tokens/records carry the role
 * either as a populated Role object or as a bare name string; this collapses
 * both forms (and null) into a single comparable value. Use this everywhere a
 * role guard is evaluated instead of reaching into `user.role.name` directly,
 * which silently fails when the role arrives as a string.
 */
export const getRoleName = (
  role?: Role | string | null
): string | undefined => (typeof role === "string" ? role : role?.name);

/**
 * Resolves the post-login landing route from a user's role. The predicates mirror
 * the tab guards in app/(tabs)/clothing/rider.tsx and _layout.tsx, so a user
 * always lands on a screen their role can actually render (no guard-redirect bounce).
 * USER/SELLER/ADMIN and unknown roles land on the shopping home. Admins reach the
 * web admin via the "Web Admin Dashboard" option in the Account screen.
 */
export const getRoleLandingRoute = (
  role?: Role | string | null
): "/(tabs)/clothing/home" | "/(tabs)/clothing/rider" => {
  const roleName = getRoleName(role);
  if (roleName === RoleEnum.DELIVERY || roleName === RIDER_ROLE_ALIAS) return "/(tabs)/clothing/rider";
  return "/(tabs)/clothing/home";
};

interface User {
  _id: string;
  username: string;
  email: string;
  fullName: string;
  role: Role;
  avatar?: { url: string; fileId: string };
  phone?: string;
  isVerified?: boolean;
  isPhoneVerified?: boolean;
  createdAt?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  setAuth: (user: User, token: string, refreshToken: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  updateUser: (fields: Partial<User>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isInitialized: false,

  updateUser: async (fields: Partial<User>) => {
    const current = get().user;
    if (!current) return;
    const updated = { ...current, ...fields };
    set({ user: updated });
    try {
      await authStorage.setItemAsync("userData", JSON.stringify(updated));
    } catch (error) {
      console.warn("Storage error updating user:", error);
    }
  },

  setAuth: async (user, token, refreshToken) => {

    // 1. Immediately set in-memory state so all hooks and components see the authenticated user
    set({ user, token, refreshToken, isAuthenticated: true, isInitialized: true });
    // 2. Persist to storage in background
    try {
      await authStorage.setItemAsync("userToken", token);
      await authStorage.setItemAsync("refreshToken", refreshToken);
      await authStorage.setItemAsync("userData", JSON.stringify(user));
      await authStorage.setItemAsync("userRole", getRoleName(user?.role) || "");
    } catch (error) {
      console.warn("Storage error saving auth:", error);
    }
  },

  clearAuth: async () => {
    set({ user: null, token: null, refreshToken: null, isAuthenticated: false, isInitialized: true });
    try {
      await authStorage.deleteItemAsync("userToken");
      await authStorage.deleteItemAsync("refreshToken");
      await authStorage.deleteItemAsync("userData");
      await authStorage.deleteItemAsync("userRole");
    } catch (error) {
      console.warn("Storage error clearing auth:", error);
    }
    // Also drop the native Google SDK's cached account (mobile only,
    // no-op on web). Without this the next GoogleSignin.signIn() silently
    // reuses the last account instead of showing the account picker.
    // Awaiting it here covers every logout path (manual logout, 401
    // auto-logout, Jewelery signOut) since they all funnel through clearAuth.
    await signOutGoogleNative();
  },

  initializeAuth: async () => {
    try {
      const token = await authStorage.getItemAsync("userToken");
      const refreshToken = await authStorage.getItemAsync("refreshToken");
      const userData = await authStorage.getItemAsync("userData");

      if (token && userData) {
        set({
          user: JSON.parse(userData),
          token,
          refreshToken,
          isAuthenticated: true,
          isInitialized: true
        });
      } else {
        set({ isInitialized: true });
      }
    } catch (error) {
      console.error("Auth initialization failed:", error);
      set({ isInitialized: true });
    }
  },
}));
