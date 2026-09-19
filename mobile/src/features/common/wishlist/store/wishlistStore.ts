import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { getMyWishlistRequest, syncWishlistRequest, toggleWishlistRequest } from "../api/wishlist.api";
import { useAuthStore } from "@/src/features/common/auth/store/authStore";
import { secureZustandStorage } from "@/src/lib/secureZustandStorage";
import type { CartModule } from "@/src/features/common/cart/store/cartStore";

/** Storefront module owning a wishlist entry. Mirrors the cart split. */
export type WishlistModule = CartModule;

interface WishlistState {
  items: string[]; // Array of product IDs (all modules)
  /** Module stamped per wishlist id so clothing/jewelery lists stay separate. */
  modules: Record<string, WishlistModule>;
  cachedProducts: Record<string, any>; // Cache of product details for instant UI
  isLoading: boolean;

  // Actions
  toggleItem: (productId: string, productData?: any, module?: WishlistModule) => Promise<void>;
  syncWithServer: () => Promise<void>;
  fetchServerWishlist: () => Promise<void>;
  clearLocal: () => void;
}

/**
 * Resolves a wishlist id's owning module. The stamped value wins, then the
 * cached/server product's vertical, then clothing (covers legacy entries
 * saved before module tagging).
 */
export function resolveWishlistModule(
  productId: string,
  modules: Record<string, WishlistModule>,
  cachedProducts: Record<string, any>,
): WishlistModule {
  const stamped = modules[productId];
  if (stamped === "jewelery" || stamped === "clothing") return stamped;
  const cached = cachedProducts[productId];
  if (cached?.vertical === "JEWELERY") return "jewelery";
  return "clothing";
}

/** Wishlist ids belonging to one module's list only. */
export function selectWishlistIds(
  state: Pick<WishlistState, "items" | "modules" | "cachedProducts">,
  module: WishlistModule,
): string[] {
  return state.items.filter(
    (id) => resolveWishlistModule(id, state.modules, state.cachedProducts) === module,
  );
}

/** Derives the module for product data, preferring the authoritative vertical. */
function moduleForProductData(productData: any, fallback: WishlistModule): WishlistModule {
  if (productData?.vertical === "JEWELERY") return "jewelery";
  return fallback;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      modules: {},
      cachedProducts: {},
      isLoading: false,

      toggleItem: async (productId: string, productData?: any, module: WishlistModule = "clothing") => {
        if (!productId) return;
        const { items, modules, cachedProducts } = get();
        const isAuthenticated = useAuthStore.getState().isAuthenticated;

        // Optimistic local update
        const exists = items.includes(productId);
        const newItems = exists
          ? items.filter((id) => id !== productId)
          : [productId, ...items];

        const newCached = { ...cachedProducts };
        const newModules = { ...modules };
        if (exists) {
          delete newCached[productId];
          delete newModules[productId];
        } else {
          if (productData) {
            newCached[productId] = productData;
          }
          newModules[productId] = moduleForProductData(productData, module);
        }

        set({ items: newItems, cachedProducts: newCached, modules: newModules });

        // If logged in, update server too. If it fails, revert.
        if (isAuthenticated && productId !== "mock") {
          try {
            await toggleWishlistRequest(productId);
          } catch (error) {
            console.error("Failed to toggle wishlist on server", error);
            // Revert optimistic update on failure
            set({ items, cachedProducts, modules });
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
            const newModules: Record<string, WishlistModule> = { ...get().modules };

            serverWishlist.forEach((item: any) => {
              const prod = item.product || item;
              const pId = prod?._id || item.productId || item._id;
              if (pId) {
                serverItems.push(pId);
                if (prod && prod.title) {
                  newCached[pId] = prod;
                }
                // Server products carry vertical — stamp the module so each
                // module's list classifies correctly.
                if (prod?.vertical === "JEWELERY") newModules[pId] = "jewelery";
                else if (newModules[pId] !== "jewelery") newModules[pId] = "clothing";
              }
            });
            set({ items: serverItems, cachedProducts: newCached, modules: newModules });
          }
        } catch (error) {
          console.error("Failed to fetch server wishlist", error);
        }
      },

      clearLocal: () => {
        set({ items: [], cachedProducts: {}, modules: {} });
      },
    }),
    {
      name: "wishlist-storage",
      storage: createJSONStorage(() => secureZustandStorage),
      partialize: (state) => ({
        items: state.items,
        modules: state.modules,
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
