import React, { useState, useMemo } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert 
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { createCartStyles } from "../styles/cartStyles";
import { useCartStore } from "../store/cartStore";
import { getApplicableCouponsRequest } from "@/src/features/common/coupon/api/coupon.api";
import { ICoupon } from "@/src/features/common/coupon/types/coupon.types";
import { CouponBottomSheet, calculateCouponApplicability } from "./CouponBottomSheet";

const CouponInput = () => {
  const theme = useTheme() as any;
  const styles = createCartStyles(theme);
  const [code, setCode] = useState("");
  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);
  const { 
    items,
    applyCoupon, 
    removeCoupon, 
    appliedCoupons = [], 
    isLoading, 
    error 
  } = useCartStore();

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

  const handleApply = async (couponCodeToApply?: string) => {
    const targetCode = (couponCodeToApply || code).trim().toUpperCase();
    if (!targetCode) return;
    
    // Check if coupon code is already applied
    const isAlreadyApplied = appliedCoupons.some(
      (c) => c.code.toUpperCase() === targetCode
    );
    if (isAlreadyApplied) {
      Alert.alert("Coupon Already Applied", "This coupon is already applied to your cart.");
      return;
    }

    try {
      await applyCoupon(targetCode);
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

  return (
    <View style={styles.couponContainer}>
      {/* Header with Title and "View Offers" button opposite to it */}
      <View style={styles.couponHeaderRow}>
        <Text style={styles.couponTitle}>Offers & Benefits</Text>
        {availableCoupons.length > 0 && (
          <TouchableOpacity
            style={styles.viewOffersBtn}
            onPress={() => setIsBottomSheetVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="pricetag" size={12} color={theme.primary} />
            <Text style={styles.viewOffersText}>
              Offers ({availableCoupons.length})
            </Text>
            <Ionicons name="chevron-forward" size={12} color={theme.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Render list of applied coupons */}
      {appliedCoupons.map((coupon) => (
        <View key={coupon.code} style={[styles.appliedCouponContainer, { marginBottom: 12 }]}>
          <View style={styles.appliedCouponInfo}>
            <Ionicons name="checkmark-circle" size={22} color={theme.primary} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={[styles.appliedCouponText, { fontWeight: "800", color: theme.text }]} numberOfLines={1}>
                  {coupon.code} applied
                </Text>
              </View>
              <Text style={[styles.couponStatusText, { color: theme.primary, marginTop: 2, marginLeft: 0, fontWeight: "700" }]} numberOfLines={1}>
                You saved ₹{(coupon.appliedDiscount || 0).toLocaleString()}
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            onPress={() => handleRemove(coupon.code)} 
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={{ padding: 4 }}
          >
            <Text style={styles.removeCouponText}>Remove</Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* Render the input field to apply a coupon */}
      <View style={[
        styles.couponInputWrapper,
        error ? { borderColor: theme.error || "#ff4444" } : {}
      ]}>
        <Ionicons 
          name="pricetag-outline" 
          size={20} 
          color={theme.secondaryText} 
          style={{ marginRight: 10 }} 
        />
        <TextInput
          style={styles.couponInput}
          placeholder="Enter coupon code"
          placeholderTextColor={theme.secondaryText}
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={[
            styles.applyButton,
            { backgroundColor: code.trim() ? theme.primary : theme.border }
          ]}
          onPress={() => handleApply()}
          disabled={!code.trim() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.applyButtonText}>Apply</Text>
          )}
        </TouchableOpacity>
      </View>

      {error && (
        <Text style={[styles.couponStatusText, { color: theme.error || "#ff4444" }]}>
          {error}
        </Text>
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
    </View>
  );
};

export default CouponInput;
