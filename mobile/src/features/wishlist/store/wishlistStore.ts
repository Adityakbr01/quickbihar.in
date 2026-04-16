import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import * as SecureStore from "expo-secure-store";
import { getMyWishlistRequest, syncWishlistRequest, toggleWishlistRequest } from "../api/wishlist.api";
import { useAuthStore } from "../../auth/store/authStore";

const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return await SecureStore.getItemAsync(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await SecureStore.deleteItemAsync(name);
  },
};

interface WishlistState {
  items: string[]; // Array of product IDs
  isLoading: boolean;

  // Actions
  toggleItem: (productId: string) => Promise<void>;
  syncWithServer: () => Promise<void>;
  fetchServerWishlist: () => Promise<void>;
  clearLocal: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,

      toggleItem: async (productId: string) => {
        const { items } = get();
        const isAuthenticated = useAuthStore.getState().isAuthenticated;

        // Optimistic local update
        const exists = items.includes(productId);
        const newItems = exists
          ? items.filter(id => id !== productId)
          : [productId, ...items];

        set({ items: newItems });

        // If logged in, update server too. If it fails, revert.
        if (isAuthenticated && productId !== "mock") {
          try {
            await toggleWishlistRequest(productId);
          } catch (error) {
            console.error("Failed to toggle wishlist on server", error);
            // Revert optimistic update on failure
            set({ items });
          }
        }
      },

      syncWithServer: async () => {
        const { items } = get();
        set({ isLoading: true });
        try {
          if (items.length > 0) {
            // Push any local items to server
            await syncWishlistRequest(items);
          }
          // After sync, pull the new source of truth
          await get().fetchServerWishlist();
        } catch (error) {
          console.error("Failed to sync wishlist", error);
        } finally {
          set({ isLoading: false });
        }
      },

      fetchServerWishlist: async () => {
        try {
          const serverWishlist = await getMyWishlistRequest();
          // serverWishlist returns an array of objects containing product._id
          const serverItems = serverWishlist.map((item: any) => item.product?._id || item.productId).filter(Boolean);
          set({ items: serverItems });
        } catch (error) {
          console.error("Failed to fetch server wishlist", error);
        }
      },

      clearLocal: () => {
        set({ items: [] });
      }
    }),
    {
      name: "wishlist-storage",
      storage: createJSONStorage(() => secureStorage),
    }
  )
);

// Decoupled Auth Listener: 
// Whenever authentication state changes to true, trigger the sync process
useAuthStore.subscribe(
  (state, prevState) => {
    if (state.isAuthenticated && !prevState.isAuthenticated) {
      useWishlistStore.getState().syncWithServer();
    } else if (!state.isAuthenticated && prevState.isAuthenticated) {
      useWishlistStore.getState().clearLocal();
    }
  }
);
