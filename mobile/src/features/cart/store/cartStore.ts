import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";
import * as SecureStore from "expo-secure-store";
import axiosInstance from "@/src/api/axiosInstance";
import { useAuthStore } from "../../auth/store/authStore";
import { ICoupon } from "../../coupon/types/coupon.types";

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
  selectedSize?: string;
  selectedColor?: string;
}

interface CartState {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
  isLoading: boolean;
  error: string | null;
  appliedCoupon: ICoupon | null;
  discountAmount: number;

  // Actions
  addItem: (product: any, sku: string, quantity?: number) => Promise<void>;
  removeItem: (sku: string) => Promise<void>;
  updateQuantity: (sku: string, quantity: number) => Promise<void>;
  fetchCart: () => Promise<void>;
  syncLocalCart: () => Promise<void>;
  clearCart: () => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => void;
  revalidateCoupon: () => Promise<void>;
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
      appliedCoupon: null,
      discountAmount: 0,

      addItem: async (product, sku, quantity = 1) => {
        const { isAuthenticated } = useAuthStore.getState();
        const { items, appliedCoupon } = get();

        const existingItem = items.find((item) => item.sku === sku);
        let newItems = [...items];

        if (existingItem) {
          newItems = items.map((item) =>
            item.sku === sku ? { ...item, quantity: item.quantity + quantity } : item
          );
        } else {
          const variant = product.variants?.find((v: any) => v.sku === sku);
          const newItem: CartItem = {
            productId: product._id || product.id,
            sku,
            quantity,
            productTitle: product.title,
            price: product.price,
            image: product.images?.[0]?.url || product.image,
            selectedSize: variant?.size,
            selectedColor: variant?.color,
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
            if (appliedCoupon) await get().revalidateCoupon();
          } catch (error: any) {
            set({ error: error.response?.data?.message || "Failed to add item to cart" });
          } finally {
            set({ isLoading: false });
          }
        } else {
          // Guest mode: update local state
          const subtotal = newItems.reduce((acc, item) => acc + (item.price || 0) * item.quantity, 0);
          set({ items: newItems, itemCount: newItems.length, subtotal });
          if (appliedCoupon) await get().revalidateCoupon();
        }
      },

      removeItem: async (sku) => {
        const { isAuthenticated } = useAuthStore.getState();
        const { items, appliedCoupon } = get();

        if (isAuthenticated) {
          try {
            set({ isLoading: true });
            await axiosInstance.delete(`/cart/remove/${sku}`);
            await get().fetchCart();
            if (appliedCoupon) await get().revalidateCoupon();
          } catch (error: any) {
            set({ error: error.response?.data?.message || "Failed to remove item" });
          } finally {
            set({ isLoading: false });
          }
        } else {
          const newItems = items.filter((item) => item.sku !== sku);
          const subtotal = newItems.reduce((acc, item) => acc + (item.price || 0) * item.quantity, 0);
          set({ items: newItems, itemCount: newItems.length, subtotal });
          if (appliedCoupon) await get().revalidateCoupon();
        }
      },

      updateQuantity: async (sku, quantity) => {
        const { isAuthenticated } = useAuthStore.getState();
        const { items, appliedCoupon } = get();

        if (isAuthenticated) {
          try {
            set({ isLoading: true });
            await axiosInstance.patch("/cart/update", { sku, quantity });
            await get().fetchCart();
            if (appliedCoupon) await get().revalidateCoupon();
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
          if (appliedCoupon) await get().revalidateCoupon();
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
          if (get().appliedCoupon) await get().revalidateCoupon();
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
        set({ items: [], subtotal: 0, itemCount: 0, appliedCoupon: null, discountAmount: 0 });
      },

      applyCoupon: async (code: string) => {
        try {
          set({ isLoading: true, error: null });
          const { subtotal } = get();
          const response = await axiosInstance.post("/coupons/validate", { code, orderAmount: subtotal });
          const { coupon, discountAmount } = response.data.data;

          set({
            appliedCoupon: coupon,
            discountAmount,
            error: null
          });
        } catch (error: any) {
          set({
            appliedCoupon: null,
            discountAmount: 0,
            error: error.response?.data?.message || "Invalid coupon code"
          });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      removeCoupon: () => {
        set({ appliedCoupon: null, discountAmount: 0 });
      },

      revalidateCoupon: async () => {
        const { appliedCoupon, subtotal } = get();
        if (!appliedCoupon) return;

        // Local calculation for instant UI feedback
        let calculatedDiscount = 0;
        if (subtotal < appliedCoupon.minOrderValue) {
          // Subtotal fell below minimum requirement
          set({ appliedCoupon: null, discountAmount: 0 });
          return;
        }

        if (appliedCoupon.discountType === "PERCENTAGE") {
          calculatedDiscount = (subtotal * appliedCoupon.discountValue) / 100;
          if (appliedCoupon.maxDiscountAmount && appliedCoupon.maxDiscountAmount > 0 && calculatedDiscount > appliedCoupon.maxDiscountAmount) {
            calculatedDiscount = appliedCoupon.maxDiscountAmount;
          }
        } else {
          // FIXED discount
          calculatedDiscount = appliedCoupon.discountValue;
        }

        set({ discountAmount: calculatedDiscount });

        // Still hit the server to be 100% sure (e.g. expiry, usage limits)
        try {
          const response = await axiosInstance.post("/coupons/validate", {
            code: appliedCoupon.code,
            orderAmount: subtotal
          });
          const { discountAmount } = response.data.data;
          set({ discountAmount });
        } catch (error) {
          // If server says it's invalid (e.g. expired while browsing), remove it
          set({ appliedCoupon: null, discountAmount: 0 });
        }
      },
    }),
    {
      name: "cart-storage",
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        items: state.items,
        subtotal: state.subtotal,
        itemCount: state.itemCount,
        appliedCoupon: state.appliedCoupon,
        discountAmount: state.discountAmount
      }),
    }
  )
);
