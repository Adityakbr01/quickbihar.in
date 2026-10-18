import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";
import { renderWithProviders } from "@/src/test/test-utils";
import OrderSuccessScreen from "@/src/features/common/order/screen/OrderSuccessScreen";
import OrderDetailScreen from "@/src/features/common/order/screen/OrderDetailScreen";
import * as orderApi from "@/src/features/common/order/api/order.api";

// Mock LazyLottie to avoid canvas/svg issues in jsdom
vi.mock("@/src/components/common/LazyLottie", () => ({
  default: () => <div data-testid="lottie-mock" />,
}));

// Mock haptics
vi.mock("@/lib/haptics", () => ({
  notificationAsync: vi.fn(),
  impactAsync: vi.fn(),
  NotificationFeedbackType: { Success: "success", Error: "error" },
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
}));

// Mock analytics
vi.mock("@/src/analytics/googleAnalytics", () => ({
  trackPurchase: vi.fn(),
  gaItemFromOrderLine: vi.fn(),
}));

const baseCodOrder = {
  _id: "order-cod-123",
  orderId: "QB-COD-123",
  status: "CONFIRMED",
  paymentStatus: "PENDING",
  paymentMethod: "COD",
  payableAmount: 1499,
  totalAmount: 1499,
  subtotal: 1499,
  shippingFee: 0,
  discountAmount: 0,
  items: [
    {
      _id: "item-1",
      title: "Men Slim Fit Cotton Shirt",
      productTitle: "Men Slim Fit Cotton Shirt",
      sku: "SKU-SHIRT-M",
      price: 1499,
      quantity: 1,
      selectedSize: "L",
      module: "clothing",
    },
  ],
  shippingAddress: {
    fullName: "Rahul Kumar",
    phone: "9876543210",
    street: "Station Road",
    city: "Buxar",
    state: "Bihar",
    pincode: "802101",
  },
  createdAt: new Date().toISOString(),
};

const baseOnlineOrder = {
  ...baseCodOrder,
  _id: "order-online-456",
  orderId: "QB-ONL-456",
  paymentStatus: "PAID",
  paymentMethod: "ONLINE",
  payableAmount: 2499,
  totalAmount: 2499,
  items: [
    {
      ...baseCodOrder.items[0],
      _id: "item-2",
      price: 2499,
    },
  ],
};

describe("Cash on Delivery (COD) Payment Status — Regression", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("COD order success screen shows confirmation, not 'Payment Successful!'", async () => {
    vi.spyOn(orderApi, "getOrderByIdRequest").mockImplementation(async () => ({
      data: baseCodOrder,
    } as any));

    renderWithProviders(
      <Routes>
        <Route path="/order-success/:orderId" element={<OrderSuccessScreen />} />
      </Routes>,
      { initialEntries: ["/order-success/order-cod-123"] },
    );

    await waitFor(() => {
      expect(screen.getByText("Order Placed Successfully!")).toBeInTheDocument();
    });

    expect(
      screen.getByText(
        "Your Cash on Delivery order is confirmed. Pay in cash when it arrives.",
      ),
    ).toBeInTheDocument();

    // COD must never show an online "Payment Successful!" state.
    expect(screen.queryByText("Payment Successful!")).not.toBeInTheDocument();

    // Pending / unpaid COD status rendered from the backend.
    expect(screen.getByText("Amount Due on Delivery")).toBeInTheDocument();
    expect(screen.getByText("Payment Method: COD (Pending)")).toBeInTheDocument();
    expect(screen.getAllByText("₹1499").length).toBeGreaterThanOrEqual(1);
  });

  it("Online order success screen retains 'Payment Successful!' / 'Total Paid'", async () => {
    vi.spyOn(orderApi, "getOrderByIdRequest").mockImplementation(async () => ({
      data: baseOnlineOrder,
    } as any));

    renderWithProviders(
      <Routes>
        <Route path="/order-success/:orderId" element={<OrderSuccessScreen />} />
      </Routes>,
      { initialEntries: ["/order-success/order-online-456"] },
    );

    await waitFor(() => {
      expect(screen.getByText("Payment Successful!")).toBeInTheDocument();
    });

    expect(screen.getByText("Total Paid")).toBeInTheDocument();
    expect(screen.getByText("Payment Method: Online (Paid)")).toBeInTheDocument();
  });

  it("Order detail screen renders COD payment method and pending step", async () => {
    vi.spyOn(orderApi, "getOrderByIdRequest").mockImplementation(async () => ({
      data: baseCodOrder,
    } as any));

    renderWithProviders(
      <Routes>
        <Route path="/order/:id" element={<OrderDetailScreen />} />
      </Routes>,
      { initialEntries: ["/order/order-cod-123"] },
    );

    // COD line: "Pay ₹1499 on delivery"
    await waitFor(() => {
      expect(screen.getByText(/Pay ₹1499 on delivery/i)).toBeInTheDocument();
    });

    // Payment method persists as Cash on Delivery (hidden until expanded).
    expect(screen.queryByText("Payment Method: Cash on Delivery")).not.toBeInTheDocument();

    const priceDetailsBtn = screen.getByRole("button", { name: /Price details/i });
    fireEvent.click(priceDetailsBtn);

    await waitFor(() => {
      expect(screen.getByText("Payment Method: Cash on Delivery")).toBeInTheDocument();
      expect(screen.getByText("PAY ON DELIVERY (PENDING)")).toBeInTheDocument();
    });
  });

  it("Failed order detail request renders an error state instead of success", async () => {
    vi.spyOn(orderApi, "getOrderByIdRequest").mockRejectedValue(
      new Error("Failed to fetch order details"),
    );

    renderWithProviders(
      <Routes>
        <Route path="/order/:id" element={<OrderDetailScreen />} />
      </Routes>,
      { initialEntries: ["/order/order-missing"] },
    );

    await waitFor(() => {
      expect(screen.getByText("Order not found")).toBeInTheDocument();
    });

    expect(screen.queryByText(/Pay on delivery/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Payment Successful!")).not.toBeInTheDocument();
  });
});
