/**
 * BottomTabBar vertical-detection regression tests.
 *
 * Covers the bug where Clothing product detail (/product/:id) and mall
 * detail (/mall/:slug) routes rendered the Jewellery tab bar because the
 * persisted module in the store was stale ("jewelery") and those routes
 * were not included in the clothing path check.
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { BottomTabBar } from "../BottomTabBar";

// ---- Mocks ---------------------------------------------------------------

const mockUseWindowWidth = vi.fn(() => 375); // mobile by default
const mockUseTheme = vi.fn(() => ({
  background: "#0f172a",
  text: "#ffffff",
  secondaryText: "#94a3b8",
  tertiaryText: "#64748b",
  primary: "#4f46e5",
  iconColor: "#4f46e5",
  tertiaryBackground: "#1e293b",
  border: "rgba(255,255,255,0.08)",
  isDark: true,
}));
const mockUseCartStore = vi.fn(() => ({ items: [] }));
const mockUseAuthStore = vi.fn(() => ({
  user: null,
  isAuthenticated: false,
}));
const mockUseModuleStore = vi.fn(() => ({
  currentModule: { id: "jewelery" }, // stale module — should NOT override URL
}));

vi.mock("@/src/utils/responsive", () => ({
  BREAKPOINTS: { desktopMin: 1024, tabletMin: 768, mobileMax: 767 },
  useWindowWidth: () => mockUseWindowWidth(),
}));
vi.mock("@/src/theme/Provider/ThemeProvider", () => ({
  useTheme: () => mockUseTheme(),
}));
vi.mock("@/src/features/common/cart/store/cartStore", () => ({
  useCartStore: () => mockUseCartStore(),
  filterItemsByModule: () => [],
}));
vi.mock("@/src/features/common/auth/store/authStore", () => ({
  useAuthStore: () => mockUseAuthStore(),
  getRoleName: () => undefined,
  RIDER_ROLE_ALIAS: "RIDER",
  RoleEnum: { USER: "USER", SELLER: "SELLER", DELIVERY: "DELIVERY" },
}));
vi.mock("@/src/store/useModuleStore", () => ({
  useModuleStore: () => mockUseModuleStore(),
}));

// ---- Helpers -------------------------------------------------------------

function renderTabBar(pathname: string) {
  const { container } = render(
    <MemoryRouter initialEntries={[pathname]}>
      <BottomTabBar />
    </MemoryRouter>,
  );
  return container;
}

function isJeweleryTabBar(container: HTMLElement): boolean {
  return container.querySelector('[aria-label="Jewelery tabs"]') !== null;
}

function isClothingTabBar(container: HTMLElement): boolean {
  return container.querySelector('[aria-label="Main tabs"]') !== null;
}

function tabBarIsRendered(container: HTMLElement): boolean {
  return container.querySelector("nav") !== null;
}

// ---- Tests ---------------------------------------------------------------

describe("BottomTabBar vertical detection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseWindowWidth.mockReturnValue(375); // mobile
    mockUseAuthStore.mockReturnValue({
      user: null,
      isAuthenticated: false,
    });
    // Stale module: simulates a user who previously browsed Jewellery.
    mockUseModuleStore.mockReturnValue({
      currentModule: { id: "jewelery" },
    });
  });

  describe("Clothing routes render the Clothing tab bar", () => {
    it("/clothing/home renders Clothing tabs, not Jewellery", () => {
      const container = renderTabBar("/clothing/home");
      expect(isClothingTabBar(container)).toBe(true);
      expect(isJeweleryTabBar(container)).toBe(false);
    });

    it("/clothing/cart renders Clothing tabs, not Jewellery", () => {
      const container = renderTabBar("/clothing/cart");
      expect(isClothingTabBar(container)).toBe(true);
      expect(isJeweleryTabBar(container)).toBe(false);
    });

    it("/clothing/account renders Clothing tabs, not Jewellery", () => {
      const container = renderTabBar("/clothing/account");
      expect(isClothingTabBar(container)).toBe(true);
      expect(isJeweleryTabBar(container)).toBe(false);
    });

    it("BUG FIX: /product/:id renders Clothing tabs, not Jewellery", () => {
      const container = renderTabBar("/product/prod-123");
      expect(isClothingTabBar(container)).toBe(true);
      expect(isJeweleryTabBar(container)).toBe(false);
    });

    it("BUG FIX: /mall/:slug renders Clothing tabs, not Jewellery", () => {
      const container = renderTabBar("/mall/mall-abc");
      expect(isClothingTabBar(container)).toBe(true);
      expect(isJeweleryTabBar(container)).toBe(false);
    });

    it("BUG FIX: /category/:slug renders Clothing tabs, not Jewellery", () => {
      const container = renderTabBar("/category/mens-wear");
      expect(isClothingTabBar(container)).toBe(true);
      expect(isJeweleryTabBar(container)).toBe(false);
    });

    it("BUG FIX: /top-selling renders Clothing tabs, not Jewellery", () => {
      const container = renderTabBar("/top-selling");
      expect(isClothingTabBar(container)).toBe(true);
      expect(isJeweleryTabBar(container)).toBe(false);
    });

    it("BUG FIX: /malls renders Clothing tabs, not Jewellery", () => {
      const container = renderTabBar("/malls");
      expect(isClothingTabBar(container)).toBe(true);
      expect(isJeweleryTabBar(container)).toBe(false);
    });

    it("GLOBAL FIX: /account/addresses renders Clothing tabs, not Jewellery", () => {
      const container = renderTabBar("/account/addresses");
      expect(isClothingTabBar(container)).toBe(true);
      expect(isJeweleryTabBar(container)).toBe(false);
    });

    it("GLOBAL FIX: /account/orders renders Clothing tabs, not Jewellery", () => {
      const container = renderTabBar("/account/orders");
      expect(isClothingTabBar(container)).toBe(true);
      expect(isJeweleryTabBar(container)).toBe(false);
    });

    it("GLOBAL FIX: /orders renders Clothing tabs, not Jewellery", () => {
      const container = renderTabBar("/orders");
      expect(isClothingTabBar(container)).toBe(true);
      expect(isJeweleryTabBar(container)).toBe(false);
    });

    it("GLOBAL FIX: /order/:id renders Clothing tabs, not Jewellery", () => {
      const container = renderTabBar("/order/ord-123");
      expect(isClothingTabBar(container)).toBe(true);
      expect(isJeweleryTabBar(container)).toBe(false);
    });

    it("GLOBAL FIX: /account renders Clothing tabs, not Jewellery", () => {
      const container = renderTabBar("/account");
      expect(isClothingTabBar(container)).toBe(true);
      expect(isJeweleryTabBar(container)).toBe(false);
    });

    it("GLOBAL FIX: /profile renders Clothing tabs, not Jewellery", () => {
      const container = renderTabBar("/profile");
      expect(isClothingTabBar(container)).toBe(true);
      expect(isJeweleryTabBar(container)).toBe(false);
    });

    it("GLOBAL FIX: /checkout renders Clothing tabs, not Jewellery", () => {
      const container = renderTabBar("/checkout");
      expect(isClothingTabBar(container)).toBe(true);
      expect(isJeweleryTabBar(container)).toBe(false);
    });
  });

  describe("Jewellery routes render the Jewellery tab bar", () => {
    it("/jewelery renders Jewellery tabs", () => {
      const container = renderTabBar("/jewelery");
      expect(isJeweleryTabBar(container)).toBe(true);
      expect(isClothingTabBar(container)).toBe(false);
    });

    it("/jewelry (alternate spelling) renders Jewellery tabs", () => {
      const container = renderTabBar("/jewelry");
      expect(isJeweleryTabBar(container)).toBe(true);
      expect(isClothingTabBar(container)).toBe(false);
    });

    it("/jewelery/cart renders Jewellery tabs", () => {
      const container = renderTabBar("/jewelery/cart");
      expect(isJeweleryTabBar(container)).toBe(true);
      expect(isClothingTabBar(container)).toBe(false);
    });

    it("/jewelery/product/:id renders Jewellery tabs", () => {
      const container = renderTabBar("/jewelery/product/jwl-123");
      expect(isJeweleryTabBar(container)).toBe(true);
      expect(isClothingTabBar(container)).toBe(false);
    });
  });

  describe("Desktop viewport renders no tab bar", () => {
    it("returns null on desktop width", () => {
      mockUseWindowWidth.mockReturnValue(1200);
      const container = renderTabBar("/clothing/home");
      expect(tabBarIsRendered(container)).toBe(false);
    });
  });

  describe("Auth routes render no tab bar", () => {
    it("/auth renders no tab bar", () => {
      const container = renderTabBar("/auth");
      expect(tabBarIsRendered(container)).toBe(false);
    });

    it("/jewelery/auth/sign-in renders no tab bar", () => {
      const container = renderTabBar("/jewelery/auth/sign-in");
      expect(tabBarIsRendered(container)).toBe(false);
    });
  });

  describe("Stale module does not override URL-based detection", () => {
    it("with stale 'jewelery' module, /clothing/home still shows Clothing tabs", () => {
      const container = renderTabBar("/clothing/home");
      expect(isClothingTabBar(container)).toBe(true);
      expect(isJeweleryTabBar(container)).toBe(false);
    });

    it("with stale 'jewelery' module, /product/:id shows Clothing tabs", () => {
      const container = renderTabBar("/product/prod-123");
      expect(isClothingTabBar(container)).toBe(true);
      expect(isJeweleryTabBar(container)).toBe(false);
    });

    it("with stale 'clothing' module, /jewelery still shows Jewellery tabs", () => {
      mockUseModuleStore.mockReturnValue({
        currentModule: { id: "clothing" },
      });
      const container = renderTabBar("/jewelery");
      expect(isJeweleryTabBar(container)).toBe(true);
      expect(isClothingTabBar(container)).toBe(false);
    });
  });
});
