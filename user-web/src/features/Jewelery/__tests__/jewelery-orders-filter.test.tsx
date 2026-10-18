import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import { renderWithProviders, LocationDisplay } from "@/src/test/test-utils";
import JeweleryOrdersScreen from "@/src/features/Jewelery/orders";
import { orderHasModule, resolveOrderItemModule } from "@/src/features/common/order/lib/orderModule";

vi.mock("@/src/features/common/order/api/order.api", () => ({
  getMyOrdersRequest: vi.fn(),
  getOrderByIdRequest: vi.fn(),
}));

vi.mock("@/lib/haptics", () => ({
  notificationAsync: vi.fn(),
  impactAsync: vi.fn(),
  NotificationFeedbackType: { Success: "success", Error: "error", Warning: "warning" },
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
}));

import { getMyOrdersRequest } from "@/src/features/common/order/api/order.api";

const mockOrders = [
  {
    _id: "jewel-order-1",
    orderId: "QB-J101",
    status: "CONFIRMED",
    paymentMethod: "COD",
    paymentInfo: { razorpayOrderId: "COD" },
    payableAmount: 4999,
    createdAt: new Date().toISOString(),
    vertical: "JEWELERY",
    items: [
      {
        _id: "ji-1",
        title: "22K Gold Plated Jhumka Earrings",
        price: 4999,
        quantity: 1,
        vertical: "JEWELERY",
        productId: {
          _id: "jp-1",
          vertical: "JEWELERY",
          jeweleryDetails: { metalType: "Gold Plated", purity: "22K" },
        },
      },
    ],
  },
  {
    _id: "clothing-order-1",
    orderId: "QB-C202",
    status: "DELIVERED",
    paymentMethod: "ONLINE",
    payableAmount: 1299,
    createdAt: new Date().toISOString(),
    vertical: "CLOTHING",
    items: [
      {
        _id: "ci-1",
        title: "Men Slim Fit Cotton Shirt",
        price: 1299,
        quantity: 1,
        vertical: "CLOTHING",
        productId: {
          _id: "cp-1",
          vertical: "CLOTHING",
        },
      },
    ],
  },
  {
    _id: "legacy-jewel-order-2",
    orderId: "QB-J102",
    status: "PROCESSING",
    paymentMethod: "ONLINE",
    payableAmount: 8500,
    createdAt: new Date().toISOString(),
    items: [
      {
        _id: "ji-2",
        title: "Kundan Choker Necklace",
        price: 8500,
        quantity: 1,
        productId: {
          _id: "jp-2",
          jeweleryDetails: { metalType: "Brass", stoneWeightCt: 2.5 },
        },
      },
    ],
  },
];

describe("Jewellery Order Filtering & Navigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes { vertical: 'JEWELERY' } to getMyOrdersRequest and lists only Jewellery orders", async () => {
    vi.mocked(getMyOrdersRequest).mockResolvedValue({ data: mockOrders } as any);

    renderWithProviders(
      <>
        <LocationDisplay />
        <JeweleryOrdersScreen />
      </>,
      { initialEntries: ["/jewelery/orders"] }
    );

    await waitFor(() => {
      expect(getMyOrdersRequest).toHaveBeenCalledWith({ vertical: "JEWELERY" });
    });

    await waitFor(() => {
      // Jewellery orders must be visible
      expect(screen.getByText("ORDER #QB-J101")).toBeInTheDocument();
      expect(screen.getByText("ORDER #QB-J102")).toBeInTheDocument();
      // Clothing order must be filtered out
      expect(screen.queryByText("ORDER #QB-C202")).not.toBeInTheDocument();
    });
  });

  it("clicking a jewellery order navigates to its order detail route", async () => {
    vi.mocked(getMyOrdersRequest).mockResolvedValue({ data: mockOrders } as any);

    renderWithProviders(
      <>
        <LocationDisplay />
        <JeweleryOrdersScreen />
      </>,
      { initialEntries: ["/jewelery/orders"] }
    );

    await waitFor(() => {
      expect(screen.getByText("ORDER #QB-J101")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("ORDER #QB-J101").closest("button")!);

    await waitFor(() => {
      expect(screen.getByText("/jewelery/orders/QB-J101")).toBeInTheDocument();
    });
  });

  it("displays the empty state with collection navigation when no jewellery orders exist", async () => {
    vi.mocked(getMyOrdersRequest).mockResolvedValue({ data: [] } as any);

    renderWithProviders(
      <>
        <LocationDisplay />
        <JeweleryOrdersScreen />
      </>,
      { initialEntries: ["/jewelery/orders"] }
    );

    await waitFor(() => {
      expect(screen.getByText("No Jewellery Orders Yet")).toBeInTheDocument();
      expect(screen.getByText("EXPLORE COLLECTIONS")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("EXPLORE COLLECTIONS").closest("button")!);

    await waitFor(() => {
      expect(screen.getByText("/jewelery/collections")).toBeInTheDocument();
    });
  });
});

describe("Order Module Classification Helpers", () => {
  it("resolves jewellery item from item.vertical or item.module", () => {
    expect(resolveOrderItemModule({ vertical: "JEWELERY" })).toBe("jewelery");
    expect(resolveOrderItemModule({ module: "jewelery" })).toBe("jewelery");
    expect(resolveOrderItemModule({ vertical: "JEWELLERY" })).toBe("jewelery");
  });

  it("resolves jewellery item from populated productId.vertical or jeweleryDetails", () => {
    expect(resolveOrderItemModule({ productId: { vertical: "JEWELERY" } })).toBe("jewelery");
    expect(resolveOrderItemModule({ productId: { jeweleryDetails: { purity: "22K" } } })).toBe("jewelery");
  });

  it("resolves clothing item by default for apparel", () => {
    expect(resolveOrderItemModule({ vertical: "CLOTHING" })).toBe("clothing");
    expect(resolveOrderItemModule({ title: "Cotton T-Shirt" })).toBe("clothing");
  });

  it("orderHasModule accurately partitions orders", () => {
    const jewelOrder = mockOrders[0];
    const clothingOrder = mockOrders[1];
    const legacyJewelOrder = mockOrders[2];

    expect(orderHasModule(jewelOrder, "jewelery")).toBe(true);
    expect(orderHasModule(jewelOrder, "clothing")).toBe(false);

    expect(orderHasModule(clothingOrder, "clothing")).toBe(true);
    expect(orderHasModule(clothingOrder, "jewelery")).toBe(false);

    expect(orderHasModule(legacyJewelOrder, "jewelery")).toBe(true);
    expect(orderHasModule(legacyJewelOrder, "clothing")).toBe(false);
  });
});
