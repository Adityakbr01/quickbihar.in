import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";
import * as SecureStore from "expo-secure-store";
import axiosInstance from "@/src/api/axiosInstance";
import { ICoupon } from "../../coupon/types/coupon.types";
import { useAuthStore } from "@/src/features/common/auth/store/authStore";

export interface CartItem {
  id?: string; // for compatibility with older mock data if needed
  productId: string;
  sku: string;
  quantity: number;
  productTitle?: string;
  price?: number;
  originalPrice?: number;
  image?: string;
  stockStatus?: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
  availableStock?: number;
  selectedSize?: string;
  selectedColor?: string;
  taxAmount?: number;
  sellerId?: string;
  storeId?: string;
}

interface CartState {
  items: CartItem[];
  subtotal: number;
  totalTax: number;
  itemCount: number;
  isLoading: boolean;
  error: string | null;
  shippingRules: {
    threshold: number;
    fee: number;
  };
  appliedCoupon: ICoupon | null;
  appliedCoupons: ICoupon[];
  discountAmount: number;

  // Actions
  fetchShippingConfig: () => Promise<void>;
  addItem: (product: any, sku: string, quantity?: number) => Promise<void>;
  removeItem: (sku: string) => Promise<void>;
  updateQuantity: (sku: string, quantity: number) => Promise<void>;
  fetchCart: () => Promise<void>;
  syncLocalCart: () => Promise<void>;
  clearCart: () => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: (code?: string) => void;
  revalidateCoupon: () => Promise<void>;
  handleStockUpdate: (data: { productId: string; sku: string; newStock: number }) => void;
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
      totalTax: 0,
      itemCount: 0,
      isLoading: false,
      error: null,
      shippingRules: {
        threshold: 2000,
        fee: 99,
      },
      appliedCoupon: null,
      appliedCoupons: [],
      discountAmount: 0,

      addItem: async (product, sku, quantity = 1) => {
        const { isAuthenticated } = useAuthStore.getState();
        const { items, appliedCoupons } = get();

        const existingItem = items.find((item) => item.sku === sku);
        let newItems = [...items];

        if (existingItem) {
          newItems = items.map((item) =>
            item.sku === sku ? { ...item, quantity: item.quantity + quantity } : item
          );
        } else {
          const variant = product.variants?.find((v: any) => v.sku === sku);

          // Calculate GST logic
          const basePrice = product.price;
          const isGst = product.isGstApplicable || false;
          const gstPercent = product.gstPercentage || 0;
          const itemPrice = Math.round(isGst ? basePrice * (1 + gstPercent / 100) : basePrice);
          const taxAmount = Math.round(itemPrice - basePrice);

          const newItem: CartItem = {
            productId: typeof product._id === 'object' ? product._id.toString() : (product._id || product.id),
            sku,
            quantity,
            productTitle: product.title,
            price: itemPrice,
            taxAmount, // Save tax per unit
            originalPrice: product.originalPrice || product.price,
            image: product.images?.[0]?.url || product.image,
            selectedSize: variant?.size,
            selectedColor: variant?.color,
            sellerId: product.sellerId || product.seller?._id || product.seller,
            storeId: product.storeId || product.store?._id || product.store,
          };
          newItems.push(newItem);
        }

        if (isAuthenticated) {
          try {
            set({ isLoading: true });
            await axiosInstance.post("/cart/add", {
              productId: typeof product._id === 'object' ? product._id.toString() : (product._id || product.id),
              sku,
              quantity,
            });
            await get().fetchCart();
            if (appliedCoupons && appliedCoupons.length > 0) await get().revalidateCoupon();
          } catch (error: any) {
            set({ error: error.response?.data?.message || "Failed to add item to cart" });
          } finally {
            set({ isLoading: false });
          }
        } else {
          // Guest mode: update local state
          const subtotal = newItems.reduce((acc, item) => acc + (item.price || 0) * item.quantity, 0);
          const totalTax = newItems.reduce((acc, item) => acc + (item.taxAmount || 0) * item.quantity, 0);
          set({ items: newItems, itemCount: newItems.length, subtotal, totalTax });
          if (appliedCoupons && appliedCoupons.length > 0) await get().revalidateCoupon();
        }
      },

