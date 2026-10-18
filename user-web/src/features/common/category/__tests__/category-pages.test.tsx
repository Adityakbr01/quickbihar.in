import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import CategoryDetailScreen from "@/src/features/common/category/screens/CategoryDetailScreen";

vi.mock("@/src/features/common/category/hooks/useCategories", () => ({
  useCategoryBySlug: vi.fn(),
  useCategories: vi.fn(),
}));

vi.mock("@/src/features/clothing/product/api/product.api", () => ({
  getPublicProductsRequest: vi.fn(),
}));

vi.mock("@/src/features/common/wishlist/store/wishlistStore", () => ({
  useWishlistStore: () => ({ items: [], toggleItem: vi.fn() }),
}));

vi.mock("@/src/features/common/cart/store/cartStore", () => ({
  useCartStore: () => ({ items: [], addItem: vi.fn() }),
}));

import { useCategoryBySlug } from "@/src/features/common/category/hooks/useCategories";
import { getPublicProductsRequest } from "@/src/features/clothing/product/api/product.api";

const mockCategory = (slug: string, title: string) => ({
  _id: `cat-${slug}`,
  slug,
  title,
  description: `${title} collection for men and women`,
  vertical: "CLOTHING",
  isActive: true,
});

const mockProduct = {
  _id: "prod-1",
  id: "mock-1",
  productTitle: "Men Slim Fit Cotton Shirt",
  title: "Men Slim Fit Cotton Shirt",
  price: 1499,
  sku: "SKU-SHIRT-M",
  selectedSize: "L",
  selectedColor: "Navy",
  quantity: 1,
  variants: [],
  image: "https://example.com/shirt.jpg",
  storeId: { name: "Quick Store" },
  module: "clothing",
};

describe("Category Page Consistency — Regression", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    { slug: "mens-wear", title: "Mens Wear" },
    { slug: "ethnic-wear", title: "Ethnic Wear" },
  ])("loads the $title category page ($slug) with category-specific content", async ({ slug, title }) => {
    vi.mocked(useCategoryBySlug).mockReturnValue({
      data: mockCategory(slug, title),
      isLoading: false,
      isError: false,
    } as any);

    vi.mocked(getPublicProductsRequest).mockImplementation(async () => ({
      data: [mockProduct],
      total: 1,
    } as any));

    renderWithProviders(
      <CategoryDetailScreen slug={slug} />,
      { initialEntries: [`/category/${slug}`] },
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: title, level: 1 })).toBeInTheDocument();
      expect(screen.getByText(`${title} collection for men and women`)).toBeInTheDocument();
    }, { timeout: 5000 });

    // Product cards and controls remain functional.
    await waitFor(() => {
      expect(screen.getByText("Men Slim Fit Cotton Shirt")).toBeInTheDocument();
      expect(screen.getByText(/₹\s*1,?499/)).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it("renders shared navigation (home/breadcrumbs) consistently across categories", async () => {
    vi.mocked(useCategoryBySlug).mockReturnValue({
      data: mockCategory("mens-wear", "Mens Wear"),
      isLoading: false,
      isError: false,
    } as any);
    vi.mocked(getPublicProductsRequest).mockImplementation(async () => ({
      data: [],
      total: 0,
    } as any));

    renderWithProviders(
      <CategoryDetailScreen slug="mens-wear" />,
      { initialEntries: ["/category/mens-wear"] },
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Mens Wear", level: 1 })).toBeInTheDocument();
    });

    // Shared breadcrumb / home link present on category routes.
    expect(screen.getByRole("link", { name: /Home/i })).toBeInTheDocument();
  });
});
