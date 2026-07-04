import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const canUseLocalStorage = () =>
  typeof globalThis !== "undefined" && typeof globalThis.localStorage !== "undefined";

export const authStorage = {
  async getItemAsync(key: string): Promise<string | null> {
    if (Platform.OS === "web") {
      return canUseLocalStorage() ? globalThis.localStorage.getItem(key) : null;
    }
    return SecureStore.getItemAsync(key);
  },

  async setItemAsync(key: string, value: string): Promise<void> {
    if (Platform.OS === "web") {
      if (canUseLocalStorage()) {
        globalThis.localStorage.setItem(key, value);
      }
      return;
    }
    return SecureStore.setItemAsync(key, value);
  },

  async deleteItemAsync(key: string): Promise<void> {
    if (Platform.OS === "web") {
      if (canUseLocalStorage()) {
        globalThis.localStorage.removeItem(key);
      }
      return;
    }
    return SecureStore.deleteItemAsync(key);
  },
};
