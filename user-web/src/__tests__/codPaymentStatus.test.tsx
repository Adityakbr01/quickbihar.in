import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";
import { renderWithProviders } from "@/src/test/test-utils";
import OrderSuccessScreen from "@/src/features/common/order/screen/OrderSuccessScreen";
import OrderDetailScreen from "@/src/features/common/order/screen/OrderDetailScreen";
import JeweleryOrderSuccessScreen from "@/src/features/Jewelery/screens/JeweleryOrderSuccessScreen";
import JeweleryOrderDetailScreen from "@/src/features/Jewelery/screens/JeweleryOrderDetailScreen";
import * as orderApi from "@/src/features/common/order/api/order.api";

// Mock LazyLottie to avoid canvas/svg issues in jsdom
vi.mock("@/src/components/common/LazyLottie", () => ({
  default: () => <div data-testid="lottie-mock" />,
}));

// Mock haptics
vi.mock("@/lib/haptics", () => ({
  notificationAsync: vi.fn(),
  impactAsync: vi.fn(),
  NotificationFeedbackType: { Success: "success" },
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
}));

// Mock analytics
vi.mock("@/src/analytics/googleAnalytics", () => ({
  trackPurchase: vi.fn(),
  gaItemFromOrderLine: vi.fn(),
}));