      removeItem: async (sku) => {
        const { isAuthenticated } = useAuthStore.getState();
        const { items, appliedCoupons } = get();

        if (isAuthenticated) {
          try {
            set({ isLoading: true });
            await axiosInstance.delete(`/cart/remove/${sku}`);
            await get().fetchCart();
            if (appliedCoupons && appliedCoupons.length > 0) await get().revalidateCoupon();
          } catch (error: any) {
            set({ error: error.response?.data?.message || "Failed to remove item" });
          } finally {
            set({ isLoading: false });
          }
        } else {
          const newItems = items.filter((item) => item.sku !== sku);
          const subtotal = Math.round(newItems.reduce((acc, item) => acc + (item.price || 0) * item.quantity, 0));
          const totalTax = Math.round(newItems.reduce((acc, item) => acc + (item.taxAmount || 0) * item.quantity, 0));
          set({ items: newItems, itemCount: newItems.length, subtotal, totalTax });
          if (appliedCoupons && appliedCoupons.length > 0) await get().revalidateCoupon();
        }
      },

      updateQuantity: async (sku, quantity) => {
        const { isAuthenticated } = useAuthStore.getState();
        const { items, appliedCoupons } = get();

        if (isAuthenticated) {
          try {
            set({ isLoading: true });
            await axiosInstance.patch("/cart/update", { sku, quantity });
            await get().fetchCart();
            if (appliedCoupons && appliedCoupons.length > 0) await get().revalidateCoupon();
          } catch (error: any) {
            set({ error: error.response?.data?.message || "Failed to update quantity" });
          } finally {
            set({ isLoading: false });
          }
        } else {
          const newItems = items.map((item) =>
            item.sku === sku ? { ...item, quantity } : item
          );
          const subtotal = Math.round(newItems.reduce((acc, item) => acc + (item.price || 0) * item.quantity, 0));
          const totalTax = Math.round(newItems.reduce((acc, item) => acc + (item.taxAmount || 0) * item.quantity, 0));
          set({ items: newItems, subtotal, totalTax });
          if (appliedCoupons && appliedCoupons.length > 0) await get().revalidateCoupon();
        }
      },

