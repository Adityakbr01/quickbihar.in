import React, { useState } from "react";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { useCartStore, type AppliedCoupon } from "../store/cartStore";
import { AnimatedPrice } from "@/src/components/common/AnimatedPrice";

import { ChevronDown, ChevronUp } from "lucide-react";

interface CartSummaryProps {
  subtotal: number;
  totalTax: number;
  shipping: number;
  discount: number;
  appliedCoupon?: AppliedCoupon | null;
  discountAmount?: number;
}

const CartSummary = ({
  subtotal,
  totalTax,
  shipping,
  discount = 0,
  appliedCoupon,
  discountAmount = 0,
}: CartSummaryProps) => {
  const theme = useTheme() as any;
  const { appliedCoupons = [] } = useCartStore();
  // Default closed — the sticky checkout button already surfaces the total.
  const [expanded, setExpanded] = useState(true);

  // Total coupon discount
  const couponsTotalDiscount = appliedCoupons.length > 0
    ? appliedCoupons.reduce((sum, c) => sum + (c.appliedDiscount || 0), 0)
    : discountAmount;

  const totalDiscount = discount + couponsTotalDiscount;
  const total = Math.max(0, subtotal + shipping - totalDiscount);

  const toggle = () => {
    setExpanded((p) => !p);
  };

  const renderCouponRow = (coupon: AppliedCoupon) => {
    // If we know which items this coupon covers and it's a subset of
    // the cart, surface that as a "Applies on: X, Y" hint so the
    // buyer sees exactly which lines the discount will land on.
    const coveredNames = (coupon.appliedItems || [])
      .map((m) => m.name)
      .filter(Boolean);
    const isPartial = coveredNames.length > 0 && coupon.appliesTo === "SPECIFIC";

    return (
      <div key={coupon.code} className="mb-1.5">
        <div className="mb-2.5 flex flex-row items-center justify-between">
          <span
            className="line-clamp-1 text-sm font-medium"
            style={{ color: theme.secondaryText }}
          >
            Coupon ({coupon.code})
          </span>
          <AnimatedPrice
            value={-(coupon.appliedDiscount || 0)}
            showMinus
            duration={550}
            style={{ fontSize: 14, fontWeight: 700, color: theme.primary }}
          />
        </div>
        {isPartial ? (
          <p
            className="line-clamp-2 mt-0.5 pl-1 text-[11px] italic"
            style={{ color: theme.secondaryText }}
          >
            Applies on: {coveredNames.slice(0, 2).join(", ")}
            {coveredNames.length > 2 ? ` +${coveredNames.length - 2} more` : ""}
          </p>
        ) : null}
      </div>
    );
  };

  return (
    <div
      className="mx-4 mt-4 rounded-2xl border p-4"
      style={{ backgroundColor: theme.tertiaryBackground, borderColor: theme.border }}
    >
      <button
        type="button"
        onClick={toggle}
        aria-expanded={expanded}
        aria-label={expanded ? "Hide bill summary" : "Show bill summary"}
        className="flex w-full cursor-pointer flex-row items-center justify-between"
      >
        <span className="text-[17px] font-extrabold" style={{ color: theme.text }}>
          Bill Summary
        </span>
        <span className="flex flex-row items-center">
          <AnimatedPrice
            value={total}
            style={{ fontSize: 16, fontWeight: 800, color: theme.primary }}
          />
          {expanded ? (
            <ChevronUp size={18} color={theme.secondaryText} className="ml-1.5" />
          ) : (
            <ChevronDown size={18} color={theme.secondaryText} className="ml-1.5" />
          )}
        </span>
      </button>

      {expanded ? (
        <div className="mt-3.5">
          <div className="mb-2.5 flex flex-row items-center justify-between">
            <span className="text-sm font-medium" style={{ color: theme.secondaryText }}>
              Subtotal
            </span>
            <AnimatedPrice
              value={subtotal - totalTax}
              style={{ fontSize: 14, fontWeight: 700, color: theme.text }}
            />
          </div>

          {totalTax > 0 ? (
            <div className="mb-2.5 flex flex-row items-center justify-between">
              <span className="text-sm font-medium" style={{ color: theme.secondaryText }}>
                Taxes & GST (Included)
              </span>
              <AnimatedPrice
                value={totalTax}
                style={{ fontSize: 14, fontWeight: 700, color: theme.secondaryText }}
              />
            </div>
          ) : null}

          <div className="mb-2.5 flex flex-row items-center justify-between">
            <span className="text-sm font-medium" style={{ color: theme.secondaryText }}>
              Delivery Fee
            </span>
            {shipping === 0 ? (
              <span className="text-sm font-bold" style={{ color: theme.primary }}>FREE</span>
            ) : (
              <AnimatedPrice
                value={shipping}
                style={{ fontSize: 14, fontWeight: 700, color: theme.text }}
              />
            )}
          </div>

          {discount > 0 ? (
            <div className="mb-2.5 flex flex-row items-center justify-between">
              <span className="text-sm font-medium" style={{ color: theme.secondaryText }}>
                Product Discount
              </span>
              <AnimatedPrice
                value={-discount}
                showMinus
                duration={550}
                style={{ fontSize: 14, fontWeight: 700, color: theme.primary }}
              />
            </div>
          ) : null}

          {appliedCoupons.map(renderCouponRow)}

          {appliedCoupons.length === 0 && couponsTotalDiscount > 0 ? (
            <div className="mb-2.5 flex flex-row items-center justify-between">
              <span className="text-sm font-medium" style={{ color: theme.secondaryText }}>
                Coupon {appliedCoupon ? `(${appliedCoupon.code})` : ""}
              </span>
              <AnimatedPrice
                value={-couponsTotalDiscount}
                showMinus
                duration={550}
                style={{ fontSize: 14, fontWeight: 700, color: theme.primary }}
              />
            </div>
          ) : null}

          <div className="my-3 h-px" style={{ backgroundColor: theme.border }} />

          <div className="flex flex-row items-center justify-between">
            <span className="text-base font-extrabold" style={{ color: theme.text }}>
              Total Amount
            </span>
            <AnimatedPrice
              value={total}
              duration={750}
              style={{ fontSize: 19, fontWeight: 900, color: theme.primary }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default CartSummary;
