import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { AiEditingIcon, Delete02Icon, Coupon02Icon } from "@hugeicons/core-free-icons";
import { Theme, useTheme } from "@/src/theme/Provider/ThemeProvider";
import { ICoupon } from "../types/coupon.types";

interface CouponCardProps {
  coupon: ICoupon;
  onEdit: (coupon: ICoupon) => void;
  onDelete: (id: string) => void;
}

const CouponCard = ({ coupon, onEdit, onDelete }: CouponCardProps) => {
  const theme = useTheme();
  
  const isExpired = new Date(coupon.endDate) < new Date();
  const status = !coupon.isActive ? "Inactive" : isExpired ? "Expired" : "Active";
  const statusColor = !coupon.isActive ? theme.tertiaryText : isExpired ? theme.error : theme.primary;

  return (
    <View style={[styles.card, { borderColor: theme.border }]}>
      <View style={[styles.iconContainer, { backgroundColor: theme.primary + "15" }]}>
        <HugeiconsIcon icon={Coupon02Icon} size={24} color={theme.primary} />
      </View>
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.code, { color: theme.text }]}>{coupon.code}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + "15" }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{status}</Text>
          </View>
        </View>
        
        <Text style={[styles.description, { color: theme.tertiaryText }]} numberOfLines={2}>
          {coupon.description}
        </Text>
        
        <Text style={[styles.discount, { color: theme.text }]}>
          {coupon.discountType === "PERCENTAGE" ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}
          {coupon.minOrderValue > 0 && <Text style={styles.minSpend}> • Min spend ₹{coupon.minOrderValue}</Text>}
        </Text>
        
        <View style={styles.usageContainer}>
            <View style={[styles.usageBar, { backgroundColor: theme.border }]}>
                <View 
                    style={[
                        styles.usageFill, 
                        { 
                            backgroundColor: theme.primary, 
                            width: `${(coupon.usedCount / coupon.usageLimit) * 100}%` 
                        }
                    ]} 
                />
            </View>
            <Text style={[styles.usageText, { color: theme.tertiaryText }]}>
                {coupon.usedCount}/{coupon.usageLimit} used
            </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity onPress={() => onEdit(coupon)} style={styles.actionBtn}>
          <HugeiconsIcon icon={AiEditingIcon} size={20} color={theme.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(coupon._id)} style={styles.actionBtn}>
          <HugeiconsIcon icon={Delete02Icon} size={20} color={theme.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "transparent",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    borderWidth: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  code: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
  },
  description: {
    fontSize: 13,
    marginBottom: 6,
  },
  discount: {
    fontSize: 14,
    fontWeight: "700",
  },
  minSpend: {
    fontSize: 12,
    fontWeight: "400",
    opacity: 0.7,
  },
  usageContainer: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  usageBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    marginRight: 8,
    overflow: "hidden",
  },
  usageFill: {
    height: "100%",
  },
  usageText: {
    fontSize: 10,
    fontWeight: "600",
  },
  actions: {
    justifyContent: "center",
    paddingLeft: 8,
  },
  actionBtn: {
    padding: 8,
  },
});

export default CouponCard;
