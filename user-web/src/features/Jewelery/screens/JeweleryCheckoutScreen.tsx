import { ArrowLeft, ArrowRight, Circle, CircleDot, CreditCard, DollarSign, Lock, RefreshCw, Shield, ShieldCheck } from "lucide-react";
import * as Haptics from "@/lib/haptics";
import { useNavigate } from "react-router-dom";
import React, { useEffect, useMemo, useState } from "react";
import { cn } from "@/src/lib/utils";
import { BREAKPOINTS, useWindowWidth } from "@/src/utils/responsive";

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
import { goBack, goTo, replaceTo } from "@/src/utils/navigation";

function Spinner({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <span
      className="inline-block animate-spin rounded-full border-2"
      style={{
        width: size,
        height: size,
        borderColor: color,
        borderTopColor: "transparent",
      }}
      role="status"
      aria-label="Loading"
    />
  );
}

export default function JeweleryCheckoutScreen() {
  const colors = useColors();
  const navigate = useNavigate();
  const topPad = useTopPad();
  const bottomPad = 34;
  const width = useWindowWidth();
  const isDesktop = width >= BREAKPOINTS.desktopMin;
  // Viewport-fixed footer CTA: clears the 60px tab bar + 12px breathing
  // room on mobile; small offset on desktop where there is no tab bar.
  const stickyBottom = isDesktop ? 12 : 60 + 12;

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

  useEffect(() => {
    if (!isAuthenticated) {
      replaceTo(navigate, "/auth" as any);
      return;
    }
    fetchAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

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
              goTo(navigate, {
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
        replaceTo(navigate, { pathname: "/jewelery/order-success" as any, params: { orderId: order.orderId } });
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
            replaceTo(navigate, { pathname: "/jewelery/order-success" as any, params: { orderId: order.orderId } });
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

  if (isLoading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: colors.ivory }}
      >
        <Spinner color={colors.gold} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: colors.ivory }}
      >
        <Spinner color={colors.gold} size={16} />
      </div>
    );
  }

  const ctaDisabled = isProcessingPayment || isQuoteLoading || Boolean(quoteError);

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: colors.ivory }}
    >
      {/* Header */}
      <div
        className="flex flex-row items-center gap-3 border-b px-5 pb-3.5"
        style={{
          paddingTop: topPad + 8,
          borderBottomColor: colors.midGray,
          borderBottomWidth: 1,
          backgroundColor: colors.ivory,
        }}
      >
        <button
          type="button"
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border"
          style={{ borderColor: colors.midGray }}
          onClick={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            goBack(navigate);
          }}
          aria-label="Go back"
        >
          <ArrowLeft size={16} color={colors.ink} />
        </button>
        <h1
          className="flex-1 text-[20px] tracking-[2px]"
          style={{
            color: colors.ink,
            fontFamily: "CormorantGaramond_600SemiBold",
          }}
        >
          CHECKOUT
        </h1>
        <Shield size={16} color={colors.gold} />
      </div>

      <div className="overflow-y-auto" style={{ paddingBottom: 160 }}>
        {/* Phone missing banner */}
        {Boolean(isAuthenticated && !user?.phone) && <PhoneMissingBanner />}

        {/* Delivery Address */}
        <div
          className="mx-4 mt-4 rounded-[2px] border p-4"
          style={{
            backgroundColor: colors.pearl,
            borderColor: colors.midGray,
            borderWidth: 1,
          }}
        >
          <div className="mb-3 flex flex-row items-center justify-between">
            <span
              className="text-[9px] tracking-[2px]"
              style={{ color: colors.gold, fontFamily: "DMSans_500Medium" }}
            >
              DELIVERY ADDRESS
            </span>
            <button
              type="button"
              className="cursor-pointer"
              onClick={() =>
                goTo(navigate, {
                  pathname: "/jewelery/addresses" as any,
                  params: { returnTo: "/jewelery/checkout" },
                })
              }
            >
              <span
                className="text-xs"
                style={{ color: colors.gold, fontFamily: "DMSans_400Regular" }}
              >
                {selectedAddress ? "Change" : "Add Address"}
              </span>
            </button>
          </div>

          {selectedAddress ? (
            <>
              <span
                className="block text-[15px]"
                style={{ color: colors.ink, fontFamily: "DMSans_500Medium" }}
              >
                {selectedAddress.fullName}
              </span>
              <span
                className="mt-0.5 block text-[13px] leading-[18px]"
                style={{ color: colors.warmGray, fontFamily: "DMSans_400Regular" }}
              >
                {selectedAddress.street}, {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
              </span>
              <div className="mt-1.5 flex flex-row items-center gap-1.5">
                <span
                  className="text-xs"
                  style={{ color: colors.warmGray, fontFamily: "DMSans_400Regular" }}
                >
                  {selectedAddress.phone}
                </span>
                {selectedAddress.isPhoneVerified ? (
                  <span
                    className="flex flex-row items-center gap-1 rounded-[10px] px-2 py-[3px]"
                    style={{ backgroundColor: colors.champagne }}
                  >
                    <ShieldCheck size={10} color={colors.gold} />
                    <span
                      className="text-[10px]"
                      style={{ color: colors.gold, fontFamily: "DMSans_500Medium" }}
                    >
                      Verified
                    </span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setOtpSheetVisible(true)}
                    className="flex cursor-pointer flex-row items-center gap-1 rounded-[10px] border px-2 py-[3px]"
                    style={{ backgroundColor: colors.pearl, borderColor: colors.gold, borderWidth: 1 }}
                  >
                    <span
                      className="text-[10px]"
                      style={{ color: colors.gold, fontFamily: "DMSans_500Medium" }}
                    >
                      Verify Now
                    </span>
                  </button>
                )}
              </div>
            </>
          ) : (
            <button
              type="button"
              className="w-full cursor-pointer"
              onClick={() =>
                goTo(navigate, {
                  pathname: "/jewelery/addresses" as any,
                  params: { returnTo: "/jewelery/checkout" },
                })
              }
            >
              <span
                className="block py-2 text-center text-[13px] italic"
                style={{ color: colors.warmGray, fontFamily: "DMSans_400Regular" }}
              >
                No address selected — tap to add one
              </span>
            </button>
          )}
        </div>

        {/* Order Items */}
        <div
          className="mx-4 mt-4 rounded-[2px] border p-4"
          style={{
            backgroundColor: colors.pearl,
            borderColor: colors.midGray,
            borderWidth: 1,
          }}
        >
          <span
            className="mb-3 block text-[9px] tracking-[2px]"
            style={{ color: colors.gold, fontFamily: "DMSans_500Medium" }}
          >
            YOUR PIECES
          </span>
          {items.map((item) => (
            <div
              key={item.sku}
              className="mb-3 flex flex-row gap-3 border-b pb-3"
              style={{ borderBottomColor: colors.midGray, borderBottomWidth: 1 }}
            >
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.productTitle || "Jewellery"}
                  className="h-20 w-[60px] rounded-[2px] object-cover"
                />
              ) : (
                <div
                  className="h-20 w-[60px] rounded-[2px]"
                  style={{ backgroundColor: colors.champagne }}
                />
              )}
              <div className="flex flex-1 flex-col gap-[3px]">
                <span
                  className="line-clamp-2 block text-sm"
                  style={{
                    color: colors.ink,
                    fontFamily: "CormorantGaramond_500Medium_Italic",
                  }}
                >
                  {item.productTitle || "Jewellery"}
                </span>
                <span
                  className="block text-[11px]"
                  style={{ color: colors.warmGray, fontFamily: "DMSans_400Regular" }}
                >
                  Qty {item.quantity}
                </span>
                <span
                  className="block text-[13px]"
                  style={{ color: colors.ink, fontFamily: "DMSans_500Medium" }}
                >
                  {APP_CURRENCY}{((item.price || 0) * item.quantity).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Payment Method */}
        <div
          className="mx-4 mt-4 rounded-[2px] border p-4"
          style={{
            backgroundColor: colors.pearl,
            borderColor: colors.midGray,
            borderWidth: 1,
          }}
        >
          <span
            className="mb-3 block text-[9px] tracking-[2px]"
            style={{ color: colors.gold, fontFamily: "DMSans_500Medium" }}
          >
            PAYMENT METHOD
          </span>
          {(
            [
              { key: "ONLINE", label: "Pay Online", desc: "UPI, Cards, Netbanking & Wallets", icon: CreditCard },
              { key: "COD", label: "Cash on Delivery", desc: "Pay in cash when your order arrives", icon: DollarSign },
            ] as const
          ).map((opt) => {
            const isSelected = paymentMethod === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => {
                  Haptics.selectionAsync();
                  setPaymentMethod(opt.key);
                }}
                className="mb-2 flex w-full cursor-pointer flex-row items-center gap-3 rounded-[2px] border p-3.5 text-left"
                style={{
                  borderColor: isSelected ? colors.gold : colors.midGray,
                  borderWidth: 1,
                  backgroundColor: isSelected ? colors.champagne : "transparent",
                }}
              >
                <opt.icon size={18} color={isSelected ? colors.gold : colors.warmGray} />
                <div className="flex-1">
                  <span
                    className="block text-sm"
                    style={{
                      color: isSelected ? colors.ink : colors.warmGray,
                      fontFamily: "DMSans_500Medium",
                    }}
                  >
                    {opt.label}
                  </span>
                  <span
                    className="block text-[11px]"
                    style={{ fontFamily: "DMSans_400Regular", color: colors.warmGray }}
                  >
                    {opt.desc}
                  </span>
                </div>
                {isSelected ? (
                  <CircleDot size={18} color={colors.gold} />
                ) : (
                  <Circle size={18} color={colors.midGray} />
                )}
              </button>
            );
          })}
        </div>

        {/* Bill Details */}
        <div
          className="mx-4 mt-4 rounded-[2px] border p-4"
          style={{
            backgroundColor: colors.pearl,
            borderColor: colors.midGray,
            borderWidth: 1,
          }}
        >
          <span
            className="mb-3 block text-[9px] tracking-[2px]"
            style={{ color: colors.gold, fontFamily: "DMSans_500Medium" }}
          >
            BILL DETAILS
          </span>

          <div className="mb-2 flex flex-row justify-between">
            <span
              className="text-[13px]"
              style={{ color: colors.warmGray, fontFamily: "DMSans_400Regular" }}
            >
              Subtotal
            </span>
            <span
              className="text-[13px]"
              style={{ color: colors.ink, fontFamily: "DMSans_500Medium" }}
            >
              {APP_CURRENCY}{subtotal.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="mb-2 flex flex-row justify-between">
            <span
              className="text-[13px]"
              style={{ color: colors.warmGray, fontFamily: "DMSans_400Regular" }}
            >
              Shipping
            </span>
            <span
              className="text-[13px]"
              style={{
                color: displayShipping === 0 ? colors.gold : colors.ink,
                fontFamily: "DMSans_500Medium",
              }}
            >
              {displayShipping === 0 ? "FREE" : `${APP_CURRENCY}${displayShipping.toLocaleString("en-IN")}`}
            </span>
          </div>

          {dynamicDeliverySurcharge > 0 && (
            <div className="mb-2 flex flex-row justify-between">
              <span
                className="text-[13px]"
                style={{ color: colors.warmGray, fontFamily: "DMSans_400Regular" }}
              >
                Dynamic Surcharge
              </span>
              <span
                className="text-[13px]"
                style={{ color: colors.ink, fontFamily: "DMSans_500Medium" }}
              >
                {APP_CURRENCY}{dynamicDeliverySurcharge.toLocaleString("en-IN")}
              </span>
            </div>
          )}

          {isQuoteLoading && (
            <div className="mb-2 flex flex-row items-center gap-1.5">
              <Spinner color={colors.gold} size={14} />
              <span
                className="text-[13px] italic"
                style={{ color: colors.warmGray, fontFamily: "DMSans_400Regular" }}
              >
                Calculating delivery...
              </span>
            </div>
          )}

          {quoteError ? (
            <div
              className="m-4 flex flex-col gap-1.5 rounded-[2px] border p-3.5"
              style={{
                borderColor: colors.maroon,
                borderWidth: 1,
                backgroundColor: colors.champagne,
              }}
            >
              <span
                className="block text-[13px]"
                style={{ color: colors.maroon, fontFamily: "DMSans_500Medium" }}
              >
                Cannot Deliver to This Address
              </span>
              <span
                className="block text-xs leading-[18px]"
                style={{ color: colors.maroon, fontFamily: "DMSans_400Regular" }}
              >
                {quoteError}
              </span>
            </div>
          ) : null}

          <div
            className="my-2 h-px"
            style={{ backgroundColor: colors.midGray }}
          />

          <div className="mt-1 flex flex-row justify-between">
            <span
              className="text-base"
              style={{ color: colors.ink, fontFamily: "DMSans_500Medium" }}
            >
              Total Payable
            </span>
            <span
              className="text-[22px]"
              style={{ color: colors.ink, fontFamily: "CormorantGaramond_600SemiBold" }}
            >
              {APP_CURRENCY}{totalPayable.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Trust Signals */}
        <div
          className="flex flex-row justify-around border-t p-4"
          style={{ borderTopColor: colors.midGray, borderTopWidth: 1 }}
        >
          {[
            { icon: Shield, text: "Hallmark Certified" },
            { icon: RefreshCw, text: `Free Returns ${JEWELERY_MODULE_CONFIG.returnPolicyDays}d` },
            { icon: Lock, text: "Secure Payment" },
          ].map((t) => (
            <div key={t.text} className="flex flex-col items-center gap-1">
              <t.icon size={13} color={colors.gold} />
              <span
                className="text-center text-[9px] tracking-[0.3px]"
                style={{ color: colors.warmGray, fontFamily: "DMSans_400Regular" }}
              >
                {t.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer CTA */}
      <div
        className="fixed inset-x-0 z-40 px-5 pt-3.5"
        style={{
          bottom: stickyBottom,
          backgroundColor: colors.ivory,
          borderTopColor: colors.midGray,
          borderTopWidth: 1,
          paddingBottom: bottomPad + 16,
        }}
      >
        <button
          type="button"
          className={cn(
            "flex w-full cursor-pointer flex-row items-center justify-between rounded-[1px] px-5 py-4",
            ctaDisabled && "opacity-50",
          )}
          style={{ backgroundColor: colors.gold }}
          onClick={handlePlaceOrder}
          disabled={ctaDisabled}
        >
          <div className="flex flex-col gap-0.5 text-left">
            <span
              className="block text-[18px]"
              style={{ color: colors.onBrand, fontFamily: "CormorantGaramond_600SemiBold" }}
            >
              {APP_CURRENCY}{totalPayable.toLocaleString("en-IN")}
            </span>
            <span
              className="block text-[11px]"
              style={{ color: colors.champagne, fontFamily: "DMSans_400Regular" }}
            >
              inclusive of all taxes
            </span>
          </div>
          {isProcessingPayment ? (
            <Spinner color={colors.onBrand} size={16} />
          ) : (
            <div className="flex flex-row items-center gap-2">
              <span
                className="text-xs tracking-[1.5px]"
                style={{ color: colors.onBrand, fontFamily: "DMSans_500Medium" }}
              >
                {paymentMethod === "COD" ? "PLACE ORDER" : "PAY & ORDER"}
              </span>
              <ArrowRight size={14} color={colors.onBrand} />
            </div>
          )}
        </button>
      </div>

      <IOSAlertDialog visible={alertConfig.visible}
        onClose={hideAlert}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
      />

      {selectedAddress && (
        <PhoneOtpSheet visible={otpSheetVisible}
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
    </div>
  );
}
