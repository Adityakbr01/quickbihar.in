import { create } from "zustand";
import { authStorage } from "@/lib/authStorage";

export const RoleEnum = {
  USER: "USER",
  SELLER: "SELLER",
  DELIVERY: "DELIVERY",
  ADMIN: "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
} as const;

export type RoleEnum = (typeof RoleEnum)[keyof typeof RoleEnum];

export const RIDER_ROLE_ALIAS = "RIDER";

export interface Role {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const getRoleName = (
  role?: Role | string | null
): string | undefined => (typeof role === "string" ? role : role?.name);

export const getRoleLandingRoute = (
  role?: Role | string | null
): "/clothing" | "/rider" => {
  const roleName = getRoleName(role);
  if (roleName === RoleEnum.DELIVERY || roleName === RIDER_ROLE_ALIAS) return "/rider";
  return "/clothing";
};

export interface User {
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

export interface AuthState {
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
    set({ user, token, refreshToken, isAuthenticated: true, isInitialized: true });
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
