const canUseLocalStorage = () =>
  typeof globalThis !== "undefined" && typeof globalThis.localStorage !== "undefined";

/**
 * Auth token storage (web: localStorage).
 *
 * Same async API as before so all callers keep working unchanged.
 */
export const authStorage = {
  async getItemAsync(key: string): Promise<string | null> {
    try {
      return canUseLocalStorage() ? globalThis.localStorage.getItem(key) : null;
    } catch {
      return null;
    }
  },

  async setItemAsync(key: string, value: string): Promise<void> {
    try {
      if (canUseLocalStorage()) {
        globalThis.localStorage.setItem(key, value);
      }
    } catch {
      // Ignore quota/private-mode errors
    }
  },

  async deleteItemAsync(key: string): Promise<void> {
    try {
      if (canUseLocalStorage()) {
        globalThis.localStorage.removeItem(key);
      }
    } catch {
      // Ignore
    }
  },
};