describe("Cash on Delivery (COD) Payment Status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockCodOrder = {
    _id: "order-cod-123",
    orderId: "QB-COD-123",
    status: "CONFIRMED",
    paymentStatus: "PENDING",
    paymentMethod: "COD",
    payableAmount: 1499,
    totalAmount: 1499,
    items: [
      {
        _id: "item-1",
        title: "Men Slim Fit Cotton Shirt",
        productTitle: "Men Slim Fit Cotton Shirt",
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

  const mockOnlineOrder = {
    _id: "order-online-456",
    orderId: "QB-ONL-456",
    status: "CONFIRMED",
    paymentStatus: "PAID",
    paymentMethod: "ONLINE",
    payableAmount: 2499,
    totalAmount: 2499,
    items: [
      {
        _id: "item-2",
        title: "Silk Banarasi Saree",
        productTitle: "Silk Banarasi Saree",
        price: 2499,
        quantity: 1,
        module: "clothing",
      },
    ],
    shippingAddress: {
      fullName: "Anita Devi",
      phone: "9876543211",
      street: "Main Market",
      city: "Buxar",
      state: "Bihar",
      pincode: "802101",
    },
    createdAt: new Date().toISOString(),
  };

  const mockDetailCodOrder = {
    _id: "order-detail-cod",
    orderId: "QB-DETAIL-COD",
    status: "CONFIRMED",
    paymentStatus: "PENDING",
    paymentMethod: "COD",
    payableAmount: 999,
    totalAmount: 999,
    subtotal: 999,
    shippingFee: 0,
    discountAmount: 0,
    items: [
      {
        _id: "item-3",
        title: "Casual Kurta",
        productTitle: "Casual Kurta",
        price: 999,
        quantity: 1,
        module: "clothing",
      },
    ],
    shippingAddress: {
      fullName: "Amit Singh",
      phone: "9123456780",
      street: "Civil Lines",
      city: "Buxar",
      state: "Bihar",
      pincode: "802101",
    },
    createdAt: new Date().toISOString(),
  };

  const mockJeweleryCod = {
    _id: "jewel-cod-1",
    orderId: "QB-JWL-1",
    status: "CONFIRMED",
    paymentMethod: "COD",
    payableAmount: 15000,
    totalAmount: 15000,
    items: [
      {
        _id: "j-1",
        title: "22K Gold Ring",
        productTitle: "22K Gold Ring",
        price: 15000,
        quantity: 1,
        module: "jewelery",
      },
    ],
    shippingAddress: {
      fullName: "Pooja Sharma",
      phone: "9876543210",
      street: "Station Road",
      city: "Patna",
      state: "Bihar",
      pincode: "800001",
    },
    createdAt: new Date().toISOString(),
  };

  const mockJeweleryDetailCod = {
    _id: "jewel-detail-1",
    orderId: "QB-JWL-DET-1",
    status: "CONFIRMED",
    paymentMethod: "COD",
    payableAmount: 45000,
    totalAmount: 45000,
    subtotal: 45000,
    shippingFee: 0,
    discountAmount: 0,
    items: [
      {
        _id: "j-2",
        title: "Diamond Pendant",
        productTitle: "Diamond Pendant",
        price: 45000,
        quantity: 1,
        module: "jewelery",
      },
    ],
    shippingAddress: {
      fullName: "Pooja Sharma",
      phone: "9876543210",
      street: "Golghar",
      city: "Patna",
      state: "Bihar",
      pincode: "800001",
    },
    createdAt: new Date().toISOString(),
  };

  describe("Clothing OrderSuccessScreen", () => {
    it("renders 'Order Placed Successfully! Pay on delivery' and pending status when payment method is COD", async () => {
      vi.spyOn(orderApi, "getOrderByIdRequest").mockImplementation(async () => ({
        data: mockCodOrder,
      } as any));

      renderWithProviders(
        <Routes>
          <Route path="/order-success/:orderId" element={<OrderSuccessScreen />} />
        </Routes>,
        {
          initialEntries: ["/order-success/order-cod-123"],
        }
      );

      await waitFor(() => {
        expect(screen.getByText("Order Placed Successfully!")).toBeInTheDocument();
      });

      expect(
        screen.getByText("Your Cash on Delivery order is confirmed. Pay in cash when it arrives.")
      ).toBeInTheDocument();

      // Must NOT display "Payment Successful!" for COD
      expect(screen.queryByText("Payment Successful!")).not.toBeInTheDocument();

      // Due on delivery label
      expect(screen.getByText("Amount Due on Delivery")).toBeInTheDocument();
      expect(screen.getByText("Payment Method: COD (Pending)")).toBeInTheDocument();
    });

    it("renders 'Payment Successful!' and 'Total Paid' when payment method is ONLINE", async () => {
      vi.spyOn(orderApi, "getOrderByIdRequest").mockImplementation(async () => ({
        data: mockOnlineOrder,
      } as any));

      renderWithProviders(
        <Routes>
          <Route path="/order-success/:orderId" element={<OrderSuccessScreen />} />
        </Routes>,
        {
          initialEntries: ["/order-success/order-online-456"],
        }
      );

      await waitFor(() => {
        expect(screen.getByText("Payment Successful!")).toBeInTheDocument();
      });

      expect(screen.getByText("Total Paid")).toBeInTheDocument();
      expect(screen.getByText("Payment Method: Online (Paid)")).toBeInTheDocument();
    });
  });

  describe("Clothing OrderDetailScreen", () => {
    it("renders 'PAY ON DELIVERY (PENDING)' and delivery step text for COD order", async () => {
      vi.spyOn(orderApi, "getOrderByIdRequest").mockImplementation(async () => ({
        data: mockDetailCodOrder,
      } as any));

      renderWithProviders(
        <Routes>
          <Route path="/order/:id" element={<OrderDetailScreen />} />
        </Routes>,
        {
          initialEntries: ["/order/order-detail-cod"],
        }
      );

      // Verify the subtitle on the card indicates cash payment on delivery
      await waitFor(() => {
        expect(screen.getByText(/Pay ₹999 on delivery/i)).toBeInTheDocument();
      });

      // Expand price details to view Paid By Box
      const priceDetailsBtn = screen.getByRole("button", { name: /Price details/i });
      fireEvent.click(priceDetailsBtn);

      await waitFor(() => {
        expect(screen.getByText("Payment Method: Cash on Delivery")).toBeInTheDocument();
        expect(screen.getByText("PAY ON DELIVERY (PENDING)")).toBeInTheDocument();
      });

      // Expand timeline to verify detailed step text
      const timelineBtn = screen.getByRole("button", { name: /CONFIRMED/i });
      fireEvent.click(timelineBtn);

      await waitFor(() => {
        expect(
          screen.getByText("Order confirmed. Cash payment to be collected upon delivery.")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Jewelery Order Screens", () => {
    it("renders 'Pay on Delivery' on JeweleryOrderSuccessScreen for COD", async () => {
      vi.spyOn(orderApi, "getOrderByIdRequest").mockImplementation(async () => ({
        data: mockJeweleryCod,
      } as any));

      renderWithProviders(
        <Routes>
          <Route path="/jewelery/order-success/:orderId" element={<JeweleryOrderSuccessScreen />} />
        </Routes>,
        {
          initialEntries: ["/jewelery/order-success/jewel-cod-1"],
        }
      );

      await waitFor(() => {
        expect(screen.getByText("Pay on Delivery")).toBeInTheDocument();
      });

      expect(screen.getByText("Cash on Delivery (Pending Delivery)")).toBeInTheDocument();
      expect(screen.queryByText("Amount Paid")).not.toBeInTheDocument();
    });

    it("renders 'Pay on Delivery' on JeweleryOrderDetailScreen for COD order", async () => {
      vi.spyOn(orderApi, "getOrderByIdRequest").mockImplementation(async () => ({
        data: mockJeweleryDetailCod,
      } as any));

      renderWithProviders(
        <Routes>
          <Route path="/jewelery/orders/:id" element={<JeweleryOrderDetailScreen />} />
        </Routes>,
        {
          initialEntries: ["/jewelery/orders/jewel-detail-1"],
        }
      );

      await waitFor(() => {
        expect(screen.getByText("Pay on Delivery")).toBeInTheDocument();
      });

      expect(screen.queryByText("Total Paid")).not.toBeInTheDocument();
    });
  });
});
