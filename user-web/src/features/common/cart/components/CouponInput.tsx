import React, { useState, useMemo } from "react";
import { Check, ChevronRight, Tags } from "lucide-react";
import * as Haptics from "@/lib/haptics";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { useCartStore } from "../store/cartStore";
import { getApplicableCouponsRequest } from "@/src/features/common/coupon/api/coupon.api";
import { ICoupon } from "@/src/features/common/coupon/types/coupon.types";
import { CouponBottomSheet, calculateCouponApplicability } from "./CouponBottomSheet";

const CouponInput = ({ module = "clothing" }: { module?: "clothing" | "jewelery" } = {}) => {
  const theme = useTheme() as any;
  const [code, setCode] = useState("");
  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);
  const {
    items: allItems,
    applyCoupon,
    removeCoupon,
    appliedCoupons = [],
    isLoading,
    error
  } = useCartStore();

  // Coupon math runs against this bag's lines only.
  const items = useMemo(
    () => allItems.filter((i) => (i.module ?? "clothing") === module),
    [allItems, module],
  );

  const productIds = useMemo(
    () => Array.from(new Set(items.map((i) => i.productId).filter(Boolean))),
    [items]
  );

  const { data: availableCoupons = [], isLoading: isLoadingCoupons } = useQuery<ICoupon[]>({
    queryKey: ["applicableCoupons", productIds],
    queryFn: () => getApplicableCouponsRequest(productIds),
    enabled: items.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const applicableCount = useMemo(() => {
    return availableCoupons.filter(
      (c) => calculateCouponApplicability(c, items, appliedCoupons).isApplicable
    ).length;
  }, [availableCoupons, items, appliedCoupons]);

  const handleApply = async (
    couponCodeToApply?: string,
    optimisticCoupon?: ICoupon,
  ) => {
    const targetCode = (couponCodeToApply || code).trim().toUpperCase();
    if (!targetCode) return;

    // Check if coupon code is already applied
    const isAlreadyApplied = appliedCoupons.some(
      (c) => c.code.toUpperCase() === targetCode
    );
    if (isAlreadyApplied) {
      // Haptic-only — the coupon is already listed as applied below.
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    try {
      await applyCoupon(targetCode, optimisticCoupon, items);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (!couponCodeToApply) {
        setCode("");
      }
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      throw err;
    }
  };

  const handleRemove = (couponCode: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    removeCoupon(couponCode);
  };

  // Do not render the Offers & Benefits section if no offers are available and none are applied
  if (availableCoupons.length === 0 && appliedCoupons.length === 0) {
    return null;
  }

  return (
    <div
      className="mx-4 mt-5 mb-2 rounded-[18px] border p-4"
      style={{ backgroundColor: theme.tertiaryBackground, borderColor: theme.border }}
    >
      {/* Header: title always visible; "View offers" only when no coupon is applied */}
      <div className="flex flex-row items-center justify-between">
        <div className="flex flex-row items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-[10px]"
            style={{ backgroundColor: theme.primary + "15" }}
          >
            <Tags size={16} color={theme.primary} />
          </div>
          <span className="text-base font-extrabold" style={{ color: theme.text }}>
            Offers & Benefits
          </span>
        </div>
        {appliedCoupons.length === 0 && availableCoupons.length > 0 && (
          <button
            type="button"
            onClick={() => setIsBottomSheetVisible(true)}
            className="flex cursor-pointer flex-row items-center gap-1 rounded-full px-3 py-1.5"
            style={{ backgroundColor: theme.primary }}
          >
            <span className="text-xs font-extrabold text-white">
              View {availableCoupons.length} offer
              {availableCoupons.length === 1 ? "" : "s"}
            </span>
            <ChevronRight size={12} color="#fff" />
          </button>
        )}
      </div>

      {/* Render list of applied coupons */}
      {appliedCoupons.map((coupon) => (
        <div
          key={coupon.code}
          className="mb-3 flex flex-row items-center justify-between gap-2 rounded-[18px] border border-dashed p-3"
          style={{
            backgroundColor: theme.primary + "0F",
            borderColor: theme.primary + "35",
          }}
        >
          <div className="flex min-w-0 flex-1 flex-row items-center gap-2.5">
            <div
              className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: theme.primary }}
            >
              <Check size={16} color="#fff" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-row items-center gap-1.5">
                <span
                  className="line-clamp-1 text-[13px] font-extrabold"
                  style={{ color: theme.text }}
                >
                  {coupon.code}
                </span>
              </div>
              <p
                className="line-clamp-1 mt-0.5 text-xs font-bold"
                style={{ color: theme.primary }}
              >
                You saved ₹{(coupon.appliedDiscount || 0).toLocaleString()}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleRemove(coupon.code)}
            aria-label={`Remove coupon ${coupon.code}`}
            className="cursor-pointer p-1"
          >
            <span
              className="px-1 py-1 text-[13px] font-bold"
              style={{ color: theme.error || "#ef4444" }}
            >
              Remove
            </span>
          </button>
        </div>
      ))}
      {error && (
        <p
          className="mt-1.5 ml-1 text-xs font-semibold"
          style={{ color: theme.error || "#ff4444" }}
        >
          {error}
        </p>
      )}

      {/* Bottom Sheet containing full list with dynamic validation */}
      <CouponBottomSheet
        visible={isBottomSheetVisible}
        onClose={() => setIsBottomSheetVisible(false)}
        coupons={availableCoupons}
        cartItems={items}
        appliedCoupons={appliedCoupons}
        onApplyCoupon={handleApply}
        onRemoveCoupon={handleRemove}
        isLoading={isLoading}
        theme={theme}
      />
    </div>
  );
};

export default CouponInput;
