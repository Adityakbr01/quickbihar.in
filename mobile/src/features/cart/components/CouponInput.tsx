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
    appliedCoupon, 
    discountAmount, 
    isLoading, 
    error 
  } = useCartStore();

  const handleApply = async () => {
    if (!code.trim()) return;
    
    try {
      await applyCoupon(code.trim().toUpperCase());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCode("");
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      // Error is handled in store and displayed in UI
    }
  };

  const handleRemove = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    removeCoupon();
  };

  if (appliedCoupon) {
    return (
      <View style={styles.couponContainer}>
        <Text style={styles.couponTitle}>Applied Coupon</Text>
        <View style={styles.appliedCouponContainer}>
          <View style={styles.appliedCouponInfo}>
            <View style={styles.couponBadge}>
              <Text style={styles.couponBadgeText}>{appliedCoupon.code}</Text>
            </View>
            <View>
              <Text style={styles.appliedCouponText}>
                Saved ₹{discountAmount.toLocaleString()}
              </Text>
              <Text style={[styles.couponStatusText, { color: theme.primary, marginTop: 2 }]}>
                Coupon applied successfully!
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleRemove} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.removeCouponText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.couponContainer}>
      <Text style={styles.couponTitle}>Offers & Benefits</Text>
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