      fetchShippingConfig: async () => {
        try {
          const response = await axiosInstance.get("/app-config");
          const config = response.data.data;
          if (config && config.shipping) {
            set({ 
              shippingRules: { 
                threshold: config.shipping.freeShippingThreshold, 
                fee: config.shipping.shippingFee 
              } 
            });
          }
        } catch (error) {
          console.error("Failed to fetch shipping config:", error);
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
            totalTax: response.data.data.totalTax || 0,
            itemCount: response.data.data.itemCount,
            error: null,
          });
          if (get().appliedCoupons && get().appliedCoupons.length > 0) await get().revalidateCoupon();
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
              productId: typeof item.productId === 'object' ? (item.productId as any)._id : item.productId,
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
        set({ items: [], subtotal: 0, itemCount: 0, appliedCoupon: null, appliedCoupons: [], discountAmount: 0 });
      },

      applyCoupon: async (code: string) => {
        try {
          set({ isLoading: true, error: null });
          const { items, appliedCoupons } = get();
          
          const itemsPayload = items.map((item) => ({
            productId: typeof item.productId === 'object' ? (item.productId as any)._id : item.productId,
            sku: item.sku,
            quantity: item.quantity,
          }));

          const response = await axiosInstance.post("/coupons/validate", { 
            code, 
            items: itemsPayload 
          });
          const { coupon, discountAmount, sellerId } = response.data.data;

          const couponWithDiscount = {
            ...coupon,
            appliedDiscount: discountAmount,
          };

          const sellerKey = sellerId || coupon.sellerId || "global";

          const filteredCoupons = (appliedCoupons || []).filter(
            (c) => (c.sellerId || "global") !== sellerKey
          );

          const newAppliedCoupons = [...filteredCoupons, couponWithDiscount];
          const totalDiscount = newAppliedCoupons.reduce((acc, c) => acc + (c.appliedDiscount || 0), 0);

          set({
            appliedCoupons: newAppliedCoupons,
            appliedCoupon: newAppliedCoupons[0] || null,
            discountAmount: totalDiscount,
            error: null
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.message || "Invalid coupon code"
          });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      removeCoupon: (code?: string) => {
        const { appliedCoupons } = get();
        if (!code) {
          set({ appliedCoupons: [], appliedCoupon: null, discountAmount: 0 });
          return;
        }

        const newAppliedCoupons = (appliedCoupons || []).filter((c) => c.code !== code);
        const totalDiscount = newAppliedCoupons.reduce((acc, c) => acc + (c.appliedDiscount || 0), 0);

        set({
          appliedCoupons: newAppliedCoupons,
          appliedCoupon: newAppliedCoupons[0] || null,
          discountAmount: totalDiscount,
        });
      },

      revalidateCoupon: async () => {
        const { appliedCoupons, items } = get();
        if (!appliedCoupons || appliedCoupons.length === 0) {
          set({ discountAmount: 0 });
          return;
        }

        const itemsPayload = items.map((item) => ({
          productId: typeof item.productId === 'object' ? (item.productId as any)._id : item.productId,
          sku: item.sku,
          quantity: item.quantity,
        }));

        // First do local quick calculation
        const localValidCoupons: ICoupon[] = [];
        for (const coupon of appliedCoupons) {
          const couponSellerId = coupon.sellerId;
          
          let sellerSubtotal = 0;
          for (const item of items) {
            const itemSellerId = item.sellerId;
            if (itemSellerId === couponSellerId) {
              if (coupon.appliesTo === "SPECIFIC") {
                const isEligible = coupon.productIds?.includes(item.productId);
                if (!isEligible) continue;
              }
              sellerSubtotal += (item.price || 0) * item.quantity;
            }
          }

          if (sellerSubtotal >= coupon.minOrderValue) {
            let localDiscount = 0;
            if (coupon.discountType === "PERCENTAGE") {
              localDiscount = (sellerSubtotal * coupon.discountValue) / 100;
              if (coupon.maxDiscountAmount && coupon.maxDiscountAmount > 0 && localDiscount > coupon.maxDiscountAmount) {
                localDiscount = coupon.maxDiscountAmount;
              }
            } else {
              localDiscount = Math.min(coupon.discountValue, sellerSubtotal);
            }
            localDiscount = Math.round(localDiscount);
            localValidCoupons.push({
              ...coupon,
              appliedDiscount: localDiscount,
            });
          }
        }

        const tempTotalDiscount = localValidCoupons.reduce((acc, c) => acc + (c.appliedDiscount || 0), 0);
        set({
          appliedCoupons: localValidCoupons,
          appliedCoupon: localValidCoupons[0] || null,
          discountAmount: tempTotalDiscount,
        });

        if (localValidCoupons.length === 0) return;

        // Parallel server validation
        try {
          const promises = localValidCoupons.map(async (coupon) => {
            try {
              const response = await axiosInstance.post("/coupons/validate", {
                code: coupon.code,
                items: itemsPayload
              });
              const { coupon: serverCoupon, discountAmount } = response.data.data;
              return {
                ...serverCoupon,
                appliedDiscount: discountAmount,
              };
            } catch (err) {
              return null;
            }
          });

          const serverResults = await Promise.all(promises);
          const finalCoupons = serverResults.filter((c): c is ICoupon => c !== null);
          const finalTotalDiscount = finalCoupons.reduce((acc, c) => acc + (c.appliedDiscount || 0), 0);

          set({
            appliedCoupons: finalCoupons,
            appliedCoupon: finalCoupons[0] || null,
            discountAmount: finalTotalDiscount,
          });
        } catch (error) {
          console.error("Error during server coupon revalidation:", error);
        }
      },

      handleStockUpdate: (data) => {
        const { items } = get();
        let wasAffected = false;

        const newItems = items.map((item) => {
          if (item.productId === data.productId && item.sku === data.sku) {
            wasAffected = true;
            const newStock = data.newStock;
            let stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" = "IN_STOCK";
            
            if (newStock <= 0) stockStatus = "OUT_OF_STOCK";
            else if (newStock < 5) stockStatus = "LOW_STOCK";

            return { 
              ...item, 
              availableStock: newStock,
              stockStatus 
            };
          }
          return item;
        });

        if (wasAffected) {
          console.log(`[CartStore] Updated stock for SKU ${data.sku}: ${data.newStock}`);
          set({ items: newItems });
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
        appliedCoupons: state.appliedCoupons,
        discountAmount: state.discountAmount
      }),
    }
  )
);
