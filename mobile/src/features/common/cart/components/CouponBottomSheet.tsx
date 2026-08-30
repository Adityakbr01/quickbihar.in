import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ICoupon } from "@/src/features/common/coupon/types/coupon.types";
import { CartItem } from "../store/cartStore";
import {
  Sheet,
  SheetHeader,
  useSheet,
} from "@/src/components/common/BottomSheet";
import { spacing } from "@/src/theme/spacing";

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
  onApplyCoupon: (code: string) => Promise<void>;
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
  const sheet = useSheet();
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

  // Imperative present/dismiss from the parent `visible` prop.
  useEffect(() => {
    if (visible) {
      sheet.current?.present();
    } else {
      sheet.current?.dismiss();
    }
  }, [visible, sheet]);

  const handleApply = async (codeToApply: string) => {
    if (!codeToApply.trim()) return;
    setApplyingCode(codeToApply.trim().toUpperCase());
    try {
      await onApplyCoupon(codeToApply.trim().toUpperCase());
      setManualCode("");
      onClose();
    } catch {
      // Error handled by parent / store
    } finally {
      setApplyingCode(null);
    }
  };

  const handleRemove = (codeToRemove: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRemoveCoupon(codeToRemove);
  };

  const styles = useMemo(() => createStyles(theme), [theme]);

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

    return (
      <View
        key={coupon._id || coupon.code}
        style={[
          styles.couponCard,
          isApplied && styles.couponCardApplied,
          !isApplicable && !isApplied && styles.couponCardDisabled,
        ]}
      >
        <View style={styles.couponCardHeader}>
          {/* Code pill */}
          <View style={styles.codePillRow}>
            <View
              style={[
                styles.codePill,
                !isApplicable && !isApplied && styles.codePillDisabled,
              ]}
            >
              <Text
                style={[
                  styles.codeText,
                  !isApplicable && !isApplied && styles.codeTextDisabled,
                ]}
              >
                {coupon.code}
              </Text>
            </View>
            <View style={styles.discountBadge}>
              <Text style={styles.discountBadgeText}>{discountLabel}</Text>
            </View>
          </View>

          {/* Action Button */}
          {isApplied ? (
            <TouchableOpacity
              style={styles.appliedBtn}
              onPress={() => handleRemove(coupon.code)}
              activeOpacity={0.7}
            >
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={theme.primary}
              />
              <Text style={styles.appliedBtnText}>Applied</Text>
              <Text style={styles.removeText}>Remove</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.applyBtn,
                !isApplicable && styles.applyBtnDisabled,
              ]}
              onPress={() => handleApply(coupon.code)}
              disabled={!isApplicable || isLoading || isCurrentlyApplying}
              activeOpacity={0.8}
            >
              {isCurrentlyApplying ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text
                  style={[
                    styles.applyBtnText,
                    !isApplicable && styles.applyBtnTextDisabled,
                  ]}
                >
                  {isApplicable ? "Apply" : "Locked"}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Description */}
        {coupon.description ? (
          <Text
            style={[
              styles.couponDesc,
              !isApplicable && !isApplied && styles.couponDescMuted,
            ]}
            numberOfLines={2}
          >
            {coupon.description}
          </Text>
        ) : null}

        {/* Per-item coverage — drives the SPECIFIC-product UX. */}
        {showCoverage ? (
          <View style={styles.coverageRow}>
            <Ionicons
              name="checkmark-circle"
              size={13}
              color={theme.primary}
            />
            <Text style={styles.coverageText} numberOfLines={2}>
              Applies on {matchingItems.length} of {totalCartItems} item
              {totalCartItems === 1 ? "" : "s"}:{" "}
              <Text style={styles.coverageTextBold}>
                {visibleItemNames.map((m) => m.name).join(", ")}
                {moreCount > 0 ? ` +${moreCount} more` : ""}
              </Text>
            </Text>
          </View>
        ) : null}

        {/* Dynamic Status / Savings Tag */}
        <View style={styles.statusRow}>
          {isApplicable && !isApplied && (
            <View style={styles.savingsTag}>
              <Ionicons name="sparkles" size={13} color={theme.primary} />
              <Text style={styles.savingsTagText}>{reason}</Text>
            </View>
          )}

          {!isApplicable && !isApplied && (
            <View style={styles.lockedTag}>
              <Ionicons
                name="lock-closed-outline"
                size={13}
                color={theme.secondaryText}
              />
              <Text style={styles.lockedTagText}>{reason}</Text>
            </View>
          )}

          {isApplied && (
            <View style={styles.savingsTag}>
              <Ionicons name="checkmark" size={13} color={theme.primary} />
              <Text style={styles.savingsTagText}>
                Saving ₹{discountAmount.toLocaleString()} with this code
              </Text>
            </View>
          )}

          {coupon.minOrderValue > 0 && (
            <Text style={styles.minOrderText}>
              Min order ₹{coupon.minOrderValue}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <Sheet
      ref={sheet}
      onDidDismiss={onClose}
      backgroundColor={theme.background}
    >
      <SheetHeader
        title="Coupons & Offers"
        onClose={onClose}
        right={
          coupons.length > 0 ? (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{coupons.length}</Text>
            </View>
          ) : undefined
        }
      />

      {/* Manual Coupon Input inside Sheet */}
      <View style={styles.inputContainer}>
        <Ionicons
          name="pricetag-outline"
          size={18}
          color={theme.secondaryText}
          style={{ marginRight: 8 }}
        />
        <TextInput
          style={styles.input}
          placeholder="Enter coupon code"
          placeholderTextColor={theme.secondaryText}
          value={manualCode}
          onChangeText={setManualCode}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={[
            styles.manualApplyBtn,
            {
              backgroundColor: manualCode.trim()
                ? theme.primary
                : theme.border,
            },
          ]}
          onPress={() => handleApply(manualCode)}
          disabled={!manualCode.trim() || isLoading}
        >
          {applyingCode === manualCode.trim().toUpperCase() ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.manualApplyBtnText}>Apply</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Coupon List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {coupons.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="ticket-outline"
              size={48}
              color={theme.secondaryText}
            />
            <Text style={styles.emptyTitle}>No Coupons Available</Text>
            <Text style={styles.emptySubtitle}>
              Check back later or enter a promo code above if you have one.
            </Text>
          </View>
        ) : (
          <>
            {/* Applicable Coupons Section */}
            {applicableCoupons.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Ionicons
                    name="checkmark-done-circle"
                    size={16}
                    color={theme.primary}
                  />
                  <Text style={styles.sectionTitle}>
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
                  </Text>
                </View>
                {applicableCoupons.map(renderCouponItem)}
              </View>
            )}

            {/* Locked / Other Offers Section */}
            {lockedCoupons.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={16}
                    color={theme.secondaryText}
                  />
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: theme.secondaryText },
                    ]}
                  >
                    {lockedCoupons.length} locked offer
                    {lockedCoupons.length === 1 ? "" : "s"}
                  </Text>
                </View>
                {lockedCoupons.map(renderCouponItem)}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </Sheet>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.tertiaryBackground,
      borderRadius: 12,
      paddingHorizontal: 12,
      height: 48,
      borderWidth: 1,
      borderColor: theme.border,
      marginHorizontal: spacing.lg,
      marginBottom: 16,
    },
    input: {
      flex: 1,
      fontSize: 14,
      fontWeight: "600",
      color: theme.text,
    },
    manualApplyBtn: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 8,
      justifyContent: "center",
      alignItems: "center",
    },
    manualApplyBtnText: {
      color: "#fff",
      fontSize: 13,
      fontWeight: "700",
    },
    scrollContent: {
      paddingBottom: 24,
      paddingHorizontal: spacing.lg,
    },
    sectionContainer: {
      marginBottom: 16,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 10,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: theme.text,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    couponCard: {
      backgroundColor: theme.tertiaryBackground,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 14,
      marginBottom: 10,
    },
    couponCardApplied: {
      borderColor: theme.primary + "80",
      backgroundColor: theme.primary + "0A",
    },
    couponCardDisabled: {
      opacity: 0.75,
      backgroundColor: theme.background,
    },
    couponCardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    codePillRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flex: 1,
    },
    codePill: {
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: theme.primary,
      backgroundColor: theme.primary + "15",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    codePillDisabled: {
      borderColor: theme.border,
      backgroundColor: theme.tertiaryBackground,
    },
    codeText: {
      fontSize: 13,
      fontWeight: "800",
      color: theme.primary,
      letterSpacing: 0.5,
    },
    codeTextDisabled: {
      color: theme.secondaryText,
    },
    discountBadge: {
      backgroundColor: theme.primary + "15",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    discountBadgeText: {
      fontSize: 12,
      fontWeight: "800",
      color: theme.primary,
    },
    applyBtn: {
      backgroundColor: theme.primary,
      paddingHorizontal: 16,
      paddingVertical: 7,
      borderRadius: 8,
      justifyContent: "center",
      alignItems: "center",
      minWidth: 70,
    },
    applyBtnDisabled: {
      backgroundColor: theme.border,
    },
    applyBtnText: {
      color: "#fff",
      fontSize: 13,
      fontWeight: "700",
    },
    applyBtnTextDisabled: {
      color: theme.secondaryText,
    },
    appliedBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: theme.primary + "15",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.primary + "40",
    },
    appliedBtnText: {
      fontSize: 12,
      fontWeight: "700",
      color: theme.primary,
    },
    removeText: {
      fontSize: 11,
      color: theme.error || "#ef4444",
      fontWeight: "600",
      marginLeft: 4,
      textDecorationLine: "underline",
    },
    couponDesc: {
      fontSize: 12,
      color: theme.secondaryText,
      lineHeight: 16,
      marginBottom: 8,
    },
    couponDescMuted: {
      color: theme.tertiaryText || theme.secondaryText,
    },
    coverageRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 6,
      backgroundColor: theme.primary + "0A",
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 6,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: theme.primary + "20",
    },
    coverageText: {
      flex: 1,
      fontSize: 11,
      color: theme.secondaryText,
      lineHeight: 15,
    },
    coverageTextBold: {
      fontWeight: "700",
      color: theme.text,
    },
    statusRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 6,
      paddingTop: 4,
      borderTopWidth: 1,
      borderTopColor: theme.border + "60",
    },
    savingsTag: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: theme.primary + "12",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    savingsTagText: {
      fontSize: 11,
      fontWeight: "700",
      color: theme.primary,
    },
    lockedTag: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: theme.tertiaryBackground,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: theme.border,
    },
    lockedTagText: {
      fontSize: 11,
      fontWeight: "600",
      color: theme.secondaryText,
    },
    minOrderText: {
      fontSize: 11,
      color: theme.secondaryText,
      fontWeight: "500",
    },
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 40,
      gap: 8,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.text,
      marginTop: 8,
    },
    emptySubtitle: {
      fontSize: 13,
      color: theme.secondaryText,
      textAlign: "center",
      maxWidth: 260,
    },
    countBadge: {
      backgroundColor: theme.tertiaryBackground,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    countBadgeText: {
      fontSize: 12,
      fontWeight: "700",
      color: theme.primary,
    },
  });
