import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import { renderWithProviders, LocationDisplay } from "@/src/test/test-utils";
import { ProductCard } from "@/src/features/Jewelery/components/ProductCard";
import JeweleryProductDetailScreen from "@/src/features/Jewelery/screens/JeweleryProductDetailScreen";
import JeweleryCartScreen from "@/src/features/Jewelery/screens/JeweleryCartScreen";
import EmptyCart from "@/src/features/common/cart/components/EmptyCart";
import { CartProvider } from "@/src/features/Jewelery/context/CartContext";
import { useCartStore, filterItemsByModule } from "@/src/features/common/cart/store/cartStore";
import { Route, Routes } from "react-router-dom";
import type { Product } from "@/src/features/Jewelery/data/products";

vi.mock("@/lib/haptics", () => ({
  notificationAsync: vi.fn(),
  impactAsync: vi.fn(),
  NotificationFeedbackType: { Success: "success", Error: "error", Warning: "warning" },
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
}));

vi.mock("@/src/analytics/googleAnalytics", () => ({
  trackAddToCartLine: vi.fn(),
  trackRemoveFromCartLine: vi.fn(),
  trackBeginCheckout: vi.fn(),
  trackViewItem: vi.fn(),
}));

const mockJeweleryProduct: Product = {
  id: "645a2c2b8f8f2b1a2c3d4e01",
  name: "22K Gold Diamond Necklace",
  subtitle: "22K Yellow Gold",
  price: 45000,
  originalPrice: 50000,
  rating: 4.8,
  reviewCount: 12,
  collection: "Necklaces",
  metal: "22K Yellow Gold",
  stone: "Natural Diamond",
  occasions: ["Wedding", "Bridal"],
  description: "Exquisite bridal jewellery handcrafted in Bihar.",
  craftDetail: "Hallmarked 22K gold with certified diamonds.",
  image: { uri: "https://example.com/necklace.jpg" },
  images: [{ uri: "https://example.com/necklace.jpg" }],
  inStock: 8,
  _raw: {
    _id: "645a2c2b8f8f2b1a2c3d4e01",
    id: "645a2c2b8f8f2b1a2c3d4e01",
    title: "22K Gold Diamond Necklace",
    price: 45000,
    originalPrice: 50000,
    images: [{ url: "https://example.com/necklace.jpg" }],
    variants: [
      {
        sku: "JWL-NECK-001",
        stock: 8,
        price: 45000,
        size: "18 inch",
        color: "Yellow Gold",
      },
    ],
    totalStock: 8,
    vertical: "JEWELERY",
  } as any,
};

const mockProductWithoutRaw: Product = {
  id: "jwl-earring-99",
  name: "Kundan Chandbali Earrings",
  subtitle: "22K Kundan",
  price: 18500,
  rating: 4.9,
  reviewCount: 25,
  collection: "Earrings",
  metal: "Gold",
  occasions: ["Festive"],
  description: "Traditional royal Kundan Chandbalis.",
  craftDetail: "Handcrafted Kundan.",
  image: { uri: "https://example.com/earring.jpg" },
  images: [{ uri: "https://example.com/earring.jpg" }],
  inStock: 5,
};

vi.mock("@/src/features/Jewelery/hooks/useJeweleryCatalog", () => ({
  useJeweleryProduct: vi.fn((id?: string) => ({
    data: id === mockJeweleryProduct.id ? mockJeweleryProduct : undefined,
    isLoading: false,
  })),
  useSimilarJewelery: vi.fn(() => ({
    data: [],
    isLoading: false,
  })),
}));

vi.mock("@/src/features/clothing/product/hooks/useProducts", () => ({
  useProductReviews: vi.fn(() => ({ data: { reviews: [], stats: { totalReviews: 0, averageRating: 0 } } })),
  useCreateProductReview: vi.fn(() => ({ mutateAsync: vi.fn() })),
  useVoteHelpfulReview: vi.fn(() => ({ mutateAsync: vi.fn() })),
}));

