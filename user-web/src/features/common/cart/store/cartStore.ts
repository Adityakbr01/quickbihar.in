import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";
import axiosInstance from "@/src/api/axiosInstance";
import { ICoupon } from "../../coupon/types/coupon.types";
import { useAuthStore } from "@/src/features/common/auth/store/authStore";
import { secureZustandStorage } from "@/src/lib/secureZustandStorage";

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
  /**
   * Storefront module that owns this line. Optional so carts persisted
   * before module tagging keep working — resolvers treat a missing
   * module as "clothing".
   */
  module?: CartModule;
}

/** Storefront cart modules sharing the single server cart. */
export type CartModule = "clothing" | "jewelery";

/**
 * Resolves a line's owning module. Lines persisted before module
 * tagging (and any line the server couldn't classify) belong to the
 * clothing cart.
 */
export function resolveCartItemModule(
  item: Pick<CartItem, "module">,
): CartModule {
  return item.module ?? "clothing";
}

/** Lines belonging to one module's bag only. */
export function filterItemsByModule(
  items: CartItem[],
  module: CartModule,
): CartItem[] {
  return items.filter((i) => resolveCartItemModule(i) === module);
}

/** Subtotal / tax / line-count for an explicit item list (usually one module's). */
export function totalsForItems(items: CartItem[]): {
  subtotal: number;
  totalTax: number;
  itemCount: number;
} {
  return {
    subtotal: items.reduce((acc, item) => acc + (item.price || 0) * item.quantity, 0),
    totalTax: items.reduce((acc, item) => acc + (item.taxAmount || 0) * item.quantity, 0),
    itemCount: items.length,
  };
}

/**
 * Pick the cart lines a coupon actually discounts.
 *
 * Mirrors the same seller + appliesTo + productIds rules the server enforces in
 * `validateCouponForCart`, so the client preview matches what the buyer will
 * see at checkout.
 */
export function pickCouponItems(
  coupon: ICoupon,
  items: CartItem[],
): AppliedCouponItemCoverage[] {
  const couponSellerId = coupon.sellerId?.toString();
  const coverage: AppliedCouponItemCoverage[] = [];

  for (const item of items) {
    const itemSellerId = item.sellerId?.toString();
    if (couponSellerId && itemSellerId && itemSellerId !== couponSellerId) {
      continue;
    }
    if (coupon.appliesTo === "SPECIFIC") {
      const itemId =
        typeof item.productId === "object"
          ? (item.productId as any)?._id
          : item.productId;
      const matched = coupon.productIds?.some(
        (id) => id.toString() === itemId?.toString(),
      );
      if (!matched) continue;
    }
    const linePrice = item.price || 0;
    const lineQty = item.quantity || 0;
    coverage.push({
      sku: item.sku,
      name: item.productTitle || "Product",
      price: linePrice,
      quantity: lineQty,
      lineSubtotal: linePrice * lineQty,
    });
  }
  return coverage;
}

/** Per-item coverage snapshot stored alongside an applied coupon. */
export interface AppliedCouponItemCoverage {
  sku: string;
  name: string;
  price: number;
  quantity: number;
  lineSubtotal: number;
}

/**
 * Recomputes every applied coupon against an explicit item list (used
 * when a module's lines are cleared while other modules keep theirs).
 * Coupons covering nothing in the remaining items are dropped.
 */
