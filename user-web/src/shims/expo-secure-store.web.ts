export async function getItemAsync(key: string): Promise<string | null> {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage.getItem(key);
  }
  return null;
}

export async function setItemAsync(key: string, value: string): Promise<void> {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(key, value);
  }
}

export async function deleteItemAsync(key: string): Promise<void> {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem(key);
  }
}

export async function isAvailableAsync(): Promise<boolean> {
  return typeof window !== 'undefined' && !!window.localStorage;
}

export default {
  getItemAsync,
  setItemAsync,
  deleteItemAsync,
  isAvailableAsync,
};
