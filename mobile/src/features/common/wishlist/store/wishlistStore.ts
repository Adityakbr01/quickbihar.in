import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { getMyWishlistRequest, syncWishlistRequest, toggleWishlistRequest } from "../api/wishlist.api";
import { useAuthStore } from "@/src/features/common/auth/store/authStore";
import { secureZustandStorage } from "@/src/lib/secureZustandStorage";

interface WishlistState {
  items: string[]; // Array of product IDs
  cachedProducts: Record<string, any>; // Cache of product details for instant UI
  isLoading: boolean;

  // Actions
  toggleItem: (productId: string, productData?: any) => Promise<void>;
  syncWithServer: () => Promise<void>;
  fetchServerWishlist: () => Promise<void>;
  clearLocal: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      cachedProducts: {},
      isLoading: false,

      toggleItem: async (productId: string, productData?: any) => {
        if (!productId) return;
        const { items, cachedProducts } = get();
        const isAuthenticated = useAuthStore.getState().isAuthenticated;

        // Optimistic local update
        const exists = items.includes(productId);
        const newItems = exists
          ? items.filter((id) => id !== productId)
          : [productId, ...items];

        const newCached = { ...cachedProducts };
        if (exists) {
          delete newCached[productId];
        } else if (productData) {
          newCached[productId] = productData;
        }

        set({ items: newItems, cachedProducts: newCached });

        // If logged in, update server too. If it fails, revert.
        if (isAuthenticated && productId !== "mock") {
          try {
            await toggleWishlistRequest(productId);
          } catch (error) {
            console.error("Failed to toggle wishlist on server", error);
            // Revert optimistic update on failure
            set({ items, cachedProducts });
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
          if (Array.isArray(serverWishlist)) {
            const serverItems: string[] = [];
            const newCached: Record<string, any> = { ...get().cachedProducts };

            serverWishlist.forEach((item: any) => {
              const prod = item.product || item;
              const pId = prod?._id || item.productId || item._id;
              if (pId) {
                serverItems.push(pId);
                if (prod && prod.title) {
                  newCached[pId] = prod;
                }
              }
            });
            set({ items: serverItems, cachedProducts: newCached });
          }
        } catch (error) {
          console.error("Failed to fetch server wishlist", error);
        }
      },

      clearLocal: () => {
        set({ items: [], cachedProducts: {} });
      },
    }),
    {
      name: "wishlist-storage",
      storage: createJSONStorage(() => secureZustandStorage),
      partialize: (state) => ({
        items: state.items,
        cachedProducts: state.cachedProducts,
      }),
    }
  )
);

// Decoupled Auth Listener:
// Whenever authentication state changes to true, trigger the sync process
useAuthStore.subscribe((state, prevState) => {
  if (state.isAuthenticated && !prevState.isAuthenticated) {
    useWishlistStore.getState().syncWithServer();
  } else if (!state.isAuthenticated && prevState.isAuthenticated) {
    useWishlistStore.getState().clearLocal();
  }
});