function pruneCouponsForItems(
  coupons: AppliedCoupon[],
  items: CartItem[],
): { appliedCoupons: AppliedCoupon[]; discountAmount: number } {
  const kept: AppliedCoupon[] = [];
  for (const coupon of coupons) {
    const appliedItems = pickCouponItems(coupon, items);
    if (appliedItems.length === 0) continue;
    const sub = appliedItems.reduce((acc, m) => acc + m.lineSubtotal, 0);
    if (sub < (coupon.minOrderValue || 0)) continue;
    let discount = 0;
    if (coupon.discountType === "PERCENTAGE") {
      discount = (sub * coupon.discountValue) / 100;
      if (
        coupon.maxDiscountAmount &&
        coupon.maxDiscountAmount > 0 &&
        discount > coupon.maxDiscountAmount
      ) {
        discount = coupon.maxDiscountAmount;
      }
    } else {
      discount = Math.min(coupon.discountValue, sub);
    }
    kept.push({
      ...coupon,
      appliedDiscount: Math.round(discount),
      appliedItems,
    });
  }
  return {
    appliedCoupons: kept,
    discountAmount: kept.reduce((acc, c) => acc + (c.appliedDiscount || 0), 0),
  };
}

/** Augments ICoupon with the items the coupon actually discounted and the final discount. */
export type AppliedCoupon = ICoupon & {
  appliedDiscount: number;
  appliedItems: AppliedCouponItemCoverage[];
};

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
  appliedCoupon: AppliedCoupon | null;
  appliedCoupons: AppliedCoupon[];
  discountAmount: number;

  // Actions
  fetchShippingConfig: () => Promise<void>;
  addItem: (product: any, sku: string, quantity?: number, module?: CartModule) => Promise<void>;
  removeItem: (sku: string) => Promise<void>;
  updateQuantity: (sku: string, quantity: number) => Promise<void>;
  fetchCart: () => Promise<void>;
  syncLocalCart: () => Promise<void>;
  clearCart: (module?: CartModule) => Promise<void>;
  applyCoupon: (code: string, optimisticCoupon?: ICoupon, scopeItems?: CartItem[]) => Promise<void>;
  removeCoupon: (code?: string) => void;
  revalidateCoupon: () => Promise<void>;
  handleStockUpdate: (data: { productId: string; sku: string; newStock: number }) => void;
}



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

      addItem: async (product, sku, quantity = 1, module: CartModule = "clothing") => {
        const { isAuthenticated } = useAuthStore.getState();
        const { items } = get();
        const previousItems = items;
        const previousSubtotal = get().subtotal;
        const previousTotalTax = get().totalTax;
        const previousItemCount = get().itemCount;

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
            module,
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

        // Optimistic local update — happens BEFORE the network call so the
        // user sees the new line item, new subtotal, and updated coupon
        // discount immediately.
        const newSubtotal = newItems.reduce(
          (acc, item) => acc + (item.price || 0) * item.quantity,
          0,
        );
        const newTotalTax = newItems.reduce(
          (acc, item) => acc + (item.taxAmount || 0) * item.quantity,
          0,
        );
        set({
          items: newItems,
          itemCount: newItems.length,
          subtotal: newSubtotal,
          totalTax: newTotalTax,
          error: null,
        });
        if (get().appliedCoupons.length > 0) await get().revalidateCoupon();

        if (!isAuthenticated) return; // Guest mode: local update is final.

        try {
          await axiosInstance.post("/cart/add", {
            productId: typeof product._id === 'object' ? product._id.toString() : (product._id || product.id),
            sku,
            quantity,
          });
          // No full fetchCart() — the server now matches local state and a
          // full refetch would flicker the price counters.
        } catch (error: any) {
          // Rollback: restore the previous items + totals.
          set({
            items: previousItems,
            itemCount: previousItemCount,
            subtotal: previousSubtotal,
            totalTax: previousTotalTax,
            error: error.response?.data?.message || "Failed to add item to cart",
          });
          if (get().appliedCoupons.length > 0) await get().revalidateCoupon();
          throw error;
        }
      },

      removeItem: async (sku) => {
        const { isAuthenticated } = useAuthStore.getState();
        const { items } = get();
        const previousItems = items;
        const previousSubtotal = get().subtotal;
        const previousTotalTax = get().totalTax;
        const previousItemCount = get().itemCount;
        const previousAppliedCoupons = get().appliedCoupons;
        const previousDiscountAmount = get().discountAmount;

        // Optimistic: drop the line immediately, recompute totals, and
        // recompute the coupon discount locally (the coupon is no longer
        // valid for an item that's gone, so the discount should drop too).
        const newItems = items.filter((item) => item.sku !== sku);
        const newSubtotal = Math.round(
          newItems.reduce((acc, item) => acc + (item.price || 0) * item.quantity, 0),
        );
        const newTotalTax = Math.round(
          newItems.reduce((acc, item) => acc + (item.taxAmount || 0) * item.quantity, 0),
        );

        // Recompute coupon discounts against the post-removal items.
        const newAppliedCoupons: AppliedCoupon[] = [];
        for (const coupon of previousAppliedCoupons) {
          const appliedItems = pickCouponItems(coupon, newItems);
          if (appliedItems.length === 0) continue; // coupon no longer valid
          const sub = appliedItems.reduce((acc, m) => acc + m.lineSubtotal, 0);
          if (sub < (coupon.minOrderValue || 0)) continue;
          let discount = 0;
          if (coupon.discountType === "PERCENTAGE") {
            discount = (sub * coupon.discountValue) / 100;
            if (
              coupon.maxDiscountAmount &&
              coupon.maxDiscountAmount > 0 &&
              discount > coupon.maxDiscountAmount
            ) {
              discount = coupon.maxDiscountAmount;
            }
          } else {
            discount = Math.min(coupon.discountValue, sub);
          }
          newAppliedCoupons.push({
            ...coupon,
            appliedDiscount: Math.round(discount),
            appliedItems,
          });
        }
        const newDiscountAmount = newAppliedCoupons.reduce(
          (acc, c) => acc + (c.appliedDiscount || 0),
          0,
        );

        set({
          items: newItems,
          itemCount: newItems.length,
          subtotal: newSubtotal,
          totalTax: newTotalTax,
          appliedCoupons: newAppliedCoupons,
          appliedCoupon: newAppliedCoupons[0] || null,
          discountAmount: newDiscountAmount,
          error: null,
        });

        if (!isAuthenticated) return;

        try {
          await axiosInstance.delete(`/cart/remove/${sku}`);
        } catch (error: any) {
          // Rollback to the exact pre-removal snapshot.
          set({
            items: previousItems,
            itemCount: previousItemCount,
            subtotal: previousSubtotal,
            totalTax: previousTotalTax,
            appliedCoupons: previousAppliedCoupons,
            appliedCoupon: previousAppliedCoupons[0] || null,
            discountAmount: previousDiscountAmount,
            error: error.response?.data?.message || "Failed to remove item",
          });
          throw error;
        }
      },

      updateQuantity: async (sku, quantity) => {
        const { isAuthenticated } = useAuthStore.getState();
        const { items } = get();
        const previousItems = items;
        const previousSubtotal = get().subtotal;
        const previousTotalTax = get().totalTax;
        const previousAppliedCoupons = get().appliedCoupons;
        const previousDiscountAmount = get().discountAmount;

        // Optimistic: apply the new quantity, recompute totals, recompute
        // the coupon discount against the new item list. All synchronous —
        // the AnimatedPrice counters and the "You saved" line reflect the
        // new value on the very next paint.
        const newItems = items.map((item) =>
          item.sku === sku ? { ...item, quantity } : item,
        );
        const newSubtotal = Math.round(
          newItems.reduce((acc, item) => acc + (item.price || 0) * item.quantity, 0),
        );
        const newTotalTax = Math.round(
          newItems.reduce((acc, item) => acc + (item.taxAmount || 0) * item.quantity, 0),
        );

        const newAppliedCoupons: AppliedCoupon[] = [];
        for (const coupon of previousAppliedCoupons) {
          const appliedItems = pickCouponItems(coupon, newItems);
          if (appliedItems.length === 0) continue;
          const sub = appliedItems.reduce((acc, m) => acc + m.lineSubtotal, 0);
          if (sub < (coupon.minOrderValue || 0)) continue;
          let discount = 0;
          if (coupon.discountType === "PERCENTAGE") {
            discount = (sub * coupon.discountValue) / 100;
            if (
              coupon.maxDiscountAmount &&
              coupon.maxDiscountAmount > 0 &&
              discount > coupon.maxDiscountAmount
            ) {
              discount = coupon.maxDiscountAmount;
            }
          } else {
            discount = Math.min(coupon.discountValue, sub);
          }
          newAppliedCoupons.push({
            ...coupon,
            appliedDiscount: Math.round(discount),
            appliedItems,
          });
        }
        const newDiscountAmount = newAppliedCoupons.reduce(
          (acc, c) => acc + (c.appliedDiscount || 0),
          0,
        );

        set({
          items: newItems,
          subtotal: newSubtotal,
          totalTax: newTotalTax,
          appliedCoupons: newAppliedCoupons,
          appliedCoupon: newAppliedCoupons[0] || null,
          discountAmount: newDiscountAmount,
          error: null,
        });

        if (!isAuthenticated) return;

        try {
          await axiosInstance.patch("/cart/update", { sku, quantity });
        } catch (error: any) {
          // Rollback to the exact pre-update snapshot.
          set({
            items: previousItems,
            subtotal: previousSubtotal,
            totalTax: previousTotalTax,
            appliedCoupons: previousAppliedCoupons,
            appliedCoupon: previousAppliedCoupons[0] || null,
            discountAmount: previousDiscountAmount,
            error: error.response?.data?.message || "Failed to update quantity",
          });
          throw error;
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

      clearCart: async (module?: CartModule) => {
        const { isAuthenticated } = useAuthStore.getState();
        if (isAuthenticated) {
          await axiosInstance.delete("/cart/clear", module ? { params: { module } } : undefined);
        }
        if (!module) {
          set({ items: [], subtotal: 0, totalTax: 0, itemCount: 0, appliedCoupon: null, appliedCoupons: [], discountAmount: 0, error: null });
          return;
        }
        // Scoped clear (e.g. after a jewelery order): drop only this
        // module's lines, recompute totals, and prune coupons that no
        // longer cover anything in the remaining items.
        const { items, appliedCoupons } = get();
        const remaining = items.filter((i) => resolveCartItemModule(i) !== module);
        const totals = totalsForItems(remaining);
        const coupons = pruneCouponsForItems(appliedCoupons, remaining);
        set({
          items: remaining,
          subtotal: totals.subtotal,
          totalTax: totals.totalTax,
          itemCount: totals.itemCount,
          appliedCoupons: coupons.appliedCoupons,
          appliedCoupon: coupons.appliedCoupons[0] || null,
          discountAmount: coupons.discountAmount,
          error: null,
        });
      },

      applyCoupon: async (code: string, optimisticCoupon?: ICoupon, scopeItems?: CartItem[]) => {
        const { appliedCoupons } = get();
        // Coupon math runs against one module's lines (the bag the buyer
        // is shopping) so a clothing coupon can never feed off jewelery
        // lines or vice versa.
        const items = scopeItems ?? get().items;
        const previousAppliedCoupons = appliedCoupons;
        const previousDiscountAmount = get().discountAmount;

        const itemsPayload = items.map((item) => ({
          productId: typeof item.productId === 'object' ? (item.productId as any)._id : item.productId,
          sku: item.sku,
          quantity: item.quantity,
        }));

        // ---- Optimistic phase ------------------------------------------------
        // If the caller (the bottom sheet) hands us the full coupon object we
        // can preview the discount locally and apply it instantly, then
        // reconcile with the server's authoritative value (or roll back on
        // failure). When the coupon is unknown (manual code entry) we fall
        // back to the legacy "wait for the server" path.
        let optimisticApplied: AppliedCoupon | null = null;
        if (optimisticCoupon) {
          const appliedItems = pickCouponItems(optimisticCoupon, items);
          if (appliedItems.length > 0) {
            const sub = appliedItems.reduce((acc, m) => acc + m.lineSubtotal, 0);
            if (sub >= (optimisticCoupon.minOrderValue || 0)) {
              let discount = 0;
              if (optimisticCoupon.discountType === "PERCENTAGE") {
                discount = (sub * (optimisticCoupon.discountValue || 0)) / 100;
                if (
                  optimisticCoupon.maxDiscountAmount &&
                  optimisticCoupon.maxDiscountAmount > 0 &&
                  discount > optimisticCoupon.maxDiscountAmount
                ) {
                  discount = optimisticCoupon.maxDiscountAmount;
                }
              } else {
                discount = Math.min(optimisticCoupon.discountValue || 0, sub);
              }
              const sellerKey =
                optimisticCoupon.sellerId?.toString() || "global";
              const filtered = previousAppliedCoupons.filter(
                (c) => (c.sellerId || "global") !== sellerKey,
              );
              optimisticApplied = {
                ...optimisticCoupon,
                appliedDiscount: Math.round(discount),
                appliedItems,
              };
              const newAppliedCoupons = [...filtered, optimisticApplied];
              const newTotal = newAppliedCoupons.reduce(
                (acc, c) => acc + (c.appliedDiscount || 0),
                0,
              );
              set({
                appliedCoupons: newAppliedCoupons,
                appliedCoupon: newAppliedCoupons[0] || null,
                discountAmount: newTotal,
                error: null,
              });
            }
          }
        }

        // ---- Server reconciliation ------------------------------------------
        try {
          const response = await axiosInstance.post("/coupons/validate", {
            code,
            items: itemsPayload,
          });
          const { coupon, discountAmount, sellerId } = response.data.data;
          const appliedItems = pickCouponItems(coupon, items);
          const couponWithDiscount: AppliedCoupon = {
            ...coupon,
            appliedDiscount: discountAmount,
            appliedItems,
          };
          const sellerKey = sellerId || coupon.sellerId || "global";
          const filteredCoupons = previousAppliedCoupons.filter(
            (c) => (c.sellerId || "global") !== sellerKey,
          );
          const newAppliedCoupons = [...filteredCoupons, couponWithDiscount];
          const totalDiscount = newAppliedCoupons.reduce(
            (acc, c) => acc + (c.appliedDiscount || 0),
            0,
          );
          set({
            appliedCoupons: newAppliedCoupons,
            appliedCoupon: newAppliedCoupons[0] || null,
            discountAmount: totalDiscount,
            error: null,
          });
        } catch (error: any) {
          // Roll back the optimistic coupon if we applied one.
          if (optimisticApplied) {
            set({
              appliedCoupons: previousAppliedCoupons,
              appliedCoupon: previousAppliedCoupons[0] || null,
              discountAmount: previousDiscountAmount,
              error: error.response?.data?.message || "Invalid coupon code",
            });
          } else {
            set({
              error: error.response?.data?.message || "Invalid coupon code",
            });
          }
          throw error;
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
        const localValidCoupons: AppliedCoupon[] = [];
        for (const coupon of appliedCoupons) {
          const appliedItems = pickCouponItems(coupon, items);
          const sellerSubtotal = appliedItems.reduce(
            (acc, m) => acc + m.lineSubtotal,
            0,
          );

          if (sellerSubtotal >= (coupon.minOrderValue || 0) && appliedItems.length > 0) {
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
              appliedItems,
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
                appliedItems: pickCouponItems(serverCoupon, items),
              } as AppliedCoupon;
            } catch (err) {
              return null;
            }
          });

          const serverResults = await Promise.all(promises);
          const finalCoupons = serverResults.filter((c): c is AppliedCoupon => c !== null);
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
      storage: createJSONStorage(() => secureZustandStorage),
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
