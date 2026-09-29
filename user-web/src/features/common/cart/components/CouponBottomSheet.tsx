import React, { useMemo, useState } from "react";
import { Check, CheckCheck, CircleCheck, Lock, Sparkles, Tag, Ticket } from "lucide-react";
import * as Haptics from "@/lib/haptics";
import { ICoupon } from "@/src/features/common/coupon/types/coupon.types";
import { CartItem } from "../store/cartStore";
import { TextInput } from "@/src/theme/components/TextInput";
import { cn } from "@/src/lib/utils";
import { AppSheet } from "@/src/components/common/AppSheet";

/** A short summary of a cart line that a coupon applies to. */
export interface MatchingItem {
  sku: string;
  name: string;
  price: number;
  quantity: number;
}

export interface CouponApplicability {
  coupon: ICoupon;
  isApplicable: boolean;
  isApplied: boolean;
  eligibleSubtotal: number;
  discountAmount: number;
  shortfall: number;
  reason: string;
  /** Names of cart lines this coupon will discount (drives the "Applies on X of Y" UI). */
  matchingItems: MatchingItem[];
  /** Total cart line count, for the "X of Y" denominator. */
  totalCartItems: number;
}

interface CouponBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  coupons: ICoupon[];
  cartItems: CartItem[];
  appliedCoupons: ICoupon[];
  /**
   * Apply handler. Receives the code and, when the caller has the full
   * coupon object, the coupon itself — so the store can preview the
   * discount optimistically without waiting for the server round-trip.
   */
  onApplyCoupon: (code: string, coupon?: ICoupon) => Promise<void>;
  onRemoveCoupon: (code: string) => void;
  isLoading: boolean;
  theme: any;
}

// Helper to dynamically calculate coupon applicability and estimated savings
// ponytail: pure calculation helper running against active cart items
export function calculateCouponApplicability(
  coupon: ICoupon,
  cartItems: CartItem[],
  appliedCoupons: ICoupon[],
): CouponApplicability {
  const isApplied = appliedCoupons.some(
    (c) => c.code.toUpperCase() === coupon.code.toUpperCase(),
  );

  const couponSellerId = coupon.sellerId?.toString();
  let eligibleSubtotal = 0;
  const matchingItems: MatchingItem[] = [];
  const totalCartItems = cartItems.length;

  for (const item of cartItems) {
    const itemSellerId = item.sellerId?.toString();
    const itemId =
      typeof item.productId === "object"
        ? (item.productId as any)?._id
        : item.productId;

    if (couponSellerId && itemSellerId && itemSellerId !== couponSellerId) {
      continue;
    }

    if (coupon.appliesTo === "SPECIFIC") {
      const isEligibleProduct = coupon.productIds?.some(
        (id) => id.toString() === itemId?.toString(),
      );
      if (!isEligibleProduct) continue;
    }

    const linePrice = item.price || 0;
    const lineQty = item.quantity || 0;
    eligibleSubtotal += linePrice * lineQty;
    matchingItems.push({
      sku: item.sku,
      name: item.productTitle || "Product",
      price: linePrice,
      quantity: lineQty,
    });
  }

  // If no items in cart match the coupon criteria (seller-scoped or product-specific).
  if (matchingItems.length === 0 && cartItems.length > 0) {
    const reason =
      coupon.appliesTo === "SPECIFIC"
        ? "Not valid on any item in your cart"
        : couponSellerId
          ? "Not valid for items from other sellers"
          : "Not applicable to items in your cart";
    return {
      coupon,
      isApplicable: false,
      isApplied,
      eligibleSubtotal: 0,
      discountAmount: 0,
      shortfall: 0,
      reason,
      matchingItems: [],
      totalCartItems,
    };
  }

  const minOrder = coupon.minOrderValue || 0;
  if (eligibleSubtotal < minOrder) {
    const shortfall = minOrder - eligibleSubtotal;
    return {
      coupon,
      isApplicable: false,
      isApplied,
      eligibleSubtotal,
      discountAmount: 0,
      shortfall,
      reason: `Add ₹${shortfall.toLocaleString()} more to unlock`,
      matchingItems,
      totalCartItems,
    };
  }

  // Calculate estimated discount
  let discountAmount = 0;
  if (coupon.discountType === "PERCENTAGE") {
    discountAmount = (eligibleSubtotal * (coupon.discountValue || 0)) / 100;
    if (
      coupon.maxDiscountAmount &&
      coupon.maxDiscountAmount > 0 &&
      discountAmount > coupon.maxDiscountAmount
    ) {
      discountAmount = coupon.maxDiscountAmount;
    }
  } else {
    discountAmount = Math.min(coupon.discountValue || 0, eligibleSubtotal);
  }
  discountAmount = Math.round(discountAmount);

  return {
    coupon,
    isApplicable: true,
    isApplied,
    eligibleSubtotal,
    discountAmount,
    shortfall: 0,
    reason: `Save ₹${discountAmount.toLocaleString()} on this order`,
    matchingItems,
    totalCartItems,
  };
}

