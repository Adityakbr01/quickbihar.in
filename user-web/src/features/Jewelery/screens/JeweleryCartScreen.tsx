import { Gift, Minus, Plus, RefreshCw, Shield, ShoppingBag, Trash2 } from "lucide-react";
import * as Haptics from "@/lib/haptics";
import { useNavigate } from "react-router-dom";
import { goTo } from "@/src/utils/navigation";
import React from "react";
import { cn } from "@/src/lib/utils";
import { BREAKPOINTS, useWindowWidth } from "@/src/utils/responsive";

import {
  APP_CURRENCY,
  JEWELERY_MODULE_CONFIG,
} from "@/src/constants";
import { useTopPad } from "@/src/hooks/useTopPad";
import { useCart } from "@/src/features/Jewelery/context/CartContext";
import { useColors } from "@/src/features/Jewelery/hooks/useColors";
import { useAuthStore } from "@/src/features/common/auth/store/authStore";
import { trackBeginCheckout } from "@/src/analytics/googleAnalytics";

function resolveImgSrc(source: any): string {
  if (!source) return "";
  if (typeof source === "string") return source;
  if (typeof source?.uri === "string") return source.uri;
  return "";
}

export default function JeweleryCartScreen() {
  const navigate = useNavigate();
  const colors = useColors();
  const topPad = useTopPad();
  const { cartItems, cartCount, removeFromCart, updateQuantity, cartTotal } =
    useCart();
  const { isAuthenticated } = useAuthStore();
  const bottomPad = 34;
  const width = useWindowWidth();
  const isDesktop = width >= BREAKPOINTS.desktopMin;
  // Viewport-fixed checkout bar: clears the 60px tab bar + 12px breathing
  // room on mobile; small offset on desktop where there is no tab bar.
  const stickyBottom = isDesktop ? 12 : 60 + 12;
  const totalQty = cartItems.reduce((s, i) => s + i.quantity, 0);

  const handleCheckout = () => {
    if (!isAuthenticated) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      goTo(navigate, "/auth" as any);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // The buyer actually begins checkout — report the current jewellery
    // bag before leaving for /jewelery/checkout. Bridge lines are mapped
    // to the store-line shape from their real product data.
    trackBeginCheckout(
      cartItems.map(({ product, quantity, sku }) => ({
        productId: product.id,
        productTitle: product.name,
        price: product.price,
        quantity,
        sku,
        module: "jewelery",
      })),
    );
    goTo(navigate, "/jewelery/checkout" as any);
  };

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: colors.ivory }}
    >
      <div
        className="flex flex-row items-center justify-between border-b px-5 pb-3.5"
        style={{
          paddingTop: topPad + 12,
          backgroundColor: colors.ivory,
          borderBottomColor: colors.midGray,
          borderBottomWidth: 1,
        }}
      >
        <h1
          className="text-[22px] tracking-[3px]"
          style={{
            color: colors.ink,
            fontFamily: "CormorantGaramond_600SemiBold",
          }}
        >
          Your Bag
        </h1>
        <span
          className="text-xs"
          style={{ color: colors.warmGray, fontFamily: "DMSans_400Regular" }}
        >
          {cartCount} item{cartCount !== 1 ? "s" : ""}
        </span>
      </div>

      {cartItems.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-10">
          <ShoppingBag size={40} color={colors.midGray} />
          <span
            className="whitespace-pre-line text-center text-[26px] leading-[34px]"
            style={{
              color: colors.ink,
              fontFamily: "CormorantGaramond_500Medium_Italic",
            }}
          >
            {"Your cart is quiet.\nLet's change that."}
          </span>
          <button
            type="button"
            className="mt-2 cursor-pointer rounded-[1px] border px-6 py-3"
            style={{ borderColor: colors.gold }}
            onClick={() => goTo(navigate, "/jewelery/collections" as any)}
          >
            <span
              className="text-xs tracking-[1px]"
              style={{ color: colors.gold, fontFamily: "DMSans_400Regular" }}
            >
              Browse Collections →
            </span>
          </button>
        </div>
      ) : (
        <>
          <div
            className="overflow-y-auto pb-4"
            style={{ paddingBottom: 16 + 96 }}
          >
            {/* Cart items */}
            {cartItems.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="flex flex-row gap-3.5 border-b p-4"
                style={{
                  backgroundColor: colors.pearl,
                  borderBottomColor: colors.midGray,
                  borderBottomWidth: 1,
                }}
              >
                <img
                  src={resolveImgSrc(product.image)}
                  alt={`${product.name} - Shop Online in Bihar`}
                  title={`${product.name} | QuickBihar Jewellery`}
                  className="h-[120px] w-[90px] rounded-[2px] object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <div className="flex flex-1 flex-col gap-1">
                  <span
                    className="text-[17px] leading-[22px]"
                    style={{
                      color: colors.ink,
                      fontFamily: "CormorantGaramond_500Medium_Italic",
                    }}
                  >
                    {product.name}
                  </span>
                  <span
                    className="text-[11px]"
                    style={{
                      color: colors.warmGray,
                      fontFamily: "DMSans_400Regular",
                    }}
                  >
                    {product.metal}
                    {product.stone ? ` · ${product.stone}` : ""}
                  </span>
                  <span
                    className="mt-1 text-[15px]"
                    style={{ color: colors.ink, fontFamily: "DMSans_500Medium" }}
                  >
                    {APP_CURRENCY}{product.price.toLocaleString("en-IN")}
                  </span>
                  <div className="mt-2 flex flex-row items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        updateQuantity(product.id, quantity - 1);
                      }}
                      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border"
                      style={{ borderColor: colors.midGray }}
                      aria-label="Decrease quantity"
                    >
                      <Minus size={12} color={colors.ink} />
                    </button>
                    <span
                      className="min-w-5 text-center text-sm"
                      style={{ color: colors.ink, fontFamily: "DMSans_500Medium" }}
                    >
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        updateQuantity(product.id, quantity + 1);
                      }}
                      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border"
                      style={{ borderColor: colors.midGray }}
                      aria-label="Increase quantity"
                    >
                      <Plus size={12} color={colors.ink} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        removeFromCart(product.id);
                      }}
                      className="ml-auto cursor-pointer"
                      aria-label="Remove item"
                    >
                      <Trash2 size={14} color={colors.warmGray} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Order summary */}
            <div
              className="m-4 flex flex-col gap-2 rounded-[2px] p-4"
              style={{ backgroundColor: colors.champagne }}
            >
              <span
                className="mb-1 text-[9px] tracking-[2px]"
                style={{ color: colors.gold, fontFamily: "DMSans_500Medium" }}
              >
                ORDER SUMMARY
              </span>
              <div className="flex flex-row justify-between">
                <span
                  className="text-[13px]"
                  style={{
                    color: colors.warmGray,
                    fontFamily: "DMSans_400Regular",
                  }}
                >
                  Subtotal
                </span>
                <span
                  className="text-[13px]"
                  style={{ color: colors.ink, fontFamily: "DMSans_500Medium" }}
                >
                  {APP_CURRENCY}{cartTotal.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex flex-row justify-between">
                <span
                  className="text-[13px]"
                  style={{
                    color: colors.warmGray,
                    fontFamily: "DMSans_400Regular",
                  }}
                >
                  Shipping
                </span>
                <span
                  className="text-[13px]"
                  style={{ color: colors.gold, fontFamily: "DMSans_400Regular" }}
                >
                  {cartTotal >= JEWELERY_MODULE_CONFIG.freeShippingThreshold ? "Free" : "At checkout"}
                </span>
              </div>
              <div
                className="my-1 h-px"
                style={{ backgroundColor: colors.midGray }}
              />
              <div className="flex flex-row justify-between">
                <span
                  className="text-[15px]"
                  style={{ color: colors.ink, fontFamily: "DMSans_500Medium" }}
                >
                  Total
                </span>
                <span
                  className="text-[20px]"
                  style={{ color: colors.ink, fontFamily: "CormorantGaramond_600SemiBold" }}
                >
                  {APP_CURRENCY}
                  {cartTotal.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Trust signals */}
            <div
              className="mx-4 flex flex-row justify-around border-t p-4"
              style={{ borderTopColor: colors.midGray, borderTopWidth: 1 }}
            >
              {[
                { icon: Shield, text: "Hallmark Certified" },
                { icon: RefreshCw, text: `Free Returns ${JEWELERY_MODULE_CONFIG.returnPolicyDays}d` },
                { icon: Gift, text: "Gift Box Included" },
              ].map((t) => (
                <div key={t.text} className="flex flex-col items-center gap-1">
                  <t.icon size={13} color={colors.gold} />
                  <span
                    className="text-center text-[9px] tracking-[0.3px]"
                    style={{
                      color: colors.warmGray,
                      fontFamily: "DMSans_400Regular",
                    }}
                  >
                    {t.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Sticky checkout */}
          <div
            className={cn("fixed inset-x-0 z-40 flex flex-row items-center px-5 pt-3.5")}
            style={{
              bottom: stickyBottom,
              backgroundColor: colors.ivory,
              borderTopColor: colors.midGray,
              borderTopWidth: 1,
              paddingBottom: bottomPad + 16,
            }}
          >
            <div>
              <span
                className="block text-[18px]"
                style={{ color: colors.ink, fontFamily: "DMSans_500Medium" }}
              >
                {APP_CURRENCY}{cartTotal.toLocaleString("en-IN")}
              </span>
              <span
                className="block text-[11px]"
                style={{
                  color: colors.warmGray,
                  fontFamily: "DMSans_400Regular",
                }}
              >
                {totalQty} item{totalQty !== 1 ? "s" : ""}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCheckout}
              className="ml-4 flex-1 cursor-pointer rounded-[1px] py-4 text-center transition-opacity active:opacity-90"
              style={{ backgroundColor: colors.gold }}
            >
              <span
                className="text-[13px] tracking-[1.5px]"
                style={{ color: colors.onBrand, fontFamily: "DMSans_500Medium" }}
              >
                Place Order
              </span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
