import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Platform,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { APP_CURRENCY } from "@/src/constants";
import { getOrderByIdRequest } from "@/src/features/common/order/api/order.api";
import { useColors } from "@/src/features/Jewelery/hooks/useColors";
import { useTopPad } from "@/src/hooks/useTopPad";

export default function JeweleryOrderSuccessScreen() {
  const colors = useColors();
  const router = useRouter();
  const topPad = useTopPad();
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 34 : Math.max(insets.bottom, 20);

  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (orderId) {
      setIsLoading(true);
      getOrderByIdRequest(orderId)
        .then((res) => setOrder(res.data))
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }

    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      router.replace("/jewelery" as any);
      return true;
    });

    return () => backHandler.remove();
  }, [orderId]);

  const handleShare = async () => {
    if (!orderId) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Share.share({
        title: `Order #${orderId} Confirmed`,
        message: `👑 My QuickBihar Jewellery order #${orderId} has been confirmed!`,
      });
    } catch {}
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.ivory }]}>
      {/* Top bar with share */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 12,
            backgroundColor: colors.ivory,
          },
        ]}
      >
        <View style={{ width: 36 }} />
        <Text
          style={[
            styles.headerTitle,
            {
              color: colors.gold,
              fontFamily: "CormorantGaramond_600SemiBold",
            },
          ]}
        >
          QUICKBIHAR JEWELLERY
        </Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
          <Feather name="share-2" size={18} color={colors.ink} />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <View
          style={[
            styles.checkCircle,
            {
              backgroundColor: colors.champagne,
              borderColor: colors.gold,
            },
          ]}
        >
          <Feather name="check" size={36} color={colors.gold} />
        </View>

        <Text
          style={[
            styles.title,
            {
              color: colors.ink,
              fontFamily: "CormorantGaramond_600SemiBold",
            },
          ]}
        >
          ACQUISITION CONFIRMED
        </Text>

        <Text
          style={[
            styles.orderIdBadge,
            {
              color: colors.gold,
              fontFamily: "DMSans_700Bold",
            },
          ]}
        >
          ORDER #{orderId}
        </Text>

        <Text
          style={[
            styles.subtitle,
            {
              color: colors.warmGray,
              fontFamily: "DMSans_400Regular",
            },
          ]}
        >
          Thank you for choosing QuickBihar Jewellery. Your bespoke creation is now being
          carefully prepared with artisanal care and white-glove delivery standards.
        </Text>

        {order && (
          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.summaryRow}>
              <Text
                style={[
                  styles.summaryLabel,
                  { color: colors.warmGray, fontFamily: "DMSans_400Regular" },
                ]}
              >
                Pieces Acquired
              </Text>
              <Text
                style={[
                  styles.summaryVal,
                  { color: colors.ink, fontFamily: "DMSans_500Medium" },
                ]}
              >
                {(order.items || []).length} piece
                {(order.items || []).length !== 1 ? "s" : ""}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text
                style={[
                  styles.summaryLabel,
                  { color: colors.warmGray, fontFamily: "DMSans_400Regular" },
                ]}
              >
                Amount Paid
              </Text>
              <Text
                style={[
                  styles.summaryVal,
                  { color: colors.gold, fontFamily: "DMSans_700Bold" },
                ]}
              >
                {APP_CURRENCY}
                {(order.payableAmount || 0).toLocaleString("en-IN")}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text
                style={[
                  styles.summaryLabel,
                  { color: colors.warmGray, fontFamily: "DMSans_400Regular" },
                ]}
              >
                Payment Method
              </Text>
              <Text
                style={[
                  styles.summaryVal,
                  { color: colors.ink, fontFamily: "DMSans_500Medium" },
                ]}
              >
                {order.paymentMethod === "COD" ? "Cash on Delivery" : "Online Secured"}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View
        style={[
          styles.footer,
          {
            paddingBottom: bottomPad + 12,
            backgroundColor: colors.ivory,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: colors.gold }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.replace({
              pathname: "/jewelery/orders/[id]" as any,
              params: { id: orderId },
            });
          }}
          activeOpacity={0.88}
        >
          <Text
            style={[
              styles.primaryBtnText,
              { color: colors.onBrand, fontFamily: "DMSans_600SemiBold" },
            ]}
          >
            VIEW ORDER DETAILS
          </Text>
          <Feather name="arrow-right" size={14} color={colors.onBrand} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.secondaryBtn,
            { borderColor: colors.gold, backgroundColor: colors.cardBg },
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.replace("/jewelery" as any);
          }}
          activeOpacity={0.88}
        >
          <Text
            style={[
              styles.secondaryBtnText,
              { color: colors.gold, fontFamily: "DMSans_600SemiBold" },
            ]}
          >
            CONTINUE EXPLORING
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  headerTitle: {
    fontSize: 14,
    letterSpacing: 2,
  },
  shareBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    letterSpacing: 1,
    marginBottom: 8,
    textAlign: "center",
  },
  orderIdBadge: {
    fontSize: 13,
    letterSpacing: 1.2,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 24,
  },
  summaryCard: {
    width: "100%",
    borderRadius: 3,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 12,
  },
  summaryVal: {
    fontSize: 13,
  },
  footer: {
    paddingHorizontal: 24,
    gap: 10,
  },
  primaryBtn: {
    height: 50,
    borderRadius: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryBtnText: {
    fontSize: 12,
    letterSpacing: 1.5,
  },
  secondaryBtn: {
    height: 48,
    borderRadius: 2,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: {
    fontSize: 12,
    letterSpacing: 1.5,
  },
});
