import { create } from "zustand";
import { authStorage } from "@/src/lib/authStorage";

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
 * Resolves the post-login landing route from a user's role. The predicates mirror
 * the tab guards in app/(tabs)/clothing/{admin,rider}.tsx and _layout.tsx, so a user
 * always lands on a screen their role can actually render (no guard-redirect bounce).
 * USER/SELLER and unknown roles land on the shopping home.
 */
export const getRoleLandingRoute = (
  role?: Role | string | null
): "/(tabs)/clothing/home" | "/(tabs)/clothing/admin" | "/(tabs)/clothing/rider" => {
  const roleName = typeof role === "string" ? role : role?.name;
  if (roleName === RoleEnum.ADMIN) return "/(tabs)/clothing/admin";
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
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isInitialized: false,

  setAuth: async (user, token, refreshToken) => {
    await authStorage.setItemAsync("userToken", token);
    await authStorage.setItemAsync("refreshToken", refreshToken);
    await authStorage.setItemAsync("userData", JSON.stringify(user));
    await authStorage.setItemAsync("userRole", typeof user.role === "string" ? user.role : user.role?.name || "");
    set({ user, token, refreshToken, isAuthenticated: true, isInitialized: true });
  },

  clearAuth: async () => {
    await authStorage.deleteItemAsync("userToken");
    await authStorage.deleteItemAsync("refreshToken");
    await authStorage.deleteItemAsync("userData");
    await authStorage.deleteItemAsync("userRole");
    set({ user: null, token: null, refreshToken: null, isAuthenticated: false, isInitialized: true });
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
