import { create } from "zustand";
import { authStorage } from "@/src/lib/authStorage";

export enum RoleEnum {
  USER = "USER",
  SELLER = "SELLER",
  DELIVERY = "DELIVERY",
  ADMIN = "ADMIN",
  SUPER_ADMIN = "SUPER_ADMIN",
}

interface Role {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

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
