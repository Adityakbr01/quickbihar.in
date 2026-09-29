import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { goTo, replaceTo, useRouteParams } from "@/src/utils/navigation";
import LazyLottie from "@/src/components/common/LazyLottie";
import { Package, Share2, ShoppingCart } from "lucide-react";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import * as Haptics from "@/lib/haptics";
const successConfetti = "/lottie/successConfetti.json";
import { getOrderByIdRequest } from "../api/order.api";
import { cn } from "@/src/lib/utils";

const OrderSuccessScreen = () => {
  const theme = useTheme() as any;
  const navigate = useNavigate();
  const { orderId } = useRouteParams();

  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Play haptic feedback on mount
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Fetch Order Details for the Receipt
    fetchOrderDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const fetchOrderDetails = async () => {
    try {
      setIsLoading(true);
      if (typeof orderId === "string") {
        const response = await getOrderByIdRequest(orderId);
        setOrder(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch order details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (!order) return;

    try {
      const itemsList = order.items
        .map((item: any) => `• ${item.title} (x${item.quantity}) - ₹${item.price * item.quantity}`)
        .join("\n");

      const message = `🛍️ *Order Receipt - Quick Bihar*\n\n` +
        `*Order ID:* #${order.orderId}\n` +
        `*Status:* ${order.status}\n\n` +
        `*Items:*\n${itemsList}\n\n` +
        `*Bill Summary:*\n` +
        `Item Total: ₹${order.mrpTotal}\n` +
        `Discount: -₹${order.productDiscount + order.discountAmount}\n` +
        `Shipping: ${order.shippingFee === 0 ? "FREE" : "₹" + order.shippingFee}\n\n` +
        `*Total Paid: ₹${order.payableAmount}*\n\n` +
        `_Thank you for shopping with Quick Bihar!_`;

      const title = `Receipt for Order #${order.orderId}`;
      if (typeof navigator !== "undefined" && (navigator as any).share) {
        await (navigator as any).share({ title, text: message });
      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(message);
        window.alert("Receipt copied to clipboard");
      }
    } catch (error) {
      console.error("Error sharing receipt:", error);
    }
  };

  if (isLoading) {
    return (
      <div
        className="flex min-h-screen flex-1 flex-col items-center justify-center"
        style={{ backgroundColor: theme.background }}
      >
        <span
          className="h-8 w-8 animate-spin rounded-full border-[3px] border-t-transparent"
          style={{ borderColor: `${theme.primary}44`, borderTopColor: theme.primary }}
        />
      </div>
    );
  }

  return (
    <div
      className="relative flex min-h-screen flex-1 flex-col"
      style={{ backgroundColor: theme.background }}
    >
      <button
        type="button"
        onClick={handleShare}
        className="absolute top-5 right-5 z-10 flex h-11 w-11 items-center justify-center rounded-[14px] border"
        style={{
          backgroundColor: theme.tertiaryBackground,
          borderColor: theme.border,
        }}
        aria-label="Share receipt"
      >
        <Share2 size={22} color={theme.text} />
      </button>

      <div className="overflow-auto px-5 pt-10 pb-[60px]">
        <div className="flex flex-col items-center">
          <LazyLottie source={successConfetti}
            autoPlay
            loop={false}
            style={{ width: 200, height: 200 }}
          />

          <h2
            className="mt-5 text-center text-[32px] font-black tracking-[-1px]"
            style={{ color: theme.text }}
          >
            Payment Successful!
          </h2>
          <p
            className="mt-2 mb-8 text-center text-base leading-6"
            style={{ color: theme.secondaryText }}
          >
            Your order has been placed and is being processed.
          </p>
        </div>

        {/* Digital Receipt Card */}
        <div
          className="rounded-3xl border p-6"
          style={{
            backgroundColor: theme.tertiaryBackground,
            borderColor: theme.border,
          }}
        >
          <div className="mb-6 flex flex-col items-center">
            <span
              className="mb-1 text-xs font-bold tracking-[1.5px] uppercase"
              style={{ color: theme.secondaryText }}
            >
              Order ID
            </span>
            <span
              className="text-lg font-black"
              style={{ color: theme.primary }}
            >
              #{order?.orderId}
            </span>
          </div>

          <div
            className="my-5 h-px border-t border-dashed"
            style={{ borderColor: theme.border, backgroundColor: "transparent" }}
          />

          {/* Items List */}
          {order?.items.map((item: any, index: number) => (
            <div key={index} className="mb-4 flex flex-row items-center justify-between">
              <div className="mr-4 flex-1">
                <p
                  className={cn("line-clamp-1 text-[15px] font-semibold")}
                  style={{ color: theme.text }}
                >
                  {item.title}
                </p>
                <p
                  className="mt-0.5 text-[13px]"
                  style={{ color: theme.secondaryText }}
                >
                  Qty: {item.quantity} • {item.sku}
                </p>
              </div>
              <span
                className="text-[15px] font-bold"
                style={{ color: theme.text }}
              >
                ₹{item.price * item.quantity}
              </span>
            </div>
          ))}

          <div
            className="my-5 h-px border-t border-dashed"
            style={{ borderColor: theme.border, backgroundColor: "transparent" }}
          />

          {/* Summary */}
          <div className="mb-2.5 flex flex-row justify-between">
            <span className="text-[15px]" style={{ color: theme.secondaryText }}>Item Total (MRP)</span>
            <span className="text-[15px] font-bold" style={{ color: theme.text }}>₹{order?.mrpTotal}</span>
          </div>

          {order?.productDiscount > 0 && (
            <div className="mb-2.5 flex flex-row justify-between">
              <span className="text-[15px]" style={{ color: theme.secondaryText }}>Product Discount</span>
              <span className="text-[15px] font-bold" style={{ color: "#059669" }}>-₹{order?.productDiscount}</span>
            </div>
          )}

          <div className="mb-2.5 flex flex-row justify-between">
            <span className="text-[15px]" style={{ color: theme.secondaryText }}>Subtotal</span>
            <span className="text-[15px] font-bold" style={{ color: theme.text }}>₹{order?.totalAmount}</span>
          </div>

          <div className="mb-2.5 flex flex-row justify-between">
            <span className="text-[15px]" style={{ color: theme.secondaryText }}>Shipping Fee</span>
            <span className="text-[15px] font-bold" style={{ color: theme.text }}>
              {order?.shippingFee === 0 ? "FREE" : `₹${order?.shippingFee}`}
            </span>
          </div>

          {order?.discountAmount > 0 && (
            <div className="mb-2.5 flex flex-row justify-between">
              <span className="text-[15px]" style={{ color: theme.secondaryText }}>Coupon ({order?.couponCode})</span>
              <span className="text-[15px] font-bold" style={{ color: "#059669" }}>-₹{order?.discountAmount}</span>
            </div>
          )}

          <div
            className="mt-2.5 flex flex-row justify-between border-t pt-5"
            style={{ borderTopColor: theme.border }}
          >
            <span className="text-lg font-extrabold" style={{ color: theme.text }}>Total Paid</span>
            <span className="text-xl font-black" style={{ color: theme.primary }}>₹{order?.payableAmount}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col gap-4">
          <button
            type="button"
            onClick={() =>
              goTo(navigate, {
                pathname: "/order/[id]" as any,
                params: { id: order?.orderId || orderId },
              })
            }
            className="flex h-14 w-full flex-row items-center justify-center gap-3 rounded-[18px]"
            style={{ backgroundColor: theme.primary }}
          >
            <Package size={20} color="#fff" />
            <span className="text-base font-bold text-white">View Order Details & OTP</span>
          </button>

          <button
            type="button"
            onClick={() => replaceTo(navigate, "/(tabs)/clothing/home")}
            className="flex h-14 w-full flex-row items-center justify-center gap-3 rounded-[18px] border"
            style={{
              backgroundColor: theme.tertiaryBackground,
              borderColor: theme.border,
            }}
          >
            <ShoppingCart size={20} color={theme.text} />
            <span className="text-base font-bold" style={{ color: theme.text }}>Continue Shopping</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessScreen;
