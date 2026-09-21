import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { APP_CURRENCY, JEWELERY_MODULE_CONFIG } from "@/src/constants";
import { useAuthStore } from "@/src/features/common/auth/store/authStore";
import { getAddressesRequest, updateAddressRequest } from "@/src/features/common/address/api/address.api";
import PhoneOtpSheet from "@/src/features/common/address/components/PhoneOtpSheet";
import { useCartStore } from "@/src/features/common/cart/store/cartStore";
import {
  createOrderRequest,
  quoteOrderRequest,
  verifyPaymentRequest,
} from "@/src/features/common/order/api/order.api";
import type { OrderQuoteData } from "@/src/features/common/order/api/order.api";
import { RAZORPAY_CONFIG } from "@/src/features/common/order/config/razorpay.config";
import { openRazorpayCheckout } from "@/src/features/common/order/lib/openRazorpayCheckout";
import IOSAlertDialog, { AlertButton } from "@/src/components/ui/IOSAlertDialog";
import { PhoneMissingBanner } from "@/src/features/common/order/components/PhoneMissingBanner";
import { useColors } from "@/src/features/Jewelery/hooks/useColors";
import { useTopPad } from "@/src/hooks/useTopPad";
import { goBack } from "@/src/utils/navigation";

export default function JeweleryCheckoutScreen() {
  const colors = useColors();
  const router = useRouter();
  const topPad = useTopPad();
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const {
    items: allItems,
    clearCart,
    shippingRules,
    fetchShippingConfig,
  } = useCartStore();

  // Jewelery checkout operates on jewelery lines only. Clothing coupons
  // are deliberately excluded — this flow has no coupon UI, so any
  // applied clothing coupon must not leak into a jewelery order.
  const items = useMemo(
    () => allItems.filter((i) => (i.module ?? "clothing") === "jewelery"),
    [allItems],
  );
  const { subtotal } = useMemo(
    () => ({
      subtotal: items.reduce((acc, i) => acc + (i.price || 0) * i.quantity, 0),
    }),
    [items],
  );
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    fetchShippingConfig();
  }, []);

  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [quote, setQuote] = useState<OrderQuoteData | null>(null);
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"ONLINE" | "COD">("ONLINE");
  const [otpSheetVisible, setOtpSheetVisible] = useState(false);

  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons: AlertButton[];
  }>({
    visible: false,
    title: "",
    message: "",
    buttons: [],
  });

  const showAlert = (title: string, message: string, buttons: AlertButton[]) => {
    setAlertConfig({ visible: true, title, message, buttons });
  };
  const hideAlert = () => setAlertConfig((p) => ({ ...p, visible: false }));

  const shipping = subtotal >= shippingRules.threshold ? 0 : shippingRules.fee;
  const totalPayable = quote?.payableAmount ?? (subtotal + shipping);
  const displayShipping = quote?.shippingFee ?? shipping;
  const dynamicDeliverySurcharge = quote?.dynamicDeliverySurcharge ?? 0;

  const hasAddressGps = (address: any) => {
    const lat = Number(address?.latitude);
    const lng = Number(address?.longitude);
    return Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0);
  };

  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated) {
        router.replace("/auth" as any);
        return;
      }
      fetchAddresses();
    }, [isAuthenticated])
  );

  const buildOrderData = () => ({
    items: items.map((item) => ({
      productId: typeof item.productId === "object" ? (item.productId as any)._id : item.productId,
      sku: item.sku,
      quantity: item.quantity,
    })),
    shippingAddress: {
      fullName: selectedAddress.fullName,
      phone: selectedAddress.phone,
      street: selectedAddress.street,
      city: selectedAddress.city,
      state: selectedAddress.state,
      pincode: selectedAddress.pincode,
      landmark: selectedAddress.landmark,
      latitude: Number(selectedAddress.latitude),
      longitude: Number(selectedAddress.longitude),
    },
    couponCodes: [] as string[],
    paymentMethod,
  });

  useEffect(() => {
    let cancelled = false;
    const fetchQuote = async () => {
      if (!selectedAddress || !hasAddressGps(selectedAddress) || items.length === 0) {
        setQuote(null);
        return;
      }
      try {
        setIsQuoteLoading(true);
        setQuoteError("");
        const response = await quoteOrderRequest(buildOrderData());
        if (!cancelled) setQuote(response.data);
      } catch (error: any) {
        if (!cancelled) {
          setQuote(null);
          const rawMsg = error.response?.data?.message || error.message || "";
          const friendlyMsg =
            rawMsg.includes("24 character hex") || rawMsg.includes("Cast to ObjectId") || rawMsg.includes("BSON")
              ? "Unable to verify delivery to this location. Please check your address."
              : rawMsg || "Unable to fetch delivery quote";
          setQuoteError(friendlyMsg);
        }
      } finally {
        if (!cancelled) setIsQuoteLoading(false);
      }
    };
    fetchQuote();
    return () => { cancelled = true; };
  }, [selectedAddress, items]);

  const fetchAddresses = async () => {
    try {
      setIsLoading(true);
      const response = await getAddressesRequest();
      const addrList = response.data || [];
      setAddresses(addrList);
      const defaultAddr =
        addrList.find((a: any) => a.isDefault && a.isPhoneVerified) ||
        addrList.find((a: any) => a.isPhoneVerified) ||
        addrList.find((a: any) => a.isDefault) ||
        addrList[0];
      setSelectedAddress((prev: any) => {
        if (prev) {
          const fresh = addrList.find((a: any) => a._id === prev._id);
          if (fresh) return fresh;
        }
        return defaultAddr;
      });
    } catch (error) {
      console.error("Failed to fetch addresses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (!selectedAddress) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert("Address Required", "Please select a delivery address", [
        { text: "OK", style: "default" },
      ]);
      return;
    }

    if (!hasAddressGps(selectedAddress)) {
      showAlert(
        "Location Pin Required",
        "Please edit this delivery address and tap Use My Current Location before placing the order.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Update Address",
            onPress: () =>
              router.push({
                pathname: "/jewelery/address-form" as any,
                params: {
                  id: selectedAddress._id,
                  data: JSON.stringify(selectedAddress),
                  returnTo: "/jewelery/checkout",
                },
              }),
          },
        ]
      );
      return;
    }

    if (!selectedAddress.isPhoneVerified) {
      showAlert(
        "Phone Verification Required",
        "Please verify the phone number on your delivery address via WhatsApp OTP before placing your order.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Verify Now", style: "default", onPress: () => setOtpSheetVisible(true) },
        ]
      );
      return;
    }

    try {
      setIsProcessingPayment(true);
      const orderData = buildOrderData();
      const quoteResponse = await quoteOrderRequest(orderData);
      setQuote(quoteResponse.data);

      const orderResponse = await createOrderRequest(orderData);
      const { razorpayOrder, order } = orderResponse.data;

      if (paymentMethod === "COD" || !razorpayOrder) {
        clearCart("jewelery");
        router.replace({ pathname: "/jewelery/order-success" as any, params: { orderId: order.orderId } });
        return;
      }

      const options = {
        description: "Payment for Order " + order.orderId,
        currency: razorpayOrder.currency,
        key: RAZORPAY_CONFIG.KEY_ID,
        amount: razorpayOrder.amount,
        name: "QuickBihar Jewellery",
        order_id: razorpayOrder.id,
        prefill: {
          email: user?.email || "",
          contact: selectedAddress.phone || "",
          name: user?.fullName || "",
        },
        theme: { color: colors.gold },
      };

      openRazorpayCheckout(options)
        .then(async (data: any) => {
          try {
            await verifyPaymentRequest({
              razorpayOrderId: data.razorpay_order_id,
              razorpayPaymentId: data.razorpay_payment_id,
              razorpaySignature: data.razorpay_signature,
            });
            clearCart("jewelery");
            router.replace({ pathname: "/jewelery/order-success" as any, params: { orderId: order.orderId } });
          } catch (verifyError: any) {
            showAlert(
              "Payment Verification Failed",
              verifyError.message || "Please contact support if amount was deducted.",
              [{ text: "OK", style: "default" }]
            );
          }
        })
        .catch((error: any) => {
          showAlert(
            "Payment Cancelled",
            error.description || "The payment process was interrupted. No money was deducted.",
            [{ text: "Dismiss", style: "cancel" }]
          );
        });
    } catch (error: any) {
      showAlert("Order Failed", error.message || "Failed to initiate order", [{ text: "OK", style: "default" }]);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.ivory },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingTop: topPad + 8,
      paddingBottom: 14,
      paddingHorizontal: 20,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.midGray,
      backgroundColor: colors.ivory,
      gap: 12,
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.midGray,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      flex: 1,
      fontSize: 20,
      color: colors.ink,
      fontFamily: "CormorantGaramond_600SemiBold",
      letterSpacing: 2,
    },
    scroll: { flex: 1 },
    scrollContent: { paddingBottom: 160 },
    section: {
      marginHorizontal: 16,
      marginTop: 16,
      backgroundColor: colors.pearl,
      borderRadius: 2,
      padding: 16,
      borderWidth: 0.5,
      borderColor: colors.midGray,
    },
    sectionLabel: {
      fontSize: 9,
      letterSpacing: 2,
      color: colors.gold,
      fontFamily: "DMSans_500Medium",
      marginBottom: 12,
    },
    sectionRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    changeText: {
      fontSize: 12,
      color: colors.gold,
      fontFamily: "DMSans_400Regular",
    },
    addressName: {
      fontSize: 15,
      color: colors.ink,
      fontFamily: "DMSans_500Medium",
    },
    addressLine: {
      fontSize: 13,
      color: colors.warmGray,
      fontFamily: "DMSans_400Regular",
      marginTop: 2,
      lineHeight: 18,
    },
    phoneRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 6,
    },
    phoneText: {
      fontSize: 12,
      color: colors.warmGray,
      fontFamily: "DMSans_400Regular",
    },
    verifiedBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: colors.champagne,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
    },
    verifiedText: {
      fontSize: 10,
      color: colors.gold,
      fontFamily: "DMSans_500Medium",
    },
    noAddress: {
      fontSize: 13,
      color: colors.warmGray,
      fontFamily: "DMSans_400Regular",
      fontStyle: "italic",
      textAlign: "center",
      paddingVertical: 8,
    },
    itemRow: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 12,
      paddingBottom: 12,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.midGray,
    },
    itemImg: { width: 60, height: 80, borderRadius: 2 },
    itemInfo: { flex: 1, gap: 3 },
    itemTitle: {
      fontSize: 14,
      color: colors.ink,
      fontFamily: "CormorantGaramond_500Medium_Italic",
    },
    itemMeta: {
      fontSize: 11,
      color: colors.warmGray,
      fontFamily: "DMSans_400Regular",
    },
    itemPrice: {
      fontSize: 13,
      color: colors.ink,
      fontFamily: "DMSans_500Medium",
    },
    payOpt: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      marginBottom: 8,
      borderWidth: 1,
      borderRadius: 2,
      gap: 12,
    },
    payOptLabel: {
      fontSize: 14,
      fontFamily: "DMSans_500Medium",
    },
    payOptDesc: {
      fontSize: 11,
      fontFamily: "DMSans_400Regular",
      color: colors.warmGray,
    },
    summaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    summaryKey: {
      fontSize: 13,
      color: colors.warmGray,
      fontFamily: "DMSans_400Regular",
    },
    summaryVal: {
      fontSize: 13,
      color: colors.ink,
      fontFamily: "DMSans_500Medium",
    },
    divider: { height: 0.5, backgroundColor: colors.midGray, marginVertical: 8 },
    totalRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
    totalKey: {
      fontSize: 16,
      color: colors.ink,
      fontFamily: "DMSans_500Medium",
    },
    totalVal: {
      fontSize: 22,
      color: colors.ink,
      fontFamily: "CormorantGaramond_600SemiBold",
    },
    quoteErrorBox: {
      margin: 16,
      padding: 14,
      borderRadius: 2,
      borderWidth: 0.5,
      borderColor: colors.maroon,
      backgroundColor: colors.champagne,
      gap: 6,
    },
    quoteErrorTitle: {
      fontSize: 13,
      color: colors.maroon,
      fontFamily: "DMSans_500Medium",
    },
    quoteErrorMsg: {
      fontSize: 12,
      color: colors.maroon,
      fontFamily: "DMSans_400Regular",
      lineHeight: 18,
    },
    footer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.ivory,
      borderTopWidth: 0.5,
      borderTopColor: colors.midGray,
      paddingHorizontal: 20,
      paddingTop: 14,
      paddingBottom: bottomPad + 16,
    },
    placeBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.gold,
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderRadius: 1,
    },
    placeBtnLeft: { gap: 2 },
    placeBtnAmount: {
      fontSize: 18,
      color: colors.ivory,
      fontFamily: "CormorantGaramond_600SemiBold",
    },
    placeBtnLabel: {
      fontSize: 11,
      color: colors.champagne,
      fontFamily: "DMSans_400Regular",
    },
    placeBtnText: {
      fontSize: 12,
      color: colors.ivory,
      fontFamily: "DMSans_500Medium",
      letterSpacing: 1.5,
    },
    trustRow: {
      flexDirection: "row",
      justifyContent: "space-around",
      padding: 16,
      borderTopWidth: 0.5,
      borderTopColor: colors.midGray,
    },
    trustItem: { alignItems: "center", gap: 4 },
    trustText: {
      fontSize: 9,
      color: colors.warmGray,
      fontFamily: "DMSans_400Regular",
      textAlign: "center",
      letterSpacing: 0.3,
    },
  });

  if (isLoading) {
    return (
      <View style={[styles.root, { alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={[styles.root, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="small" color={colors.gold} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          goBack(router);
        }} hitSlop={8}>
          <Feather name="arrow-left" size={16} color={colors.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>CHECKOUT</Text>
        <Feather name="shield" size={16} color={colors.gold} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Phone missing banner */}
        {Boolean(isAuthenticated && !user?.phone) && <PhoneMissingBanner />}

        {/* Delivery Address */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionLabel}>DELIVERY ADDRESS</Text>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/jewelery/addresses" as any,
                  params: { returnTo: "/jewelery/checkout" },
                })
              }
            >
              <Text style={styles.changeText}>
                {selectedAddress ? "Change" : "Add Address"}
              </Text>
            </TouchableOpacity>
          </View>

          {selectedAddress ? (
            <>
              <Text style={styles.addressName}>{selectedAddress.fullName}</Text>
              <Text style={styles.addressLine}>
                {selectedAddress.street}, {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
              </Text>
              <View style={styles.phoneRow}>
                <Text style={styles.phoneText}>{selectedAddress.phone}</Text>
                {selectedAddress.isPhoneVerified ? (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="shield-checkmark" size={10} color={colors.gold} />
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => setOtpSheetVisible(true)}
                    style={[styles.verifiedBadge, { backgroundColor: colors.pearl, borderWidth: 0.5, borderColor: colors.gold }]}
                  >
                    <Text style={[styles.verifiedText, { color: colors.gold }]}>Verify Now</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          ) : (
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/jewelery/addresses" as any,
                  params: { returnTo: "/jewelery/checkout" },
                })
              }
            >
              <Text style={styles.noAddress}>No address selected — tap to add one</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>YOUR PIECES</Text>
          {items.map((item) => (
            <View key={item.sku} style={styles.itemRow}>
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.itemImg} resizeMode="cover" />
              ) : (
                <View style={[styles.itemImg, { backgroundColor: colors.champagne }]} />
              )}
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle} numberOfLines={2}>
                  {item.productTitle || "Jewellery"}
                </Text>
                <Text style={styles.itemMeta}>Qty {item.quantity}</Text>
                <Text style={styles.itemPrice}>
                  {APP_CURRENCY}{((item.price || 0) * item.quantity).toLocaleString("en-IN")}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PAYMENT METHOD</Text>
          {(
            [
              { key: "ONLINE", label: "Pay Online", desc: "UPI, Cards, Netbanking & Wallets", icon: "credit-card" },
              { key: "COD", label: "Cash on Delivery", desc: "Pay in cash when your order arrives", icon: "dollar-sign" },
            ] as const
          ).map((opt) => {
            const isSelected = paymentMethod === opt.key;
            return (
              <Pressable
                key={opt.key}
                onPress={() => {
                  Haptics.selectionAsync();
                  setPaymentMethod(opt.key);
                }}
                style={[
                  styles.payOpt,
                  {
                    borderColor: isSelected ? colors.gold : colors.midGray,
                    backgroundColor: isSelected ? colors.champagne : "transparent",
                  },
                ]}
              >
                <Feather name={opt.icon as any} size={18} color={isSelected ? colors.gold : colors.warmGray} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.payOptLabel, { color: isSelected ? colors.ink : colors.warmGray }]}>
                    {opt.label}
                  </Text>
                  <Text style={styles.payOptDesc}>{opt.desc}</Text>
                </View>
                <Ionicons
                  name={isSelected ? "radio-button-on" : "radio-button-off"}
                  size={18}
                  color={isSelected ? colors.gold : colors.midGray}
                />
              </Pressable>
            );
          })}
        </View>

        {/* Bill Details */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>BILL DETAILS</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Subtotal</Text>
            <Text style={styles.summaryVal}>
              {APP_CURRENCY}{subtotal.toLocaleString("en-IN")}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Shipping</Text>
            <Text style={[styles.summaryVal, { color: displayShipping === 0 ? colors.gold : colors.ink }]}>
              {displayShipping === 0 ? "FREE" : `${APP_CURRENCY}${displayShipping.toLocaleString("en-IN")}`}
            </Text>
          </View>

          {dynamicDeliverySurcharge > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>Dynamic Surcharge</Text>
              <Text style={styles.summaryVal}>
                {APP_CURRENCY}{dynamicDeliverySurcharge.toLocaleString("en-IN")}
              </Text>
            </View>
          )}

          {isQuoteLoading && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <ActivityIndicator size="small" color={colors.gold} />
              <Text style={[styles.summaryKey, { fontStyle: "italic" }]}>Calculating delivery...</Text>
            </View>
          )}

          {quoteError ? (
            <View style={styles.quoteErrorBox}>
              <Text style={styles.quoteErrorTitle}>Cannot Deliver to This Address</Text>
              <Text style={styles.quoteErrorMsg}>{quoteError}</Text>
            </View>
          ) : null}

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalKey}>Total Payable</Text>
            <Text style={styles.totalVal}>
              {APP_CURRENCY}{totalPayable.toLocaleString("en-IN")}
            </Text>
          </View>

          <Text style={[styles.summaryKey, { fontStyle: "italic", marginTop: 6, fontSize: 10 }]}>
            EMI available from {APP_CURRENCY}{Math.round(totalPayable / 12).toLocaleString("en-IN")}/month
          </Text>
        </View>

        {/* Trust Signals */}
        <View style={styles.trustRow}>
          {[
            { icon: "shield", text: "Hallmark Certified" },
            { icon: "refresh-cw", text: `Free Returns ${JEWELERY_MODULE_CONFIG.returnPolicyDays}d` },
            { icon: "lock", text: "Secure Payment" },
          ].map((t) => (
            <View key={t.text} style={styles.trustItem}>
              <Feather name={t.icon as any} size={13} color={colors.gold} />
              <Text style={styles.trustText}>{t.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Footer CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.placeBtn,
            { opacity: isProcessingPayment || isQuoteLoading || Boolean(quoteError) ? 0.5 : 1 },
          ]}
          onPress={handlePlaceOrder}
          disabled={isProcessingPayment || isQuoteLoading || Boolean(quoteError)}
          activeOpacity={0.88}
        >
          <View style={styles.placeBtnLeft}>
            <Text style={styles.placeBtnAmount}>
              {APP_CURRENCY}{totalPayable.toLocaleString("en-IN")}
            </Text>
            <Text style={styles.placeBtnLabel}>inclusive of all taxes</Text>
          </View>
          {isProcessingPayment ? (
            <ActivityIndicator color={colors.ivory} size="small" />
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={styles.placeBtnText}>
                {paymentMethod === "COD" ? "PLACE ORDER" : "PAY & ORDER"}
              </Text>
              <Feather name="arrow-right" size={14} color={colors.ivory} />
            </View>
          )}
        </TouchableOpacity>
      </View>

      <IOSAlertDialog
        visible={alertConfig.visible}
        onClose={hideAlert}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
      />

      {selectedAddress && (
        <PhoneOtpSheet
          visible={otpSheetVisible}
          initialPhone={selectedAddress.phone || user?.phone || ""}
          onVerified={async (verifiedPhone) => {
            setOtpSheetVisible(false);
            try {
              await updateAddressRequest(selectedAddress._id, { ...selectedAddress, phone: verifiedPhone });
              await fetchAddresses();
            } catch (e) {
              console.error("Failed to update address after verification:", e);
              await fetchAddresses();
            }
          }}
          onClose={() => setOtpSheetVisible(false)}
        />
      )}
    </View>
  );
}
