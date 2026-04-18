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
  View
} from "react-native";
import RazorpayCheckout from "react-native-razorpay";
import Toast from "react-native-toast-message";
import { getAddressesRequest } from "../../address/api/address.api";
import { useAuthStore } from "../../auth/store/authStore";
import { useCartStore } from "../../cart/store/cartStore";
import { createOrderRequest, verifyPaymentRequest } from "../api/order.api";
import { RAZORPAY_CONFIG } from "../config/razorpay.config";
import { createOrderStyles } from "../style/orderStyles";
import IOSAlertDialog, { AlertButton } from "@/src/components/ui/IOSAlertDialog";

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
    clearCart,
    shippingRules,
    fetchShippingConfig
  } = useCartStore();
  const { user } = useAuthStore();
 
  useEffect(() => {
    fetchShippingConfig();
  }, []);

  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
 
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
 
  const showAlert = (title: string, message: string, buttons: AlertButton[]) => {
    setAlertConfig({ visible: true, title, message, buttons });
  };
 
  const hideAlert = () => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
  };
 
  // Constants using dynamic rules
  const shipping = subtotal >= shippingRules.threshold ? 0 : shippingRules.fee;
  const totalPayable = subtotal + shipping - discountAmount;

  useEffect(() => {
    fetchAddresses();
  }, []);

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

    try {
      setIsProcessingPayment(true);

      // 1. Create Order on Backend
      const orderData = {
        items: items.map(item => ({
          productId: typeof item.productId === 'object' ? (item.productId as any)._id : item.productId,
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
        },
        couponCode: appliedCoupon?.code,
      };

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
              params: { orderId: order.orderId }
            });
          } catch (verifyError: any) {
            showAlert(
              "Payment Verification Failed",
              verifyError.message || "Please contact support if amount was deducted. We are checking the payment status.",
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
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Delivery Address */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <TouchableOpacity onPress={() => router.push("/account/addresses")}>
              <Text style={styles.changeButtonText}>{selectedAddress ? "Change" : "Add Address"}</Text>
            </TouchableOpacity>
          </View>

          {selectedAddress ? (
            <View style={styles.addressContent}>
              <View style={styles.iconWrapper}>
                <MaterialCommunityIcons name="map-marker-outline" size={24} color={theme.primary} />
              </View>
              <View style={styles.addressDetails}>
                <Text style={styles.addressName}>{selectedAddress.fullName}</Text>
                <Text style={styles.addressText}>
                  {selectedAddress.street}, {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
                </Text>
                <Text style={styles.addressPhone}>{selectedAddress.phone}</Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={{ alignItems: "center", paddingVertical: 10 }}
              onPress={() => router.push("/account/addresses")}
            >
              <Text style={{ color: theme.secondaryText }}>No address selected</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { marginBottom: 20 }]}>Order Summary</Text>
          {items.map((item) => (
            <View key={item.sku} style={styles.itemRow}>
              <Image source={{ uri: item.image }} style={styles.itemImage} />
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle} numberOfLines={1}>{item.productTitle}</Text>
                <Text style={styles.itemVariant}>
                  {item.selectedSize} / {item.selectedColor} • Qty {item.quantity}
                </Text>
              </View>
              <Text style={styles.itemPrice}>₹{((item.price || 0) * item.quantity).toLocaleString()}</Text>
            </View>
          ))}
        </View>

        {/* Bill Details */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>Bill Details</Text>

          {/* Calculate MRP Total for transparency */}
          {(() => {
            const totalMRP = items.reduce((acc, item) => acc + (item.originalPrice || item.price || 0) * item.quantity, 0);
            const productDiscount = totalMRP - subtotal;
            
            return (
              <>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Item Total (MRP)</Text>
                  <Text style={styles.summaryValue}>₹{totalMRP.toLocaleString()}</Text>
                </View>

                {productDiscount > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Product Discount</Text>
                    <Text style={[styles.summaryValue, styles.discountText]}>-₹{productDiscount.toLocaleString()}</Text>
                  </View>
                )}
              </>
            );
          })()}

          <View style={styles.divider} />
 
           <View style={styles.summaryRow}>
             <Text style={styles.summaryLabel}>Subtotal (Excl. Tax)</Text>
             <Text style={styles.summaryValue}>₹{(subtotal - totalTax).toLocaleString()}</Text>
           </View>
 
          {totalTax > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.secondaryText }]}>
                GST / Fixed Taxes (Incl.)
              </Text>
              <Text style={[styles.summaryValue, { color: theme.secondaryText }]}>
                ₹{totalTax.toLocaleString()}
              </Text>
            </View>
          )}
 
           <View style={styles.summaryRow}>
             <Text style={styles.summaryLabel}>Shipping Fee</Text>
             <Text style={styles.summaryValue}>{shipping === 0 ? "FREE" : `₹${shipping}`}</Text>
           </View>

          {discountAmount > 0 ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Coupon ({appliedCoupon?.code || ""})</Text>
              <Text style={[styles.summaryValue, styles.discountText]}>-₹{discountAmount.toLocaleString()}</Text>
            </View>
          ) : null}

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Payable</Text>
            <Text style={styles.totalValue}>₹{totalPayable.toLocaleString()}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.payButton, { opacity: isProcessingPayment ? 0.7 : 1 }]}
          onPress={handlePlaceOrder}
          disabled={isProcessingPayment}
        >
          {isProcessingPayment ? (
            <View style={styles.payButtonContent}>
              <ActivityIndicator color="#fff" />
            </View>
          ) : (
            <View style={styles.payButtonContent}>
              <Text style={styles.payButtonAmount}>₹{totalPayable.toLocaleString()}</Text>
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
