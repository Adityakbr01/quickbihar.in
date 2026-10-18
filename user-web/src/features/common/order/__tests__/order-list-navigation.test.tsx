import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import { renderWithProviders, LocationDisplay } from "@/src/test/test-utils";
import OrderListScreen from "@/src/features/common/order/screen/OrderListScreen";

vi.mock("@/src/features/common/order/api/order.api", () => ({
  getMyOrdersRequest: vi.fn(),
  getOrderByIdRequest: vi.fn(),
}));

vi.mock("@/src/features/common/order/lib/orderModule", () => ({
  orderHasModule: vi.fn(() => true),
  filterOrderItemsByModule: vi.fn((items) => items),
}));

vi.mock("@/lib/haptics", () => ({
  notificationAsync: vi.fn(),
  impactAsync: vi.fn(),
  NotificationFeedbackType: { Success: "success", Error: "error" },
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
}));

import { getMyOrdersRequest } from "@/src/features/common/order/api/order.api";

const mockOrders = [
  {
    _id: "order-1",
    orderId: "QB-1001",
    status: "CONFIRMED",
    paymentMethod: "COD",
    paymentInfo: { razorpayOrderId: "COD" },
    payableAmount: 1499,
    createdAt: new Date().toISOString(),
    items: [{ _id: "i1", title: "Cotton Shirt", productTitle: "Cotton Shirt", price: 1499, quantity: 1, module: "clothing" }],
  },
  {
    _id: "order-2",
    orderId: "QB-1002",
    status: "DELIVERED",
    paymentMethod: "ONLINE",
    payableAmount: 2499,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    items: [{ _id: "i2", title: "Silk Saree", productTitle: "Silk Saree", price: 2499, quantity: 1, module: "clothing" }],
  },
];

describe("Order List Navigation — Regression", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists orders and clicking an order opens the order-details route", async () => {
    vi.mocked(getMyOrdersRequest).mockResolvedValue({ data: mockOrders } as any);

    renderWithProviders(
      <>
        <LocationDisplay />
        <OrderListScreen />
      </>,
      { initialEntries: ["/account/orders"] },
    );

    await waitFor(() => {
      expect(screen.getByText("Order #QB-1001")).toBeInTheDocument();
      expect(screen.getByText("Order #QB-1002")).toBeInTheDocument();
    });

    // Click the first order card → order details route.
    fireEvent.click(screen.getByText("Order #QB-1001").closest("button")!);
    await waitFor(() => {
      expect(screen.getByText("/order/QB-1001")).toBeInTheDocument();
    });
  });

  it("clicking an order's product opens the product route", async () => {
    vi.mocked(getMyOrdersRequest).mockResolvedValue({ data: mockOrders } as any);

    renderWithProviders(
      <>
        <LocationDisplay />
        <OrderListScreen />
      </>,
      { initialEntries: ["/account/orders"] },
    );

    await waitFor(() => {
      expect(screen.getByText("Order #QB-1001")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Order #QB-1001").closest("button")!);
    await waitFor(() => {
      expect(screen.getByText("/order/QB-1001")).toBeInTheDocument();
    });
  });

  it("shows the empty state when there are no orders", async () => {
    vi.mocked(getMyOrdersRequest).mockResolvedValue({ data: [] } as any);

    renderWithProviders(<OrderListScreen />, {
      initialEntries: ["/account/orders"],
    });

    await waitFor(() => {
      expect(screen.getByText("No Orders Yet")).toBeInTheDocument();
    });
  });

  it("shows loading skeletons while orders are fetching", async () => {
    vi.mocked(getMyOrdersRequest).mockResolvedValue({ data: [] } as any);

    const { container } = renderWithProviders(<OrderListScreen />, {
      initialEntries: ["/account/orders"],
    });

    await waitFor(() => {
      expect(container.querySelector(".animate-pulse")).not.toBeNull();
    });
  });
});
