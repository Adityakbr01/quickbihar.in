import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const canUseLocalStorage = () =>
  typeof globalThis !== "undefined" && typeof globalThis.localStorage !== "undefined";

export const authStorage = {
  async getItemAsync(key: string): Promise<string | null> {
    if (Platform.OS === "web") {
      return canUseLocalStorage() ? globalThis.localStorage.getItem(key) : null;
    }
    try {
      const val = await SecureStore.getItemAsync(key);
      if (val) return val;
    } catch {
      // Fallback if SecureStore fails
    }
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },

  async setItemAsync(key: string, value: string): Promise<void> {
    if (Platform.OS === "web") {
      if (canUseLocalStorage()) {
        globalThis.localStorage.setItem(key, value);
      }
      return;
    }
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // SecureStore error ignored
    }
    try {
      await AsyncStorage.setItem(key, value);
    } catch {
      // Ignore
    }
  },

  async deleteItemAsync(key: string): Promise<void> {
    if (Platform.OS === "web") {
      if (canUseLocalStorage()) {
        globalThis.localStorage.removeItem(key);
      }
      return;
    }
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // SecureStore error ignored
    }
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      // Ignore
    }
  },
};
