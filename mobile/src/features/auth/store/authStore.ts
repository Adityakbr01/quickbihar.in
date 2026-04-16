import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

interface User {
  _id: string;
  username: string;
  email: string;
  fullName: string;
  role: "admin" | "user" | "seller";
  avatar?: { url: string; fileId: string };
  phone?: string;
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
    await SecureStore.setItemAsync("userToken", token);
    await SecureStore.setItemAsync("refreshToken", refreshToken);
    await SecureStore.setItemAsync("userData", JSON.stringify(user));
    set({ user, token, refreshToken, isAuthenticated: true, isInitialized: true });
  },

  clearAuth: async () => {
    await SecureStore.deleteItemAsync("userToken");
    await SecureStore.deleteItemAsync("refreshToken");
    await SecureStore.deleteItemAsync("userData");
    set({ user: null, token: null, refreshToken: null, isAuthenticated: false, isInitialized: true });
  },

  initializeAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync("userToken");
      const refreshToken = await SecureStore.getItemAsync("refreshToken");
      const userData = await SecureStore.getItemAsync("userData");

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
