import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { Product } from "@/src/features/Jewelery/data/products";

interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  wishlist: string[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  toggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  cartCount: number;
  cartTotal: number;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [cartData, wishlistData] = await Promise.all([
          // ponytail: mock cart keys — prefixed to avoid collision with common/cart cartStore
          AsyncStorage.getItem("jewelery_cart"),
          AsyncStorage.getItem("jewelery_wishlist"),
        ]);
        if (cartData) setCartItems(JSON.parse(cartData));
        if (wishlistData) setWishlist(JSON.parse(wishlistData));
      } catch {}
    };
    load();
  }, []);

  const saveCart = useCallback(async (items: CartItem[]) => {
    try {
      await AsyncStorage.setItem("jewelery_cart", JSON.stringify(items));
    } catch {}
  }, []);

  const saveWishlist = useCallback(async (items: string[]) => {
    try {
      await AsyncStorage.setItem("jewelery_wishlist", JSON.stringify(items));
    } catch {}
  }, []);

  const addToCart = useCallback(
    (product: Product) => {
      setCartItems((prev) => {
        const existing = prev.find((i) => i.product.id === product.id);
        const updated = existing
          ? prev.map((i) =>
              i.product.id === product.id
                ? { ...i, quantity: i.quantity + 1 }
                : i,
            )
          : [...prev, { product, quantity: 1 }];
        saveCart(updated);
        return updated;
      });
    },
    [saveCart],
  );

  const removeFromCart = useCallback(
    (productId: string) => {
      setCartItems((prev) => {
        const updated = prev.filter((i) => i.product.id !== productId);
        saveCart(updated);
        return updated;
      });
    },
    [saveCart],
  );

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity < 1) {
        removeFromCart(productId);
        return;
      }
      setCartItems((prev) => {
        const updated = prev.map((i) =>
          i.product.id === productId ? { ...i, quantity } : i,
        );
        saveCart(updated);
        return updated;
      });
    },
    [removeFromCart, saveCart],
  );

  const toggleWishlist = useCallback(
    (productId: string) => {
      setWishlist((prev) => {
        const updated = prev.includes(productId)
          ? prev.filter((id) => id !== productId)
          : [...prev, productId];
        saveWishlist(updated);
        return updated;
      });
    },
    [saveWishlist],
  );

  const isWishlisted = useCallback(
    (productId: string) => wishlist.includes(productId),
    [wishlist],
  );

  const clearCart = useCallback(() => {
    setCartItems([]);
    saveCart([]);
  }, [saveCart]);

  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = cartItems.reduce(
    (sum, i) => sum + i.product.price * i.quantity,
    0,
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        wishlist,
        addToCart,
        removeFromCart,
        updateQuantity,
        toggleWishlist,
        isWishlisted,
        cartCount,
        cartTotal,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
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
