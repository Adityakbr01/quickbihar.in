import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react";

import { useCartStore, type CartItem as StoreCartItem, filterItemsByModule, totalsForItems } from "@/src/features/common/cart/store/cartStore";
import { useWishlistStore, resolveWishlistModule } from "@/src/features/common/wishlist/store/wishlistStore";
import { Product } from "@/src/features/Jewelery/data/products";

interface CartItem {
  product: Product;
  quantity: number;
  /** Server variant SKU behind this line (needed for update/remove). */
  sku: string;
}

interface CartContextType {
  cartItems: CartItem[];
  wishlist: string[];
  /** Adds one unit; resolves false (with an error haptic) when there is no sellable variant or the server rejects — never fails silently. */
  addToCart: (product: Product) => Promise<boolean>;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  toggleWishlist: (product: Product) => void;
  isWishlisted: (productId: string) => boolean;
  cartCount: number;
  cartTotal: number;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

function liteProductFromStoreItem(item: StoreCartItem): Product {
  return {
    id: item.productId,
    name: item.productTitle ?? "Jewellery",
    subtitle: "",
    price: item.price ?? 0,
    rating: 0,
    reviewCount: 0,
    collection: "",
    metal: "",
    occasions: [],
    description: "",
    craftDetail: "",
    image: item.image ? { uri: item.image } : null,
    images: item.image ? [{ uri: item.image }] : [],
    inStock: item.availableStock ?? 0,
  };
}

function defaultSkuFor(raw: NonNullable<Product["_raw"]>): string | null {
  const variants = raw.variants ?? [];
  const inStock = variants.find((v) => (v.stock ?? 0) > 0);
  return (inStock ?? variants[0])?.sku ?? null;
}

/**
 * Jewelery cart/wishlist bridge — delegates to the single shared commerce
 * stores (useCartStore + useWishlistStore) so jewelry flows through the same
 * server cart, quote → order → Razorpay pipeline as clothing, while the
 * module-scoped views below keep jewelery lines out of the clothing bag,
 * wishlist, and checkout (and vice versa).
 *
 * Legacy local-only keys (jewelery_cart/jewelery_wishlist) are retired: the
 * shared stores persist + sync to the server themselves.
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  // Jewelery bag sees ONLY jewelery lines — clothing lines live in the
  // clothing cart even though both modules share the server cart.
  const allStoreItems = useCartStore((s) => s.items);
  const storeItems = useMemo(
    () => filterItemsByModule(allStoreItems, "jewelery"),
    [allStoreItems],
  );
  const totals = useMemo(() => totalsForItems(storeItems), [storeItems]);
  const storeCount = totals.itemCount;
  const storeSubtotal = totals.subtotal;
  const allWishlistIds = useWishlistStore((s) => s.items);
  const wishlistModules = useWishlistStore((s) => s.modules);
  const wishlistCache = useWishlistStore((s) => s.cachedProducts);
  const wishlistItems = useMemo(
    () =>
      allWishlistIds.filter(
        (id) => resolveWishlistModule(id, wishlistModules, wishlistCache) === "jewelery",
      ),
    [allWishlistIds, wishlistModules, wishlistCache],
  );

  useEffect(() => {
    AsyncStorage.multiRemove(["jewelery_cart", "jewelery_wishlist"]).catch(() => {});
  }, []);

  const skuForProduct = useCallback(
    (productId: string) => storeItems.find((i) => i.productId === productId)?.sku,
    [storeItems]
  );

  const addToCart = useCallback(async (product: Product): Promise<boolean> => {
    const raw = product._raw;
    if (!raw) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return false;
    }
    // SKU fallback chain: in-stock variant → first variant with any sku →
    // product-level sku (simple products without variants).
    const variants = raw.variants ?? [];
    const sku =
      defaultSkuFor(raw) ??
      variants.find((v: any) => v?.sku)?.sku ??
      (raw as any).sku ??
      null;
    if (!sku) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return false;
    }
    try {
      await useCartStore.getState().addItem(raw, sku, 1, "jewelery");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return true;
    } catch {
      // Server rejections (e.g. just went out of stock → optimistic
      // rollback) previously vanished into `void`; now they buzz + report.
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return false;
    }
  }, []);

  const removeFromCart = useCallback(
    (productId: string) => {
      const sku = skuForProduct(productId);
      if (sku) void useCartStore.getState().removeItem(sku);
    },
    [skuForProduct]
  );

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      const sku = skuForProduct(productId);
      if (!sku) return;
      if (quantity < 1) {
        void useCartStore.getState().removeItem(sku);
        return;
      }
      void useCartStore.getState().updateQuantity(sku, quantity);
    },
    [skuForProduct]
  );

  const toggleWishlist = useCallback((product: Product) => {
    if (!product?.id) return;
    void useWishlistStore.getState().toggleItem(product.id, product._raw, "jewelery");
  }, []);

  const isWishlisted = useCallback(
    (productId: string) => wishlistItems.includes(productId),
    [wishlistItems]
  );

  const clearCart = useCallback(() => {
    void useCartStore.getState().clearCart("jewelery");
  }, []);

  const cartItems = useMemo<CartItem[]>(
    () =>
      storeItems.map((item) => ({
        product: liteProductFromStoreItem(item),
        quantity: item.quantity,
        sku: item.sku,
      })),
    [storeItems]
  );

  const value = useMemo<CartContextType>(
    () => ({
      cartItems,
      wishlist: wishlistItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      toggleWishlist,
      isWishlisted,
      cartCount: storeCount,
      cartTotal: storeSubtotal,
      clearCart,
    }),
    [cartItems, wishlistItems, addToCart, removeFromCart, updateQuantity, toggleWishlist, isWishlisted, storeCount, storeSubtotal, clearCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

const defaultCartContext: CartContextType = {
  cartItems: [],
  wishlist: [],
  addToCart: async () => false,
  removeFromCart: () => {},
  updateQuantity: () => {},
  toggleWishlist: () => {},
  isWishlisted: () => false,
  cartCount: 0,
  cartTotal: 0,
  clearCart: () => {},
};

export function useCart() {
  const ctx = useContext(CartContext);
  return ctx ?? defaultCartContext;
}
