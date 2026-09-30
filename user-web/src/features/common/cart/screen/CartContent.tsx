import React, { useEffect, useMemo } from "react";
import {
  BREAKPOINTS,
  DESKTOP,
  BOTTOM_TAB_BAR_HEIGHT,
  useWindowWidth,
} from "@/src/utils/responsive";
import { useSafeAreaInsets } from "@/src/hooks/useSafeAreaInsets";
import { ArrowRight } from "lucide-react";
import * as Haptics from "@/lib/haptics";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import {
  useCartStore,
  filterItemsByModule,
  totalsForItems,
} from "../store/cartStore";
import CartHeader from "../components/CartHeader";
import CartItem from "../components/CartItem";
import CartSummary from "../components/CartSummary";
import EmptyCart from "../components/EmptyCart";
import CouponInput from "../components/CouponInput";
import { useNavigate } from "react-router-dom";
import { goTo } from "@/src/utils/navigation";
import { useAuthStore } from "@/src/features/common/auth/store/authStore";
import { AnimatedPrice } from "@/src/components/common/AnimatedPrice";
import { trackBeginCheckout } from "@/src/analytics/googleAnalytics";

const CartContent = () => {
  const theme = useTheme() as any;
  const {
    items: allItems,
    updateQuantity,
    removeItem,
    fetchCart,
    isLoading,
    appliedCoupon,
    appliedCoupons = [],
    discountAmount,
    shippingRules,
    fetchShippingConfig,
  } = useCartStore();

  // Clothing cart shows ONLY clothing lines — jewelery lines live in the
  // jewelery bag even though both modules share the server cart.
  const items = useMemo(
    () => filterItemsByModule(allItems, "clothing"),
    [allItems],
  );
  const { subtotal, totalTax } = useMemo(() => totalsForItems(items), [items]);

  useEffect(() => {
    fetchCart();
    fetchShippingConfig();
  }, []);

  const handleUpdateQuantity = (sku: string, delta: number) => {
    const item = items.find((i) => i.sku === sku);
    if (item) {
      const newQty = item.quantity + delta;
      if (newQty > 0) {
        updateQuantity(sku, newQty);
      } else {
        handleRemoveItem(sku);
      }
    }
  };

  const handleRemoveItem = (sku: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    removeItem(sku);
  };

  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const winW = useWindowWidth();
  // Desktop web (clothing catalog): wider centered column + footer docks
  // to the viewport bottom since bottom tabs are hidden there.
  const isDesktop = winW >= BREAKPOINTS.desktopMin;
  const insets = useSafeAreaInsets();
  // Footer must clear the fixed tab bar + home-indicator safe area on
  // notched phones (hardcoded 70 buried the CTA behind the tab bar there).
  const footerBottom = isDesktop
    ? 0
    : BOTTOM_TAB_BAR_HEIGHT + (insets?.bottom ?? 0);

  const handleCheckout = () => {
    if (!isAuthenticated) {
      goTo(navigate, "/auth" as any);
      return;
    }
    // The buyer actually begins checkout — report the current clothing
    // bag (items, value, catalog) before leaving for /checkout.
    trackBeginCheckout(items);
    goTo(navigate, "/checkout" as any);
  };

  if (isLoading && items.length === 0) {
    return (
      <div
        className="flex flex-1 items-center justify-center"
        style={{ backgroundColor: theme.background }}
      >
        <span
          className="block h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
          style={{
            borderColor: `${theme.primary}40`,
            borderTopColor: theme.primary,
          }}
          role="status"
          aria-label="Loading cart"
        />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div
        className="flex flex-1"
        style={{ backgroundColor: theme.background }}
      >
        <EmptyCart />
      </div>
    );
  }

  // Calculate distinct products and total units
  const productsCount = items.length;
  const totalUnits = items.reduce((sum, i) => sum + (i.quantity || 1), 0);

  // Calculated values for summary & checkout
  const shipping = subtotal >= shippingRules.threshold ? 0 : shippingRules.fee;
  const autoDiscount = 0;
  const couponsTotalDiscount =
    appliedCoupons.length > 0
      ? appliedCoupons.reduce((sum, c) => sum + (c.appliedDiscount || 0), 0)
      : discountAmount || 0;

  const totalDiscount = autoDiscount + couponsTotalDiscount;
  const totalAmount = Math.max(0, subtotal + shipping - totalDiscount);

  return (
    <div
      className="flex w-full flex-1 flex-col items-center"
      style={{ backgroundColor: theme.background }}
    >
      <div
        className="flex w-full max-w-[800px] flex-1 flex-col"
        style={
          isDesktop
            ? {
                maxWidth: DESKTOP.narrowMaxWidth,
                paddingLeft: DESKTOP.gutter,
                paddingRight: DESKTOP.gutter,
              }
            : undefined
        }
      >
        <CartHeader productsCount={productsCount} totalUnits={totalUnits} />

        <div className="flex-1 overflow-y-auto pb-[220px]">
          {items.map((item) => (
            <CartItem
              key={item.sku}
              item={{
                id: item.sku,
                name: item.productTitle || "Product",
                price: item.price,
                unitPrice: item.price,
                originalPrice: item.originalPrice,
                image: item.image,
                quantity: item.quantity,
                sku: item.sku,
                selectedSize: item.selectedSize,
                selectedColor: item.selectedColor,
              }}
              onUpdateQuantity={(id, delta) =>
                handleUpdateQuantity(item.sku, delta)
              }
              onRemove={() => handleRemoveItem(item.sku)}
            />
          ))}

          <CouponInput />

          <CartSummary
            subtotal={subtotal}
            totalTax={totalTax}
            shipping={shipping}
            discount={autoDiscount}
            appliedCoupon={appliedCoupon}
            discountAmount={discountAmount}
          />
        </div>

        {/* Sticky Bottom Checkout CTA — viewport-fixed so it never slides
            behind the fixed tab bar. */}
        <div
          className="fixed right-0 left-0 z-[1000] mx-auto w-full border-t px-4 pt-3 pb-3"
          style={{
            backgroundColor: theme.background,
            borderTopColor: theme.border,
            bottom: footerBottom,
            maxWidth: isDesktop
              ? DESKTOP.narrowMaxWidth - DESKTOP.gutter * 2
              : 600,
          }}
        >
          <button
            type="button"
            onClick={handleCheckout}
            className="flex h-[54px] w-full cursor-pointer flex-row items-center justify-between rounded-2xl px-[18px]"
            style={{ backgroundColor: theme.primary }}
          >
            <span className="flex flex-col justify-center">
              <span className="text-[11px] font-semibold tracking-[0.3px] text-white/80 uppercase">
                {totalDiscount > 0 ? "Total · You save" : "Total Amount"}
              </span>
              <span className="mt-0.5 flex flex-row items-baseline gap-2.5">
                <AnimatedPrice
                  value={totalAmount}
                  duration={700}
                  style={{ color: "#fff", fontSize: 17, fontWeight: 900 }}
                />
                {totalDiscount > 0 ? (
                  <AnimatedPrice
                    value={totalDiscount}
                    duration={700}
                    noPulse
                    style={{
                      color: "rgba(255,255,255,0.85)",
                      fontSize: 12,
                      fontWeight: 700,
                      textDecorationLine: "line-through",
                    }}
                  />
                ) : null}
              </span>
            </span>
            <span className="flex flex-row items-center gap-1.5">
              <span className="text-base font-extrabold text-white">
                Place Order
              </span>
              <ArrowRight size={18} color="#fff" />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartContent;
