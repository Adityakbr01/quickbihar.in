import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";
import * as SecureStore from "expo-secure-store";
import axiosInstance from "@/src/api/axiosInstance";
import { useAuthStore } from "../../auth/store/authStore";

export interface CartItem {
  id?: string; // for compatibility with older mock data if needed
  productId: string;
  sku: string;
  quantity: number;
  productTitle?: string;
  price?: number;
  image?: string;
  stockStatus?: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
  availableStock?: number;
}

interface CartState {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  addItem: (product: any, sku: string, quantity?: number) => Promise<void>;
  removeItem: (sku: string) => Promise<void>;
  updateQuantity: (sku: string, quantity: number) => Promise<void>;
  fetchCart: () => Promise<void>;
  syncLocalCart: () => Promise<void>;
  clearCart: () => Promise<void>;
}

const secureStorage: StateStorage = {
  getItem: (name: string): string | null | Promise<string | null> => {
    return SecureStore.getItemAsync(name);
  },
  setItem: (name: string, value: string): void | Promise<void> => {
    return SecureStore.setItemAsync(name, value);
  },
  removeItem: (name: string): void | Promise<void> => {
    return SecureStore.deleteItemAsync(name);
  },
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      subtotal: 0,
      itemCount: 0,
      isLoading: false,
      error: null,

      addItem: async (product, sku, quantity = 1) => {
        const { isAuthenticated } = useAuthStore.getState();
        const { items } = get();

        const existingItem = items.find((item) => item.sku === sku);
        let newItems = [...items];

        if (existingItem) {
          newItems = items.map((item) =>
            item.sku === sku ? { ...item, quantity: item.quantity + quantity } : item
          );
        } else {
          const newItem: CartItem = {
            productId: product._id || product.id,
            sku,
            quantity,
            productTitle: product.title,
            price: product.price,
            image: product.images?.[0]?.url || product.image,
          };
          newItems.push(newItem);
        }

        if (isAuthenticated) {
          try {
            set({ isLoading: true });
            await axiosInstance.post("/cart/add", {
              productId: product._id || product.id,
              sku,
              quantity,
            });
            await get().fetchCart();
          } catch (error: any) {
            set({ error: error.response?.data?.message || "Failed to add item to cart" });
          } finally {
            set({ isLoading: false });
          }
        } else {
          // Guest mode: update local state
          const subtotal = newItems.reduce((acc, item) => acc + (item.price || 0) * item.quantity, 0);
          set({ items: newItems, itemCount: newItems.length, subtotal });
        }
      },

      removeItem: async (sku) => {
        const { isAuthenticated } = useAuthStore.getState();
        const { items } = get();

        if (isAuthenticated) {
          try {
            set({ isLoading: true });
            await axiosInstance.delete(`/cart/remove/${sku}`);
            await get().fetchCart();
          } catch (error: any) {
            set({ error: error.response?.data?.message || "Failed to remove item" });
          } finally {
            set({ isLoading: false });
          }
        } else {
          const newItems = items.filter((item) => item.sku !== sku);
          const subtotal = newItems.reduce((acc, item) => acc + (item.price || 0) * item.quantity, 0);
          set({ items: newItems, itemCount: newItems.length, subtotal });
        }
      },

      updateQuantity: async (sku, quantity) => {
        const { isAuthenticated } = useAuthStore.getState();
        const { items } = get();

        if (isAuthenticated) {
          try {
            set({ isLoading: true });
            await axiosInstance.patch("/cart/update", { sku, quantity });
            await get().fetchCart();
          } catch (error: any) {
            set({ error: error.response?.data?.message || "Failed to update quantity" });
          } finally {
            set({ isLoading: false });
          }
        } else {
          const newItems = items.map((item) =>
            item.sku === sku ? { ...item, quantity } : item
          );
          const subtotal = newItems.reduce((acc, item) => acc + (item.price || 0) * item.quantity, 0);
          set({ items: newItems, subtotal });
        }
      },

      fetchCart: async () => {
        const { isAuthenticated } = useAuthStore.getState();
        if (!isAuthenticated) return;

        try {
          set({ isLoading: true });
          const response = await axiosInstance.get("/cart");
          set({
            items: response.data.data.items,
            subtotal: response.data.data.subtotal,
            itemCount: response.data.data.itemCount,
            error: null,
          });
        } catch (error: any) {
          set({ error: error.response?.data?.message || "Failed to fetch cart" });
        } finally {
          set({ isLoading: false });
        }
      },

      syncLocalCart: async () => {
        const { isAuthenticated } = useAuthStore.getState();
        if (!isAuthenticated) return;

        const { items } = get();
        if (items.length === 0) {
          await get().fetchCart();
          return;
        }

        try {
          set({ isLoading: true });
          await axiosInstance.post("/cart/sync", {
            items: items.map((item) => ({
              productId: item.productId,
              sku: item.sku,
              quantity: item.quantity,
            })),
          });
          // Clear local items after sync and fetch the merged cart from server
          set({ items: [] });
          await get().fetchCart();
        } catch (error: any) {
          console.error("Cart sync failed:", error);
        } finally {
          set({ isLoading: false });
        }
      },

      clearCart: async () => {
        const { isAuthenticated } = useAuthStore.getState();
        if (isAuthenticated) {
          await axiosInstance.delete("/cart/clear");
        }
        set({ items: [], subtotal: 0, itemCount: 0 });
      },
    }),
    {
      name: "cart-storage",
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({ items: state.items, subtotal: state.subtotal, itemCount: state.itemCount }),
    }
  )
);