export const CouponBottomSheet: React.FC<CouponBottomSheetProps> = ({
  visible,
  onClose,
  coupons,
  cartItems,
  appliedCoupons,
  onApplyCoupon,
  onRemoveCoupon,
  isLoading,
  theme,
}) => {
  const [manualCode, setManualCode] = useState("");
  const [applyingCode, setApplyingCode] = useState<string | null>(null);

  // Group and evaluate coupons dynamically
  const evaluatedCoupons = useMemo(() => {
    return coupons.map((c) =>
      calculateCouponApplicability(c, cartItems, appliedCoupons),
    );
  }, [coupons, cartItems, appliedCoupons]);

  const applicableCoupons = useMemo(
    () => evaluatedCoupons.filter((ec) => ec.isApplicable),
    [evaluatedCoupons],
  );

  const lockedCoupons = useMemo(
    () => evaluatedCoupons.filter((ec) => !ec.isApplicable),
    [evaluatedCoupons],
  );

  const handleApply = async (codeToApply: string, couponObj?: ICoupon) => {
    if (!codeToApply.trim()) return;
    const upper = codeToApply.trim().toUpperCase();
    setApplyingCode(upper);
    // Close the sheet immediately so the buyer sees the discount land in
    // the cart — the store will apply optimistically and reconcile in the
    // background. If the call fails, the error surfaces on the cart screen
    // (and the coupon is rolled back) and the user can retry.
    onClose();
    setManualCode("");
    try {
      await onApplyCoupon(upper, couponObj);
    } catch {
      // Error handled by parent / store; we already closed the sheet so
      // the user is back on the cart screen where the error toast renders.
    } finally {
      setApplyingCode(null);
    }
  };

  const handleRemove = (codeToRemove: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRemoveCoupon(codeToRemove);
  };

  const renderCouponItem = (item: CouponApplicability) => {
    const {
      coupon,
      isApplicable,
      isApplied,
      discountAmount,
      reason,
      matchingItems,
      totalCartItems,
    } = item;
    const isCurrentlyApplying = applyingCode === coupon.code.toUpperCase();
    const discountLabel =
      coupon.discountType === "PERCENTAGE"
        ? `${coupon.discountValue}% OFF`
        : `₹${coupon.discountValue} OFF`;

    // "Applies on X of Y items" — only meaningful when the coupon doesn't
    // blanket-cover the whole cart (i.e. it's SPECIFIC or seller-scoped).
    const showCoverage =
      isApplicable &&
      matchingItems.length > 0 &&
      (coupon.appliesTo === "SPECIFIC" || matchingItems.length < totalCartItems);

    const visibleItemNames = matchingItems.slice(0, 2);
    const moreCount = matchingItems.length - visibleItemNames.length;
    const isDisabled = !isApplicable && !isApplied;

    return (
      <div
        key={coupon._id || coupon.code}
        className={cn("mb-2.5 rounded-[14px] border p-3.5", isDisabled && "opacity-75")}
        style={{
          backgroundColor: isApplied
            ? theme.primary + "0A"
            : isDisabled
              ? theme.background
              : theme.tertiaryBackground,
          borderColor: isApplied ? theme.primary + "80" : theme.border,
        }}
      >
        <div className="mb-2 flex flex-row items-center justify-between gap-2.5">
          {/* Code pill + discount badge — flex row that gracefully
              truncates instead of overflowing the action button. */}
          <div className="flex min-w-0 flex-1 flex-row items-center gap-2">
            <div
              className="min-w-0 shrink rounded-md border border-dashed px-2 py-1"
              style={{
                borderColor: isDisabled ? theme.border : theme.primary,
                backgroundColor: isDisabled ? theme.tertiaryBackground : theme.primary + "15",
              }}
            >
              <span
                className="line-clamp-1 text-[13px] font-extrabold tracking-[0.5px]"
                style={{ color: isDisabled ? theme.secondaryText : theme.primary }}
              >
                {coupon.code}
              </span>
            </div>
            {/* Show the discount badge only when there's space — hide it
                once the coupon is applied because the "Saving ₹X" line
                already conveys the amount. */}
            {!isApplied ? (
              <div
                className="shrink-0 rounded-md px-2 py-[3px]"
                style={{ backgroundColor: theme.primary + "15" }}
              >
                <span
                  className="line-clamp-1 text-xs font-extrabold"
                  style={{ color: theme.primary }}
                >
                  {discountLabel}
                </span>
              </div>
            ) : null}
          </div>

          {/* Action Button — compact chip when applied so it never
              collides with the code pill / discount badge. */}
          {isApplied ? (
            <div className="flex shrink-0 flex-col items-end gap-0.5">
              <div
                className="flex flex-row items-center gap-1 rounded-full border px-2.5 py-[5px]"
                style={{
                  backgroundColor: theme.primary + "15",
                  borderColor: theme.primary + "40",
                }}
              >
                <CircleCheck size={15} color={theme.primary} />
                <span className="text-xs font-extrabold" style={{ color: theme.primary }}>
                  Applied
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(coupon.code)}
                aria-label={`Remove coupon ${coupon.code}`}
                className="cursor-pointer px-1.5 py-0.5"
              >
                <span
                  className="text-[11px] font-bold underline"
                  style={{ color: theme.error || "#ef4444" }}
                >
                  Remove
                </span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => handleApply(coupon.code, coupon)}
              disabled={!isApplicable || isLoading || isCurrentlyApplying}
              className="flex min-w-[70px] cursor-pointer items-center justify-center rounded-lg px-4 py-[7px] disabled:cursor-not-allowed"
              style={{ backgroundColor: isApplicable ? theme.primary : theme.border }}
            >
              {isCurrentlyApplying ? (
                <span className="block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <span
                  className="text-[13px] font-bold text-white"
                  style={isApplicable ? undefined : { color: theme.secondaryText }}
                >
                  {isApplicable ? "Apply" : "Locked"}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Description */}
        {coupon.description ? (
          <p
            className="line-clamp-2 mb-2 text-xs leading-4"
            style={{ color: isDisabled ? (theme.tertiaryText || theme.secondaryText) : theme.secondaryText }}
          >
            {coupon.description}
          </p>
        ) : null}

        {/* Per-item coverage — drives the SPECIFIC-product UX. */}
        {showCoverage ? (
          <div
            className="mb-2 flex flex-row items-start gap-1.5 rounded-lg border px-2 py-1.5"
            style={{
              backgroundColor: theme.primary + "0A",
              borderColor: theme.primary + "20",
            }}
          >
            <CircleCheck size={13} color={theme.primary} />
            <p
              className="line-clamp-2 flex-1 text-[11px] leading-[15px]"
              style={{ color: theme.secondaryText }}
            >
              Applies on {matchingItems.length} of {totalCartItems} item
              {totalCartItems === 1 ? "" : "s"}:{" "}
              <span className="font-bold" style={{ color: theme.text }}>
                {visibleItemNames.map((m) => m.name).join(", ")}
                {moreCount > 0 ? ` +${moreCount} more` : ""}
              </span>
            </p>
          </div>
        ) : null}

        {/* Dynamic Status / Savings Tag */}
        <div
          className="flex flex-row flex-wrap items-center justify-between gap-1.5 border-t pt-1"
          style={{ borderTopColor: theme.border + "60" }}
        >
          {isApplicable && !isApplied && (
            <div
              className="flex flex-row items-center gap-1 rounded px-1.5 py-0.5"
              style={{ backgroundColor: theme.primary + "12" }}
            >
              <Sparkles size={13} color={theme.primary} />
              <span className="text-[11px] font-bold" style={{ color: theme.primary }}>
                {reason}
              </span>
            </div>
          )}

          {!isApplicable && !isApplied && (
            <div
              className="flex flex-row items-center gap-1 rounded border px-1.5 py-0.5"
              style={{ backgroundColor: theme.tertiaryBackground, borderColor: theme.border }}
            >
              <Lock size={13} color={theme.secondaryText} />
              <span
                className="text-[11px] font-semibold"
                style={{ color: theme.secondaryText }}
              >
                {reason}
              </span>
            </div>
          )}

          {isApplied && (
            <div
              className="flex flex-row items-center gap-1 rounded px-1.5 py-0.5"
              style={{ backgroundColor: theme.primary + "12" }}
            >
              <Check size={13} color={theme.primary} />
              <span className="text-[11px] font-bold" style={{ color: theme.primary }}>
                Saving ₹{discountAmount.toLocaleString()} with this code
              </span>
            </div>
          )}

          {coupon.minOrderValue > 0 ? (
            <span
              className="text-[11px] font-medium"
              style={{ color: theme.secondaryText }}
            >
              Min order ₹{coupon.minOrderValue}
            </span>
          ) : null}
        </div>
      </div>
    );
  };

  const titleNode = (
    <div className="flex flex-row items-center gap-2">
      <span className="text-base font-bold" style={{ color: theme.text }}>
        Coupons & Offers
      </span>
      {coupons.length > 0 ? (
        <div
          className="rounded-xl border px-2 py-0.5"
          style={{ backgroundColor: theme.tertiaryBackground, borderColor: theme.border }}
        >
          <span className="text-xs font-bold" style={{ color: theme.primary }}>
            {coupons.length}
          </span>
        </div>
      ) : null}
    </div>
  );

  return (
    <AppSheet
      visible={visible}
      onClose={onClose}
      title={titleNode}
      label="Coupons & Offers"
    >

        {/* Manual Coupon Input inside Sheet */}
        <TextInput
          placeholder="Enter coupon code"
          placeholderTextColor={theme.secondaryText}
          value={manualCode}
          onChangeText={setManualCode}
          autoCapitalize="characters"
          autoCorrect={false}
          icon={<Tag size={18} color={theme.secondaryText} />}
          rightIcon={
            <button
              type="button"
              onClick={() => handleApply(manualCode)}
              disabled={!manualCode.trim() || isLoading}
              className="flex cursor-pointer items-center justify-center rounded-lg px-3.5 py-1.5 disabled:cursor-not-allowed"
              style={{
                backgroundColor: manualCode.trim() ? theme.primary : theme.border,
              }}
            >
              {applyingCode === manualCode.trim().toUpperCase() ? (
                <span className="block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <span className="text-[13px] font-bold text-white">Apply</span>
              )}
            </button>
          }
          containerStyle={{ marginBottom: 16, marginHorizontal: 24 }}
          inputContainerStyle={{
            backgroundColor: theme.tertiaryBackground,
            borderRadius: 12,
            paddingHorizontal: 12,
            height: 48,
            borderWidth: 1,
          }}
          style={{ fontSize: 14, fontWeight: "600", color: theme.text }}
        />

        {/* Coupon List */}
        <div className="px-6 pb-4">
          {coupons.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10">
              <Ticket size={48} color={theme.secondaryText} />
              <p className="mt-2 text-base font-bold" style={{ color: theme.text }}>
                No Coupons Available
              </p>
              <p
                className="max-w-[260px] text-center text-[13px]"
                style={{ color: theme.secondaryText }}
              >
                Check back later or enter a promo code above if you have one.
              </p>
            </div>
          ) : (
            <>
              {/* Applicable Coupons Section */}
              {applicableCoupons.length > 0 && (
                <div className="mb-4">
                  <div className="mb-2.5 flex flex-row items-center gap-1.5">
                    <CheckCheck size={16} color={theme.primary} />
                    <span
                      className="text-[13px] font-bold tracking-[0.5px] uppercase"
                      style={{ color: theme.text }}
                    >
                      {(() => {
                        // For each applicable coupon, the union of items it
                        // covers gives a friendly "X items have offers" line.
                        const coveredSkus = new Set<string>();
                        applicableCoupons.forEach((c) =>
                          c.matchingItems.forEach((m) => coveredSkus.add(m.sku)),
                        );
                        const totalItems =
                          applicableCoupons[0]?.totalCartItems ?? 0;
                        if (
                          totalItems > 0 &&
                          coveredSkus.size > 0 &&
                          coveredSkus.size < totalItems
                        ) {
                          return `Applies on ${coveredSkus.size} of ${totalItems} items (${applicableCoupons.length} offer${applicableCoupons.length === 1 ? "" : "s"})`;
                        }
                        return `${applicableCoupons.length} offer${applicableCoupons.length === 1 ? "" : "s"} available on your cart`;
                      })()}
                    </span>
                  </div>
                  {applicableCoupons.map(renderCouponItem)}
                </div>
              )}

              {/* Locked / Other Offers Section */}
              {lockedCoupons.length > 0 && (
                <div className="mb-4">
                  <div className="mb-2.5 flex flex-row items-center gap-1.5">
                    <Lock size={16} color={theme.secondaryText} />
                    <span
                      className="text-[13px] font-bold tracking-[0.5px] uppercase"
                      style={{ color: theme.secondaryText }}
                    >
                      {lockedCoupons.length} locked offer
                      {lockedCoupons.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  {lockedCoupons.map(renderCouponItem)}
                </div>
              )}
            </>
          )}
        </div>
    </AppSheet>
  );
};
