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
  isAuthenticated: boolean;
  isInitialized: boolean;
  setAuth: (user: User, token: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isInitialized: false,

  setAuth: async (user, token) => {
    await SecureStore.setItemAsync("userToken", token);
    await SecureStore.setItemAsync("userData", JSON.stringify(user));
    set({ user, token, isAuthenticated: true, isInitialized: true });
  },

  clearAuth: async () => {
    await SecureStore.deleteItemAsync("userToken");
    await SecureStore.deleteItemAsync("userData");
    set({ user: null, token: null, isAuthenticated: false, isInitialized: true });
  },

  initializeAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync("userToken");
      const userData = await SecureStore.getItemAsync("userData");

      if (token && userData) {
        set({
          user: JSON.parse(userData),
          token,
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
