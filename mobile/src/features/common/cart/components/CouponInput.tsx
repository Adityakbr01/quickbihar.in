import React, { useState } from "react";
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

const CouponInput = () => {
  const theme = useTheme() as any;
  const styles = createCartStyles(theme);
  const [code, setCode] = useState("");
  const { 
    items,
    applyCoupon, 
    removeCoupon, 
    appliedCoupons = [], 
    isLoading, 
    error 
  } = useCartStore();

  const productIds = React.useMemo(
    () => Array.from(new Set(items.map((i) => i.productId).filter(Boolean))),
    [items]
  );

  const { data: availableCoupons = [], isLoading: isLoadingCoupons } = useQuery<ICoupon[]>({
    queryKey: ["applicableCoupons", productIds],
    queryFn: () => getApplicableCouponsRequest(productIds),
    enabled: items.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

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
    }
  };

  const handleRemove = (couponCode: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    removeCoupon(couponCode);
  };

  return (
    <View style={styles.couponContainer}>
      <Text style={styles.couponTitle}>Offers & Benefits</Text>

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

      {/* Available Coupons list */}
      {availableCoupons.length > 0 && (
        <View style={{ marginTop: 14 }}>
          <View style={styles.availableCouponsHeader}>
            <Text style={styles.availableCouponsTitle}>Available Coupons</Text>
          </View>

          {availableCoupons.map((c) => {
            const isApplied = appliedCoupons.some(
              (ac) => ac.code.toUpperCase() === c.code.toUpperCase()
            );
            const discountLabel =
              c.discountType === "PERCENTAGE"
                ? `${c.discountValue}% OFF`
                : `₹${c.discountValue} OFF`;

            return (
              <View key={c._id || c.code} style={styles.couponCard}>
                <View style={styles.couponCardLeft}>
                  <View style={styles.couponCardCodeRow}>
                    <Text style={styles.couponCardCode}>{c.code}</Text>
                    <Text style={styles.couponCardDiscount}>{discountLabel}</Text>
                  </View>
                  <Text style={styles.couponCardDesc} numberOfLines={2}>
                    {c.description}
                  </Text>
                  {c.minOrderValue > 0 && (
                    <Text style={styles.couponCardMinOrder}>
                      Min order: ₹{c.minOrderValue}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  style={[
                    styles.couponApplyBtn,
                    isApplied && styles.couponApplyBtnApplied,
                  ]}
                  onPress={() => handleApply(c.code)}
                  disabled={isApplied || isLoading}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.couponApplyBtnText,
                      isApplied && styles.couponApplyBtnTextApplied,
                    ]}
                  >
                    {isApplied ? "Applied" : "Apply"}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

export default CouponInput;