describe("Jewellery Add to Bag & Cart Flow", () => {
  beforeEach(() => {
    useCartStore.setState({
      items: [],
      subtotal: 0,
      totalTax: 0,
      itemCount: 0,
      appliedCoupons: [],
      appliedCoupon: null,
      discountAmount: 0,
      error: null,
      isLoading: false,
    });
    vi.clearAllMocks();
  });

  it("ProductCard 'Add to Bag' button adds product to bag and shows 'Added ✓'", async () => {
    renderWithProviders(
      <CartProvider>
        <ProductCard product={mockJeweleryProduct} />
      </CartProvider>,
    );

    const addButton = screen.getByRole("button", { name: /add to bag/i });
    expect(addButton).toBeInTheDocument();

    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText(/added ✓/i)).toBeInTheDocument();
    });

    const jeweleryItems = filterItemsByModule(useCartStore.getState().items, "jewelery");
    expect(jeweleryItems.length).toBe(1);
    expect(jeweleryItems[0].productTitle).toBe("22K Gold Diamond Necklace");
    expect(jeweleryItems[0].price).toBe(45000);
    expect(jeweleryItems[0].quantity).toBe(1);
    expect(jeweleryItems[0].module).toBe("jewelery");
  });

  it("JeweleryProductDetailScreen 'Add to Bag' adds product and toggles button to 'Go to Cart →'", async () => {
    renderWithProviders(
      <CartProvider>
        <LocationDisplay />
        <Routes>
          <Route path="/jewelery/product/:id" element={<JeweleryProductDetailScreen />} />
          <Route path="/jewelery/cart" element={<div data-testid="jewelery-cart-page">Jewellery Bag Screen</div>} />
        </Routes>
      </CartProvider>,
      { initialEntries: [`/jewelery/product/${mockJeweleryProduct.id}`] },
    );

    await waitFor(() => {
      expect(screen.getByText("22K Gold Diamond Necklace")).toBeInTheDocument();
    });

    const addBtn = screen.getByRole("button", { name: /add to bag/i });
    expect(addBtn).toBeInTheDocument();

    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(screen.getByText(/go to cart →/i)).toBeInTheDocument();
    });

    const jeweleryItems = filterItemsByModule(useCartStore.getState().items, "jewelery");
    expect(jeweleryItems.length).toBe(1);
    expect(jeweleryItems[0].productId).toBe(mockJeweleryProduct.id);

    // Clicking 'Go to Cart →' navigates to /jewelery/cart
    fireEvent.click(screen.getByText(/go to cart →/i));
    await waitFor(() => {
      expect(screen.getByTestId("jewelery-cart-page")).toBeInTheDocument();
    });
  });

  it("handles products without _raw gracefully via synthesizeRaw", async () => {
    renderWithProviders(
      <CartProvider>
        <ProductCard product={mockProductWithoutRaw} />
      </CartProvider>,
    );

    const addButton = screen.getByRole("button", { name: /add to bag/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText(/added ✓/i)).toBeInTheDocument();
    });

    const jeweleryItems = filterItemsByModule(useCartStore.getState().items, "jewelery");
    expect(jeweleryItems.length).toBe(1);
    expect(jeweleryItems[0].productId).toBe(mockProductWithoutRaw.id);
    expect(jeweleryItems[0].productTitle).toBe("Kundan Chandbali Earrings");
    expect(jeweleryItems[0].module).toBe("jewelery");
  });

  it("JeweleryCartScreen renders items, updates quantity, and removes items cleanly", async () => {
    // Preload one jewellery item into the store
    await useCartStore.getState().addItem(
      mockJeweleryProduct._raw,
      "JWL-NECK-001",
      1,
      "jewelery",
    );

    renderWithProviders(
      <CartProvider>
        <JeweleryCartScreen />
      </CartProvider>,
    );

    expect(screen.getByText("22K Gold Diamond Necklace")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();

    // Increment quantity
    const plusBtn = screen.getByLabelText(/increase quantity/i);
    fireEvent.click(plusBtn);

    await waitFor(() => {
      expect(screen.getByText("2")).toBeInTheDocument();
    });

    // Remove item
    const removeBtn = screen.getByLabelText(/remove item/i);
    fireEvent.click(removeBtn);

    await waitFor(() => {
      expect(screen.getByText(/your cart is quiet/i)).toBeInTheDocument();
    });

    const jeweleryItems = filterItemsByModule(useCartStore.getState().items, "jewelery");
    expect(jeweleryItems.length).toBe(0);
  });

  it("JeweleryCartScreen empty state does NOT show any cross-module clothing bag banner", async () => {
    // Add a clothing item to ensure cross-module condition was previously triggered
    await useCartStore.getState().addItem(
      { _id: "cloth-1", title: "Men Shirt", price: 999, variants: [{ sku: "CLOTH-01", stock: 10 }] },
      "CLOTH-01",
      1,
      "clothing",
    );

    renderWithProviders(
      <CartProvider>
        <JeweleryCartScreen />
      </CartProvider>,
    );

    // Jewelery cart is empty
    expect(screen.getByText(/your cart is quiet/i)).toBeInTheDocument();
    // Must NOT have cross-module clothing banner
    expect(screen.queryByText(/in your clothing bag/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/go to clothing bag/i)).not.toBeInTheDocument();
  });

  it("Clothing EmptyCart does NOT show any cross-module jewellery bag banner", async () => {
    // Add a jewellery item
    await useCartStore.getState().addItem(
      mockJeweleryProduct._raw,
      "JWL-NECK-001",
      1,
      "jewelery",
    );

    renderWithProviders(<EmptyCart />);

    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
    // Must NOT have cross-module jewellery banner
    expect(screen.queryByText(/in your jewellery bag/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/go to jewellery bag/i)).not.toBeInTheDocument();
  });
});
