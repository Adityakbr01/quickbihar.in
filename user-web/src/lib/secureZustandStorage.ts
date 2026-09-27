import { StateStorage } from "zustand/middleware";
import { authStorage } from "@/src/lib/authStorage";

/**
 * A Zustand `StateStorage` adapter backed by `authStorage` (SecureStore on
 * native, localStorage on web).
 *
 * ponytail: this adapter was duplicated verbatim in cartStore.ts and
 * wishlistStore.ts. Import from here instead of re-defining.
 */
export const secureZustandStorage: StateStorage = {
  getItem: (name: string) => authStorage.getItemAsync(name),
  setItem: (name: string, value: string) => authStorage.setItemAsync(name, value),
  removeItem: (name: string) => authStorage.deleteItemAsync(name),
};
