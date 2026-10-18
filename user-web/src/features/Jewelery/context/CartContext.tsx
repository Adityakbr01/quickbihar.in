
import * as Haptics from "@/lib/haptics";
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
  const resolvedId =
    typeof item.productId === "object"
      ? ((item.productId as any)?._id || (item.productId as any)?.id)?.toString()
      : String(item.productId || "");
  const resolvedImage =
    typeof item.image === "object"
      ? (item.image as any)?.url || (item.image as any)?.uri || ""
      : typeof item.image === "string"
        ? item.image
        : "";
  return {
    id: resolvedId,
    name: item.productTitle ?? "Jewellery",
    subtitle: "",
    price: item.price ?? 0,
    originalPrice: item.originalPrice,
    rating: 0,
    reviewCount: 0,
    collection: "",
    metal: "",
    occasions: [],
    description: "",
    craftDetail: "",
    image: resolvedImage ? { uri: resolvedImage } : null,
    images: resolvedImage ? [{ uri: resolvedImage }] : [],
    inStock: item.availableStock ?? 10,
  };
}

function defaultSkuFor(raw: NonNullable<Product["_raw"]>): string | null {
  const variants = raw.variants ?? [];
  const inStock = variants.find((v) => (v.stock ?? 0) > 0);
  return (inStock ?? variants[0])?.sku ?? null;
}

function synthesizeRaw(product: Product): any {
  return {
    _id: product.id,
    id: product.id,
    title: product.name,
    price: product.price,
    originalPrice: product.originalPrice ?? product.price,
    images: Array.isArray(product.images) && product.images.length
      ? product.images.map((img: any) => ({ url: typeof img === 'string' ? img : img?.uri || "" }))
      : product.image ? [{ url: typeof product.image === 'string' ? product.image : product.image?.uri || "" }] : [],
    variants: [{ sku: `JWL-${product.id}`, stock: product.inStock ?? 10 }],
    totalStock: product.inStock ?? 10,
    vertical: "JEWELERY",
  };
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
    try {
      window.localStorage?.removeItem("jewelery_cart");
      window.localStorage?.removeItem("jewelery_wishlist");
    } catch {}
  }, []);

  const skuForProduct = useCallback(
    (productIdOrSku: string) =>
      storeItems.find((i) => {
        const id =
          typeof i.productId === "object"
            ? ((i.productId as any)?._id || (i.productId as any)?.id)?.toString()
            : String(i.productId || "");
        return id === productIdOrSku || i.sku === productIdOrSku;
      })?.sku,
    [storeItems],
  );

  const addToCart = useCallback(async (product: Product): Promise<boolean> => {
    if (!product) return false;
    const raw = product._raw ?? synthesizeRaw(product);
    // SKU fallback chain: in-stock variant → first variant with any sku →
    // product-level sku (simple products without variants).
    const variants = raw.variants ?? [];
    const sku =
      defaultSkuFor(raw) ??
      variants.find((v: any) => v?.sku)?.sku ??
      (raw as any).sku ??
      `JWL-${product.id}`;

    try {
      await useCartStore.getState().addItem(raw, sku, 1, "jewelery");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return true;
    } catch (err) {
      console.error("[JeweleryCart] Failed to add item to bag:", err);
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

export function useCart(): CartContextType {
  const ctx = useContext(CartContext);
  if (ctx) return ctx;

  // Resilient fallback when CartProvider is not in the ancestor tree:
  // delegates directly to the underlying Zustand store.
  const allStoreItems = useCartStore.getState().items;
  const storeItems = filterItemsByModule(allStoreItems, "jewelery");
  const totals = totalsForItems(storeItems);

  return {
    cartItems: storeItems.map((item) => ({
      product: liteProductFromStoreItem(item),
      quantity: item.quantity,
      sku: item.sku,
    })),
    wishlist: useWishlistStore.getState().items,
    addToCart: async (product: Product) => {
      if (!product) return false;
      const raw = product._raw ?? synthesizeRaw(product);
      const variants = raw.variants ?? [];
      const sku =
        defaultSkuFor(raw) ??
        variants.find((v: any) => v?.sku)?.sku ??
        (raw as any).sku ??
        `JWL-${product.id}`;
      try {
        await useCartStore.getState().addItem(raw, sku, 1, "jewelery");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return true;
      } catch (err) {
        console.error("[JeweleryCart direct fallback] Failed to add item:", err);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return false;
      }
    },
    removeFromCart: (productId: string) => {
      const all = useCartStore.getState().items;
      const item = all.find((i) => {
        const id =
          typeof i.productId === "object"
            ? ((i.productId as any)?._id || (i.productId as any)?.id)?.toString()
            : String(i.productId || "");
        return id === productId || i.sku === productId;
      });
      if (item) void useCartStore.getState().removeItem(item.sku);
    },
    updateQuantity: (productId: string, quantity: number) => {
      const all = useCartStore.getState().items;
      const item = all.find((i) => {
        const id =
          typeof i.productId === "object"
            ? ((i.productId as any)?._id || (i.productId as any)?.id)?.toString()
            : String(i.productId || "");
        return id === productId || i.sku === productId;
      });
      if (!item) return;
      if (quantity < 1) {
        void useCartStore.getState().removeItem(item.sku);
        return;
      }
      void useCartStore.getState().updateQuantity(item.sku, quantity);
    },
    toggleWishlist: (product: Product) => {
      void useWishlistStore.getState().toggleItem(product.id, product._raw, "jewelery");
    },
    isWishlisted: (productId: string) => useWishlistStore.getState().items.includes(productId),
    cartCount: totals.itemCount,
    cartTotal: totals.subtotal,
    clearCart: () => void useCartStore.getState().clearCart("jewelery"),
  };
}
