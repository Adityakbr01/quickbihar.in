import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import RazorpayCheckout from "react-native-razorpay";
import Toast from "react-native-toast-message";
import { getAddressesRequest } from "../../address/api/address.api";
import { useCartStore } from "../../cart/store/cartStore";
import {
  createOrderRequest,
  quoteOrderRequest,
  verifyPaymentRequest,
} from "../api/order.api";
import type { OrderQuoteData } from "../api/order.api";
import { RAZORPAY_CONFIG } from "../config/razorpay.config";
import { createOrderStyles } from "../style/orderStyles";
import IOSAlertDialog, {
  AlertButton,
} from "@/src/components/ui/IOSAlertDialog";
import { useAuthStore } from "@/src/features/common/auth/store/authStore";

const CheckoutScreen = () => {
  const theme = useTheme();
  const styles = createOrderStyles(theme);
  const router = useRouter();

  const {
    items,
    subtotal,
    totalTax,
    discountAmount,
    appliedCoupon,
    appliedCoupons = [],
    clearCart,
    shippingRules,
    fetchShippingConfig,
  } = useCartStore();
  const { user } = useAuthStore();

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

  // Alert Configuration
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

  const showAlert = (
    title: string,
    message: string,
    buttons: AlertButton[],
  ) => {
    setAlertConfig({ visible: true, title, message, buttons });
  };

  const hideAlert = () => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  };

  // Constants using dynamic rules
  const shipping = subtotal >= shippingRules.threshold ? 0 : shippingRules.fee;
  const totalPayable = quote?.payableAmount ?? (subtotal + shipping - discountAmount);
  const displayShipping = quote?.shippingFee ?? shipping;
  const dynamicDeliverySurcharge = quote?.dynamicDeliverySurcharge ?? 0;
  const activeBonusLabels = quote?.sellerBreakdowns
    ?.flatMap((breakdown) => {
      const labels: string[] = [];
      if (breakdown.bonusFlags?.rain && breakdown.riderBonuses?.rain > 0) labels.push(`Rain Rs. ${breakdown.riderBonuses.rain}`);
      if (breakdown.bonusFlags?.peak && breakdown.riderBonuses?.peak > 0) labels.push(`Peak Rs. ${breakdown.riderBonuses.peak}`);
      if (breakdown.bonusFlags?.festival && breakdown.riderBonuses?.festival > 0) labels.push(`Festival Rs. ${breakdown.riderBonuses.festival}`);
      if (breakdown.bonusFlags?.night && breakdown.riderBonuses?.night > 0) labels.push(`Night Rs. ${breakdown.riderBonuses.night}`);
      return labels;
    }) || [];

  const hasAddressGps = (address: any) => {
    const latitude = Number(address?.latitude);
    const longitude = Number(address?.longitude);
    return Number.isFinite(latitude)
      && Number.isFinite(longitude)
      && !(latitude === 0 && longitude === 0);
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const buildOrderData = () => ({
    items: items.map((item) => ({
      productId:
        typeof item.productId === "object"
          ? (item.productId as any)._id
          : item.productId,
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
    couponCode: appliedCoupon?.code,
    couponCodes: (appliedCoupons || []).map((c) => c.code),
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
          setQuoteError(error.response?.data?.message || error.message || "Unable to fetch delivery quote");
        }
      } finally {
        if (!cancelled) setIsQuoteLoading(false);
      }
    };

    fetchQuote();
    return () => {
      cancelled = true;
    };
  }, [selectedAddress, items, appliedCoupon?.code, appliedCoupons]);

  const fetchAddresses = async () => {
    try {
      setIsLoading(true);
      const response = await getAddressesRequest();
      const addrList = response.data || [];
      setAddresses(addrList);

      // Set default address or first address
      const defaultAddr = addrList.find((a: any) => a.isDefault) || addrList[0];
      setSelectedAddress(defaultAddr);
    } catch (error) {
      console.error("Failed to fetch addresses:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load addresses",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      Toast.show({
        type: "error",
        text1: "Required",
        text2: "Please select a delivery address",
      });
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
                pathname: "/account/address-form",
                params: { id: selectedAddress._id, data: JSON.stringify(selectedAddress) },
              }),
          },
        ],
      );
      return;
    }

    try {
      setIsProcessingPayment(true);

      const orderData = buildOrderData();
      const quoteResponse = await quoteOrderRequest(orderData);
      setQuote(quoteResponse.data);

      // 1. Create Order on Backend
      const orderResponse = await createOrderRequest(orderData);
      const { razorpayOrder, order } = orderResponse.data;

      // 2. Open Razorpay Checkout
      const options = {
        description: "Payment for Order " + order.orderId,
        image: "https://your-logo-url.png", // Optional: replace with app logo
        currency: razorpayOrder.currency,
        key: RAZORPAY_CONFIG.KEY_ID,
        amount: razorpayOrder.amount,
        name: "Quick Bihar",
        order_id: razorpayOrder.id,
        prefill: {
          email: user?.email || "",
          contact: selectedAddress.phone || "",
          name: user?.fullName || "",
        },
        theme: { color: theme.primary },
      };

      RazorpayCheckout.open(options)
        .then(async (data: any) => {
          // 3. Verify Payment
          try {
            const verificationData = {
              razorpayOrderId: data.razorpay_order_id,
              razorpayPaymentId: data.razorpay_payment_id,
              razorpaySignature: data.razorpay_signature,
            };

            await verifyPaymentRequest(verificationData);

            // 4. Success!
            clearCart();
            router.replace({
              pathname: "/order-success",
              params: { orderId: order.orderId },
            });
          } catch (verifyError: any) {
            showAlert(
              "Payment Verification Failed",
              verifyError.message ||
                "Please contact support if amount was deducted. We are checking the payment status.",
              [{ text: "OK", style: "default" }],
            );
          }
        })
        .catch((error: any) => {
          showAlert(
            "Payment Cancelled",
            error.description ||
              "The payment process was interrupted. No money was deducted.",
            [{ text: "Dismiss", style: "cancel" }],
          );
        });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to initiate order",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Delivery Address */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <TouchableOpacity onPress={() => router.push("/account/addresses")}>
              <Text style={styles.changeButtonText}>
                {selectedAddress ? "Change" : "Add Address"}
              </Text>
            </TouchableOpacity>
          </View>

          {selectedAddress ? (
            <View style={styles.addressContent}>
              <View style={styles.iconWrapper}>
                <MaterialCommunityIcons
                  name="map-marker-outline"
                  size={24}
                  color={theme.primary}
                />
              </View>
              <View style={styles.addressDetails}>
                <Text style={styles.addressName}>
                  {selectedAddress.fullName}
                </Text>
                <Text style={styles.addressText}>
                  {selectedAddress.street}, {selectedAddress.city},{" "}
                  {selectedAddress.state} - {selectedAddress.pincode}
                </Text>
                <Text style={styles.addressPhone}>{selectedAddress.phone}</Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={{ alignItems: "center", paddingVertical: 10 }}
              onPress={() => router.push("/account/addresses")}
            >
              <Text style={{ color: theme.secondaryText }}>
                No address selected
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { marginBottom: 20 }]}>
            Order Summary
          </Text>
          {(() => {
            const groupedItems = items.reduce((acc, item) => {
              const sellerId = item.sellerId || "unknown";
              if (!acc[sellerId]) acc[sellerId] = [];
              acc[sellerId].push(item);
              return acc;
            }, {} as Record<string, typeof items>);

            return Object.entries(groupedItems).map(([sellerId, sellerItems]) => {
              const sellerSubtotal = sellerItems.reduce(
                (sum, item) => sum + (item.price || 0) * item.quantity,
                0
              );

              const sellerCoupon = (appliedCoupons || []).find(
                (c) => (c.sellerId || "global") === sellerId
              );
              const couponDiscount = sellerCoupon?.appliedDiscount || 0;
              const finalSellerSubtotal = Math.max(0, sellerSubtotal - couponDiscount);
              const sellerDisplayName = sellerId !== "unknown"
                ? `Store: #${sellerId.substring(sellerId.length - 6).toUpperCase()}`
                : "Seller Section";

              return (
                <View key={sellerId} style={{ marginBottom: 20, borderBottomWidth: 1, borderBottomColor: theme.border, paddingBottom: 16 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: theme.text, marginBottom: 12 }}>
                    {sellerDisplayName}
                  </Text>
                  
                  {sellerItems.map((item) => (
                    <View key={item.sku} style={styles.itemRow}>
                      <Image source={{ uri: item.image }} style={styles.itemImage} />
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemTitle} numberOfLines={1}>
                          {item.productTitle}
                        </Text>
                        <Text style={styles.itemVariant}>
                          {item.selectedSize} / {item.selectedColor} • Qty{" "}
                          {item.quantity}
                        </Text>
                      </View>
                      <Text style={styles.itemPrice}>
                        ₹{((item.price || 0) * item.quantity).toLocaleString()}
                      </Text>
                    </View>
                  ))}

                  <View style={{ marginTop: 12, gap: 6, paddingLeft: 8 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ fontSize: 13, color: theme.secondaryText }}>Subtotal</Text>
                      <Text style={{ fontSize: 13, fontWeight: "600", color: theme.text }}>
                        ₹{sellerSubtotal.toLocaleString()}
                      </Text>
                    </View>
                    {couponDiscount > 0 && (
                      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <Text style={{ fontSize: 13, color: theme.primary }}>
                          Coupon ({sellerCoupon?.code})
                        </Text>
                        <Text style={{ fontSize: 13, fontWeight: "600", color: theme.primary }}>
                          -₹{couponDiscount.toLocaleString()}
                        </Text>
                      </View>
                    )}
                    <View style={{ flexDirection: "row", justifyContent: "space-between", borderTopWidth: 0.5, borderTopColor: theme.border, paddingTop: 6 }}>
                      <Text style={{ fontSize: 13, fontWeight: "700", color: theme.text }}>Net Seller Total</Text>
                      <Text style={{ fontSize: 13, fontWeight: "700", color: theme.primary }}>
                        ₹{finalSellerSubtotal.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            });
          })()}
        </View>

        {/* Bill Details */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>
            Bill Details
          </Text>

          {/* Calculate MRP Total for transparency */}
          {(() => {
            const totalMRP = items.reduce(
              (acc, item) =>
                acc + (item.originalPrice || item.price || 0) * item.quantity,
              0,
            );
            const productDiscount = totalMRP - subtotal;

            return (
              <>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Item Total (MRP)</Text>
                  <Text style={styles.summaryValue}>
                    ₹{totalMRP.toLocaleString()}
                  </Text>
                </View>

                {productDiscount > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Product Discount</Text>
                    <Text style={[styles.summaryValue, styles.discountText]}>
                      -₹{productDiscount.toLocaleString()}
                    </Text>
                  </View>
                )}
              </>
            );
          })()}

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal (Excl. Tax)</Text>
            <Text style={styles.summaryValue}>
              ₹{(subtotal - totalTax).toLocaleString()}
            </Text>
          </View>

          {totalTax > 0 && (
            <View style={styles.summaryRow}>
              <Text
                style={[styles.summaryLabel, { color: theme.secondaryText }]}
              >
                GST / Fixed Taxes (Incl.)
              </Text>
              <Text
                style={[styles.summaryValue, { color: theme.secondaryText }]}
              >
                ₹{totalTax.toLocaleString()}
              </Text>
            </View>
          )}

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping Fee</Text>
            <Text style={styles.summaryValue}>
              {displayShipping === 0 ? "FREE" : `Rs. ${displayShipping.toLocaleString()}`}
            </Text>
          </View>

          {dynamicDeliverySurcharge > 0 && (
            <>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Dynamic Delivery Surcharge</Text>
                <Text style={styles.summaryValue}>
                  Rs. {dynamicDeliverySurcharge.toLocaleString()}
                </Text>
              </View>
              {activeBonusLabels.length > 0 && (
                <Text style={{ marginTop: -8, marginBottom: 12, color: theme.secondaryText, fontSize: 12 }}>
                  {Array.from(new Set(activeBonusLabels)).join(" | ")}
                </Text>
              )}
            </>
          )}

          {isQuoteLoading && (
            <Text style={{ marginBottom: 12, color: theme.secondaryText, fontSize: 12 }}>
              Updating delivery quote...
            </Text>
          )}
          {quoteError ? (
            <Text style={{ marginBottom: 12, color: "#dc2626", fontSize: 12 }}>
              {quoteError}
            </Text>
          ) : null}

          {appliedCoupons.map((coupon) => (
            <View key={coupon.code} style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Coupon ({coupon.code})
              </Text>
              <Text style={[styles.summaryValue, styles.discountText]}>
                -₹{(coupon.appliedDiscount || 0).toLocaleString()}
              </Text>
            </View>
          ))}
          
          {appliedCoupons.length === 0 && discountAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Coupon ({appliedCoupon?.code || ""})
              </Text>
              <Text style={[styles.summaryValue, styles.discountText]}>
                -₹{discountAmount.toLocaleString()}
              </Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Payable</Text>
            <Text style={styles.totalValue}>
              ₹{totalPayable.toLocaleString()}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.payButton, { opacity: isProcessingPayment || isQuoteLoading ? 0.7 : 1 }]}
          onPress={handlePlaceOrder}
          disabled={isProcessingPayment || isQuoteLoading}
        >
          {isProcessingPayment ? (
            <View style={styles.payButtonContent}>
              <ActivityIndicator color="#fff" />
            </View>
          ) : (
            <View style={styles.payButtonContent}>
              <Text style={styles.payButtonAmount}>
                ₹{totalPayable.toLocaleString()}
              </Text>
              <View style={styles.payButtonDivider} />
              <Text style={styles.payButtonText}>Place Order</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Custom Alert Dialog */}
      <IOSAlertDialog
        visible={alertConfig.visible}
        onClose={hideAlert}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
      />
    </View>
  );
};

export default CheckoutScreen;
