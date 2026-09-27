export const AsyncStorage = {
  async getItem(key: string): Promise<string | null> {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return null;
  },
  async setItem(key: string, value: string): Promise<void> {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  },
  async removeItem(key: string): Promise<void> {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  },
  async clear(): Promise<void> {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
  },
  async getAllKeys(): Promise<string[]> {
    if (typeof window !== 'undefined' && window.localStorage) {
      return Object.keys(window.localStorage);
    }
    return [];
  },
  async multiGet(keys: string[]): Promise<[string, string | null][]> {
    return Promise.all(keys.map(async (key) => [key, await AsyncStorage.getItem(key)]));
  },
  async multiSet(keyValuePairs: [string, string][]): Promise<void> {
    await Promise.all(keyValuePairs.map(([key, val]) => AsyncStorage.setItem(key, val)));
  },
  async multiRemove(keys: string[]): Promise<void> {
    await Promise.all(keys.map((key) => AsyncStorage.removeItem(key)));
  },
};

export default AsyncStorage;
