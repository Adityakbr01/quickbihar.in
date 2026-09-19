import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react";

import { useCartStore, type CartItem as StoreCartItem } from "@/src/features/common/cart/store/cartStore";
import { useWishlistStore } from "@/src/features/common/wishlist/store/wishlistStore";
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
  addToCart: (product: Product) => void;
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
 * server cart, quote → order → Razorpay pipeline as clothing.
 *
 * Legacy local-only keys (jewelery_cart/jewelery_wishlist) are retired: the
 * shared stores persist + sync to the server themselves.
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const storeItems = useCartStore((s) => s.items);
  const storeCount = useCartStore((s) => s.itemCount);
  const storeSubtotal = useCartStore((s) => s.subtotal);
  const wishlistItems = useWishlistStore((s) => s.items);

  useEffect(() => {
    AsyncStorage.multiRemove(["jewelery_cart", "jewelery_wishlist"]).catch(() => {});
  }, []);

  const skuForProduct = useCallback(
    (productId: string) => storeItems.find((i) => i.productId === productId)?.sku,
    [storeItems]
  );

  const addToCart = useCallback((product: Product) => {
    const raw = product._raw;
    if (!raw) return;
    const sku = defaultSkuFor(raw);
    if (!sku) return;
    void useCartStore.getState().addItem(raw, sku, 1);
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
    void useWishlistStore.getState().toggleItem(product.id, product._raw);
  }, []);

  const isWishlisted = useCallback(
    (productId: string) => wishlistItems.includes(productId),
    [wishlistItems]
  );

  const clearCart = useCallback(() => {
    void useCartStore.getState().clearCart();
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
  addToCart: () => {},
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
