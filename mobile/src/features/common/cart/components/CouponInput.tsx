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
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { createCartStyles } from "../styles/cartStyles";
import { useCartStore } from "../store/cartStore";

const CouponInput = () => {
  const theme = useTheme();
  const styles = createCartStyles(theme);
  const [code, setCode] = useState("");
  const { 
    applyCoupon, 
    removeCoupon, 
    appliedCoupons = [], 
    isLoading, 
    error 
  } = useCartStore();

  const handleApply = async () => {
    if (!code.trim()) return;
    
    // Check if coupon code is already applied
    const isAlreadyApplied = appliedCoupons.some(
      (c) => c.code.toUpperCase() === code.trim().toUpperCase()
    );
    if (isAlreadyApplied) {
      Alert.alert("Coupon Already Applied", "This coupon is already applied to your cart.");
      return;
    }

    try {
      await applyCoupon(code.trim().toUpperCase());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCode("");
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
            <View style={styles.couponBadge}>
              <Text style={styles.couponBadgeText}>{coupon.code}</Text>
            </View>
            <View>
              <Text style={styles.appliedCouponText}>
                Saved ₹{(coupon.appliedDiscount || 0).toLocaleString()}
              </Text>
              <Text style={[styles.couponStatusText, { color: theme.primary, marginTop: 2, marginLeft: 0 }]}>
                Coupon applied successfully!
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => handleRemove(coupon.code)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
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
          onPress={handleApply}
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
    </View>
  );
};

export default CouponInput;
