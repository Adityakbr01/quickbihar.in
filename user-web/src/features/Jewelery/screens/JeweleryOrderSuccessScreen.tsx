import { ArrowRight, Check, Share2 } from "lucide-react";
import * as Haptics from "@/lib/haptics";
import { useNavigate } from "react-router-dom";
import { replaceTo, useRouteParams } from "@/src/utils/navigation";
import React, { useEffect, useState } from "react";
import { BREAKPOINTS, useWindowWidth } from "@/src/utils/responsive";

import { APP_CURRENCY } from "@/src/constants";
import { getOrderByIdRequest } from "@/src/features/common/order/api/order.api";
import { useColors } from "@/src/features/Jewelery/hooks/useColors";
import { useTopPad } from "@/src/hooks/useTopPad";
import {
  gaItemFromOrderLine,
  trackPurchase,
} from "@/src/analytics/googleAnalytics";

export default function JeweleryOrderSuccessScreen() {
  const colors = useColors();
  const navigate = useNavigate();
  const topPad = useTopPad();
  const bottomPad = 34;
  const width = useWindowWidth();
  const isDesktop = width >= BREAKPOINTS.desktopMin;
  // Viewport-fixed action bar: clears the 60px tab bar + 12px breathing
  // room on mobile; small offset on desktop where there is no tab bar.
  const stickyBottom = isDesktop ? 12 : 60 + 12;

  const { orderId } = useRouteParams<{ orderId?: string }>();
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (orderId) {
      setIsLoading(true);
      getOrderByIdRequest(orderId)
        .then((res) => {
          setOrder(res.data);
          // GA4 purchase — fires ONCE per server-generated order ID
          // (trackPurchase dedupes via localStorage, so refreshing this
          // page never emits a duplicate). Uses the authoritative order:
          // real transaction_id, payableAmount value, INR currency.
          const placedOrder = res.data;
          if (
            placedOrder &&
            placedOrder.orderId &&
            Array.isArray(placedOrder.items) &&
            placedOrder.items.length > 0
          ) {
            const couponCodes = Array.isArray(placedOrder.couponCodes)
              ? placedOrder.couponCodes.filter(Boolean).join(",")
              : "";
            trackPurchase({
              transactionId: placedOrder.orderId,
              value: placedOrder.payableAmount,
              items: placedOrder.items.map((item: any) =>
                gaItemFromOrderLine(item, "jewellery"),
              ),
              catalog: "jewellery",
              coupon:
                placedOrder.couponCode || couponCodes || undefined,
              shipping: placedOrder.shippingFee,
              tax: placedOrder.totalTax,
            });
          }
        })
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }
  }, [orderId, navigate]);

  const handleShare = async () => {
    if (!orderId) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const shareText = `👑 My QuickBihar Jewellery order #${orderId} has been confirmed!`;
      if (typeof navigator !== "undefined" && "share" in navigator) {
        await (navigator as any).share({
          title: `Order #${orderId} Confirmed`,
          text: shareText,
        });
      } else if (typeof navigator !== "undefined" && (navigator as any).clipboard) {
        await (navigator as any).clipboard.writeText(shareText);
        window.alert("Order details copied to clipboard!");
      }
    } catch {}
  };

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: colors.ivory }}
    >
      {/* Top bar with share */}
      <div
        className="flex flex-row items-center justify-between px-5 pb-3.5"
        style={{
          paddingTop: topPad + 12,
          backgroundColor: colors.ivory,
        }}
      >
        <div className="w-9" />
        <h1
          className="text-sm tracking-[2px]"
          style={{
            color: colors.gold,
            fontFamily: "CormorantGaramond_600SemiBold",
          }}
        >
          QUICKBIHAR JEWELLERY
        </h1>
        <button
          type="button"
          onClick={handleShare}
          className="flex h-9 w-9 cursor-pointer items-center justify-center"
          aria-label="Share order"
        >
          <Share2 size={18} color={colors.ink} />
        </button>
      </div>

      {/* Main Content */}
      <div
        className="flex flex-1 flex-col items-center justify-center px-7"
        style={{ paddingBottom: 140 }}
      >
        <div
          className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border"
          style={{
            backgroundColor: colors.champagne,
            borderColor: colors.gold,
            borderWidth: 1.5,
          }}
        >
          <Check size={36} color={colors.gold} />
        </div>

        <h2
          className="mb-2 text-center text-[24px] tracking-[1px]"
          style={{
            color: colors.ink,
            fontFamily: "CormorantGaramond_600SemiBold",
          }}
        >
          ACQUISITION CONFIRMED
        </h2>

        <span
          className="mb-4 block text-[13px] tracking-[1.2px]"
          style={{
            color: colors.gold,
            fontFamily: "DMSans_700Bold",
          }}
        >
          ORDER #{orderId}
        </span>

        <p
          className="mb-6 text-center text-[13px] leading-5"
          style={{
            color: colors.warmGray,
            fontFamily: "DMSans_400Regular",
          }}
        >
          Thank you for choosing QuickBihar Jewellery. Your bespoke creation is now being
          carefully prepared with artisanal care and white-glove delivery standards.
        </p>

        {order && (
          <div
            className="flex w-full flex-col gap-2.5 rounded-[3px] border p-4"
            style={{
              backgroundColor: colors.cardBg,
              borderColor: colors.border,
              borderWidth: 1,
            }}
          >
            <div className="flex flex-row items-center justify-between">
              <span
                className="text-xs"
                style={{ color: colors.warmGray, fontFamily: "DMSans_400Regular" }}
              >
                Pieces Acquired
              </span>
              <span
                className="text-[13px]"
                style={{ color: colors.ink, fontFamily: "DMSans_500Medium" }}
              >
                {(order.items || []).length} piece
                {(order.items || []).length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="flex flex-row items-center justify-between">
              <span
                className="text-xs"
                style={{ color: colors.warmGray, fontFamily: "DMSans_400Regular" }}
              >
                Amount Paid
              </span>
              <span
                className="text-[13px]"
                style={{ color: colors.gold, fontFamily: "DMSans_700Bold" }}
              >
                {APP_CURRENCY}
                {(order.payableAmount || 0).toLocaleString("en-IN")}
              </span>
            </div>

            <div className="flex flex-row items-center justify-between">
              <span
                className="text-xs"
                style={{ color: colors.warmGray, fontFamily: "DMSans_400Regular" }}
              >
                Payment Method
              </span>
              <span
                className="text-[13px]"
                style={{ color: colors.ink, fontFamily: "DMSans_500Medium" }}
              >
                {order.paymentMethod === "COD" ? "Cash on Delivery" : "Online Secured"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div
        className="fixed inset-x-0 z-40 flex flex-col gap-2.5 px-6"
        style={{
          bottom: stickyBottom,
          paddingBottom: bottomPad + 12,
          backgroundColor: colors.ivory,
        }}
      >
        <button
          type="button"
          className="flex h-[50px] w-full cursor-pointer flex-row items-center justify-center gap-2 rounded-[2px] transition-opacity active:opacity-90"
          style={{ backgroundColor: colors.gold }}
          onClick={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            replaceTo(navigate, {
              pathname: "/jewelery/orders/[id]" as any,
              params: { id: orderId },
            });
          }}
        >
          <span
            className="text-xs tracking-[1.5px]"
            style={{ color: colors.onBrand, fontFamily: "DMSans_600SemiBold" }}
          >
            VIEW ORDER DETAILS
          </span>
          <ArrowRight size={14} color={colors.onBrand} />
        </button>

        <button
          type="button"
          className="flex h-12 w-full cursor-pointer items-center justify-center rounded-[2px] border transition-opacity active:opacity-90"
          style={{
            borderColor: colors.gold,
            borderWidth: 1,
            backgroundColor: colors.cardBg,
          }}
          onClick={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            replaceTo(navigate, "/jewelery" as any);
          }}
        >
          <span
            className="text-xs tracking-[1.5px]"
            style={{ color: colors.gold, fontFamily: "DMSans_600SemiBold" }}
          >
            CONTINUE EXPLORING
          </span>
        </button>
      </div>
    </div>
  );
}
