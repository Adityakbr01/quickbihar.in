import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import {
  ArrowLeft,
  Banknote,
  Circle,
  CircleAlert,
  CircleDot,
  CreditCard,
  Info,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import React, { useEffect, useMemo, useState } from "react";
import {
  getAddressesRequest,
  updateAddressRequest,
} from "../../address/api/address.api";
import PhoneOtpSheet from "../../address/components/PhoneOtpSheet";
import { useCartStore } from "../../cart/store/cartStore";
import {
  createOrderRequest,
  quoteOrderRequest,
  verifyPaymentRequest,
} from "../api/order.api";
import type { OrderQuoteData } from "../api/order.api";
import { RAZORPAY_CONFIG } from "../config/razorpay.config";
import { openRazorpayCheckout } from "../lib/openRazorpayCheckout";
import IOSAlertDialog, {
  AlertButton,
} from "@/src/components/ui/IOSAlertDialog";
import * as Haptics from "@/lib/haptics";
import { goBack, goTo, replaceTo } from "@/src/utils/navigation";
import { useAuthStore } from "@/src/features/common/auth/store/authStore";
import { PhoneMissingBanner } from "../components/PhoneMissingBanner";
import { cn } from "@/src/lib/utils";
import { BOTTOM_TAB_BAR_HEIGHT } from "@/src/utils/responsive";
import { useSafeAreaInsets } from "@/src/hooks/useSafeAreaInsets";

const CheckoutScreen = () => {
  const theme = useTheme() as any;
  const navigate = useNavigate();
  const insets = useSafeAreaInsets();
  const footerBottom = BOTTOM_TAB_BAR_HEIGHT + 12 + (insets?.bottom ?? 0);

  const {
    items: allItems,
    discountAmount,
    appliedCoupon,
    appliedCoupons = [],
    clearCart,
    shippingRules,
    fetchShippingConfig,
  } = useCartStore();

  // Clothing checkout operates on clothing lines only — jewelery lines
  // stay in the jewelery bag for the jewelery checkout.
  const items = useMemo(
    () => allItems.filter((i) => (i.module ?? "clothing") === "clothing"),
    [allItems],
  );
  const { subtotal, totalTax } = useMemo(
    () => ({
      subtotal: items.reduce((acc, i) => acc + (i.price || 0) * i.quantity, 0),
      totalTax: items.reduce(
        (acc, i) => acc + (i.taxAmount || 0) * i.quantity,
        0,
      ),
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
  const [paymentMethod, setPaymentMethod] = useState<"ONLINE" | "COD">(
    "ONLINE",
  );
  const [otpSheetVisible, setOtpSheetVisible] = useState(false);

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
  const totalPayable =
    quote?.payableAmount ?? subtotal + shipping - discountAmount;
  const displayShipping = quote?.shippingFee ?? shipping;
  const dynamicDeliverySurcharge = quote?.dynamicDeliverySurcharge ?? 0;
  const activeBonusLabels =
    quote?.sellerBreakdowns?.flatMap((breakdown) => {
      const labels: string[] = [];
      if (breakdown.bonusFlags?.rain && breakdown.riderBonuses?.rain > 0)
        labels.push(`Rain Rs. ${breakdown.riderBonuses.rain}`);
      if (breakdown.bonusFlags?.peak && breakdown.riderBonuses?.peak > 0)
        labels.push(`Peak Rs. ${breakdown.riderBonuses.peak}`);
      if (
        breakdown.bonusFlags?.festival &&
        breakdown.riderBonuses?.festival > 0
      )
        labels.push(`Festival Rs. ${breakdown.riderBonuses.festival}`);
      if (breakdown.bonusFlags?.night && breakdown.riderBonuses?.night > 0)
        labels.push(`Night Rs. ${breakdown.riderBonuses.night}`);
      return labels;
    }) || [];

  const hasAddressGps = (address: any) => {
    const latitude = Number(address?.latitude);
    const longitude = Number(address?.longitude);
    return (
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      !(latitude === 0 && longitude === 0)
    );
  };

  // Refetch addresses every time the checkout screen comes into focus
  // so a newly-added address is never stale (the root cause of the bug).
  useEffect(() => {
    if (!isAuthenticated) {
      replaceTo(navigate, "/auth" as any);
      return;
    }
    fetchAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  useEffect(() => {
    fetchShippingConfig();
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
    paymentMethod,
  });

  useEffect(() => {
    let cancelled = false;

    const fetchQuote = async () => {
      if (
        !selectedAddress ||
        !hasAddressGps(selectedAddress) ||
        items.length === 0
      ) {
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
            rawMsg.includes("24 character hex") ||
            rawMsg.includes("Uint8Array") ||
            rawMsg.includes("Cast to ObjectId") ||
            rawMsg.includes("BSON")
              ? "Unable to verify delivery to this location. Please check your address pin or try another address."
              : rawMsg || "Unable to fetch delivery quote";
          setQuoteError(friendlyMsg);
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

      // Prioritize verified default address, then any verified address, then default, then first
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
                pathname: "/account/address-form",
                params: {
                  id: selectedAddress._id,
                  data: JSON.stringify(selectedAddress),
                },
              }),
          },
        ],
      );
      return;
    }

    // Block order if address phone is not verified
    if (!selectedAddress.isPhoneVerified) {
      showAlert(
        "Phone Verification Required",
        "Please verify the phone number on your delivery address via WhatsApp OTP before placing your order.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Verify Now",
            style: "default",
            onPress: () => setOtpSheetVisible(true),
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

      // Cash on Delivery: the server confirms the order immediately (no gateway
      // step and no razorpayOrder), so go straight to the success screen.
      if (paymentMethod === "COD" || !razorpayOrder) {
        clearCart("clothing");
        replaceTo(navigate, {
          pathname: "/order-success",
          params: { orderId: order.orderId },
        });
        return;
      }

      // 2. Open Razorpay Checkout
      const options = {
        description: "Payment for Order " + order.orderId,
        // Razorpay `image` (checkout logo) is optional; omitted rather than
        // shipping a broken placeholder URL. Wire to appConfig.logoUrl when a
        // hosted brand logo is available.
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

      openRazorpayCheckout(options)
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
            clearCart("clothing");
            replaceTo(navigate, {
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
      showAlert("Error", error.message || "Failed to initiate order", [
        { text: "OK", style: "default" },
      ]);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div
        className="flex min-h-screen flex-1 flex-col items-center justify-center"
        style={{ backgroundColor: theme.background }}
      >
        <span
          className="h-5 w-5 animate-spin rounded-full border-2 border-t-transparent"
          style={{
            borderColor: `${theme.primary}55`,
            borderTopColor: theme.primary,
          }}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className="flex min-h-screen flex-1 flex-col items-center justify-center"
        style={{ backgroundColor: theme.background }}
      >
        <span
          className="h-8 w-8 animate-spin rounded-full border-[3px] border-t-transparent"
          style={{
            borderColor: `${theme.primary}44`,
            borderTopColor: theme.primary,
          }}
        />
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen flex-1 flex-col"
      style={{ backgroundColor: theme.background }}
    >
      {/* Header */}
      <div
        className="flex flex-row items-center justify-between px-5 py-4"
        style={{ backgroundColor: theme.background }}
      >
        <button
          type="button"
          onClick={() => goBack(navigate, "/clothing/cart")}
          className="flex h-11 w-11 items-center justify-center rounded-[14px] border"
          style={{
            backgroundColor: theme.tertiaryBackground,
            borderColor: theme.border,
          }}
          aria-label="Go back"
        >
          <ArrowLeft size={24} color={theme.text} />
        </button>
        <h2
          className="text-xl font-black tracking-[-0.5px]"
          style={{ color: theme.text }}
        >
          Checkout
        </h2>
        <div className="w-11" />
      </div>

      <div className="overflow-auto" style={{ paddingBottom: 160 }}>
        {/* Phone capture banner — sellers call to confirm orders, so
            users without a phone on file are nudged to add one before
            they can complete checkout. */}
        <div className="mx-5">
          {Boolean(isAuthenticated && !user?.phone) && <PhoneMissingBanner />}
        </div>

        {/* Delivery Address */}
        <div
          className="mx-5 my-2.5 rounded-3xl border p-6"
          style={{
            backgroundColor: theme.tertiaryBackground,
            borderColor: theme.border,
          }}
        >
          <div className="mb-5 flex flex-row items-center justify-between">
            <h3
              className="text-[17px] font-extrabold tracking-[-0.3px]"
              style={{ color: theme.text }}
            >
              Delivery Address
            </h3>
            <button
              type="button"
              onClick={() => goTo(navigate, "/account/addresses")}
            >
              <span
                className="text-sm font-bold"
                style={{ color: theme.primary }}
              >
                {selectedAddress ? "Change" : "Add Address"}
              </span>
            </button>
          </div>

          {selectedAddress ? (
            <div className="flex flex-row items-center gap-4">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ backgroundColor: theme.primary + "10" }}
              >
                <MapPin size={24} color={theme.primary} />
              </div>
              <div className="flex-1">
                <p
                  className="mb-1 text-base font-bold"
                  style={{ color: theme.text }}
                >
                  {selectedAddress.fullName}
                </p>
                <p
                  className="text-sm leading-5"
                  style={{ color: theme.secondaryText }}
                >
                  {selectedAddress.street}, {selectedAddress.city},{" "}
                  {selectedAddress.state} - {selectedAddress.pincode}
                </p>
                <p
                  className="mt-1.5 text-sm font-semibold"
                  style={{ color: theme.text }}
                >
                  {selectedAddress.phone}
                </p>
                {selectedAddress.isPhoneVerified ? (
                  <div className="mt-[5px] flex flex-row items-center gap-[5px]">
                    <ShieldCheck size={13} color="#16a34a" />
                    <span
                      className="text-[11px] font-bold"
                      style={{ color: "#16a34a" }}
                    >
                      Verified Number
                    </span>
                  </div>
                ) : (
                  <div className="mt-[5px] flex flex-row items-center gap-2">
                    <div className="flex flex-row items-center gap-1">
                      <CircleAlert size={13} color="#ea580c" />
                      <span
                        className="text-[11px] font-semibold"
                        style={{ color: "#ea580c" }}
                      >
                        Phone not verified
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOtpSheetVisible(true)}
                      className="rounded-md border px-2 py-[2.5px]"
                      style={{
                        backgroundColor: theme.primary + "18",
                        borderColor: theme.primary + "44",
                      }}
                    >
                      <span
                        className="text-[11px] font-bold"
                        style={{ color: theme.primary }}
                      >
                        Verify Now
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => goTo(navigate, "/account/addresses")}
              className="flex w-full items-center justify-center py-2.5"
            >
              <span style={{ color: theme.secondaryText }}>
                No address selected
              </span>
            </button>
          )}
        </div>

        {/* Order Summary */}
        <div
          className="mx-5 my-2.5 rounded-3xl border p-6"
          style={{
            backgroundColor: theme.tertiaryBackground,
            borderColor: theme.border,
          }}
        >
          <h3
            className="mb-5 text-[17px] font-extrabold tracking-[-0.3px]"
            style={{ color: theme.text }}
          >
            Order Summary
          </h3>
          {(() => {
            const groupedItems = items.reduce(
              (acc, item) => {
                const sellerId = item.sellerId || "unknown";
                if (!acc[sellerId]) acc[sellerId] = [];
                acc[sellerId].push(item);
                return acc;
              },
              {} as Record<string, typeof items>,
            );

            return Object.entries(groupedItems).map(
              ([sellerId, sellerItems]) => {
                const sellerSubtotal = sellerItems.reduce(
                  (sum, item) => sum + (item.price || 0) * item.quantity,
                  0,
                );

                const sellerCoupon = (appliedCoupons || []).find(
                  (c) => (c.sellerId || "global") === sellerId,
                );
                const couponDiscount = sellerCoupon?.appliedDiscount || 0;
                const finalSellerSubtotal = Math.max(
                  0,
                  sellerSubtotal - couponDiscount,
                );
                const sellerDisplayName =
                  sellerId !== "unknown"
                    ? `Store: #${sellerId.substring(sellerId.length - 6).toUpperCase()}`
                    : "Seller Section";

                return (
                  <div
                    key={sellerId}
                    className="mb-5 border-b pb-4"
                    style={{ borderBottomColor: theme.border }}
                  >
                    <p
                      className="mb-3 text-[15px] font-bold"
                      style={{ color: theme.text }}
                    >
                      {sellerDisplayName}
                    </p>

                    {sellerItems.map((item) => (
                      <div
                        key={item.sku}
                        className="mb-5 flex flex-row items-center gap-4"
                      >
                        <img
                          src={item.image}
                          alt={item.productTitle}
                          className="h-16 w-16 rounded-xl border object-cover"
                          style={{
                            backgroundColor: theme.tertiaryBackground,
                            borderColor: theme.border,
                          }}
                        />
                        <div className="flex flex-1 flex-col justify-center">
                          <p
                            className={cn(
                              "mb-1 line-clamp-1 text-[15px] font-bold",
                            )}
                            style={{ color: theme.text }}
                          >
                            {item.productTitle}
                          </p>
                          <p
                            className="text-xs font-semibold"
                            style={{ color: theme.secondaryText }}
                          >
                            {item.selectedSize} / {item.selectedColor} • Qty{" "}
                            {item.quantity}
                          </p>
                        </div>
                        <span
                          className="text-right text-[15px] font-black"
                          style={{ color: theme.text }}
                        >
                          ₹
                          {((item.price || 0) * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}

                    <div className="mt-3 flex flex-col gap-1.5 pl-2">
                      <div className="flex flex-row justify-between">
                        <span
                          className="text-[13px]"
                          style={{ color: theme.secondaryText }}
                        >
                          Subtotal
                        </span>
                        <span
                          className="text-[13px] font-semibold"
                          style={{ color: theme.text }}
                        >
                          ₹{sellerSubtotal.toLocaleString()}
                        </span>
                      </div>
                      {couponDiscount > 0 && (
                        <div className="flex flex-row justify-between">
                          <span
                            className="text-[13px]"
                            style={{ color: theme.primary }}
                          >
                            Coupon ({sellerCoupon?.code})
                          </span>
                          <span
                            className="text-[13px] font-semibold"
                            style={{ color: theme.primary }}
                          >
                            -₹{couponDiscount.toLocaleString()}
                          </span>
                        </div>
                      )}
                      <div
                        className="flex flex-row justify-between border-t pt-1.5"
                        style={{ borderTopColor: theme.border }}
                      >
                        <span
                          className="text-[13px] font-bold"
                          style={{ color: theme.text }}
                        >
                          Net Seller Total
                        </span>
                        <span
                          className="text-[13px] font-bold"
                          style={{ color: theme.primary }}
                        >
                          ₹{finalSellerSubtotal.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              },
            );
          })()}
        </div>

        {/* Payment Method */}
        <div
          className="mx-5 my-2.5 rounded-3xl border p-6"
          style={{
            backgroundColor: theme.tertiaryBackground,
            borderColor: theme.border,
          }}
        >
          <h3
            className="mb-4 text-[17px] font-extrabold tracking-[-0.3px]"
            style={{ color: theme.text }}
          >
            Payment Method
          </h3>
          {(
            [
              {
                key: "ONLINE",
                label: "Pay Online",
                desc: "UPI, Cards, Netbanking & Wallets",
                icon: CreditCard,
              },
              {
                key: "COD",
                label: "Cash on Delivery",
                desc: "Pay in cash when your order arrives",
                icon: Banknote,
              },
            ] as const
          ).map((option) => {
            const isSelected = paymentMethod === option.key;
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => setPaymentMethod(option.key)}
                className="mb-2.5 flex w-full flex-row items-center rounded-xl border-[1.5px] p-3.5"
                style={{
                  borderColor: isSelected ? theme.primary : theme.border,
                  backgroundColor: isSelected
                    ? `${theme.primary}12`
                    : "transparent",
                }}
              >
                <option.icon
                  size={24}
                  color={isSelected ? theme.primary : theme.secondaryText}
                />
                <div className="ml-3 flex-1 text-left">
                  <p
                    className="text-[15px] font-bold"
                    style={{ color: theme.text }}
                  >
                    {option.label}
                  </p>
                  <p
                    className="mt-0.5 text-xs"
                    style={{ color: theme.secondaryText }}
                  >
                    {option.desc}
                  </p>
                </div>
                {isSelected ? (
                  <CircleDot size={22} color={theme.primary} />
                ) : (
                  <Circle size={22} color={theme.secondaryText} />
                )}
              </button>
            );
          })}
        </div>

        {/* Bill Details */}
        <div
          className="mx-5 my-2.5 rounded-3xl border p-6"
          style={{
            backgroundColor: theme.tertiaryBackground,
            borderColor: theme.border,
          }}
        >
          <h3
            className="mb-4 text-[17px] font-extrabold tracking-[-0.3px]"
            style={{ color: theme.text }}
          >
            Bill Details
          </h3>

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
                <div className="mb-3.5 flex flex-row justify-between">
                  <span
                    className="text-[15px]"
                    style={{ color: theme.secondaryText }}
                  >
                    Item Total (MRP)
                  </span>
                  <span
                    className="text-[15px] font-bold"
                    style={{ color: theme.text }}
                  >
                    ₹{totalMRP.toLocaleString()}
                  </span>
                </div>

                {productDiscount > 0 && (
                  <div className="mb-3.5 flex flex-row justify-between">
                    <span
                      className="text-[15px]"
                      style={{ color: theme.secondaryText }}
                    >
                      Product Discount
                    </span>
                    <span
                      className="text-[15px] font-bold"
                      style={{ color: "#059669" }}
                    >
                      -₹{productDiscount.toLocaleString()}
                    </span>
                  </div>
                )}
              </>
            );
          })()}

          <div
            className="my-[18px] h-px"
            style={{ backgroundColor: theme.border }}
          />

          <div className="mb-3.5 flex flex-row justify-between">
            <span
              className="text-[15px]"
              style={{ color: theme.secondaryText }}
            >
              Subtotal (Excl. Tax)
            </span>
            <span
              className="text-[15px] font-bold"
              style={{ color: theme.text }}
            >
              ₹{(subtotal - totalTax).toLocaleString()}
            </span>
          </div>

          {totalTax > 0 && (
            <div className="mb-3.5 flex flex-row justify-between">
              <span
                className="text-[15px]"
                style={{ color: theme.secondaryText }}
              >
                GST / Fixed Taxes (Incl.)
              </span>
              <span
                className="text-[15px] font-bold"
                style={{ color: theme.secondaryText }}
              >
                ₹{totalTax.toLocaleString()}
              </span>
            </div>
          )}

          <div className="mb-3.5 flex flex-row justify-between">
            <span
              className="text-[15px]"
              style={{ color: theme.secondaryText }}
            >
              Shipping Fee
            </span>
            <span
              className="text-[15px] font-bold"
              style={{ color: theme.text }}
            >
              {displayShipping === 0
                ? "FREE"
                : `Rs. ${displayShipping.toLocaleString()}`}
            </span>
          </div>

          {dynamicDeliverySurcharge > 0 && (
            <>
              <div className="mb-3.5 flex flex-row justify-between">
                <span
                  className="text-[15px]"
                  style={{ color: theme.secondaryText }}
                >
                  Dynamic Delivery Surcharge
                </span>
                <span
                  className="text-[15px] font-bold"
                  style={{ color: theme.text }}
                >
                  Rs. {dynamicDeliverySurcharge.toLocaleString()}
                </span>
              </div>
              {activeBonusLabels.length > 0 && (
                <p
                  className="-mt-2 mb-3 text-xs"
                  style={{ color: theme.secondaryText }}
                >
                  {Array.from(new Set(activeBonusLabels)).join(" | ")}
                </p>
              )}
            </>
          )}

          {isQuoteLoading && (
            <div className="mb-3 flex flex-row items-center gap-1.5">
              <span
                className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-t-transparent"
                style={{
                  borderColor: `${theme.secondaryText}44`,
                  borderTopColor: theme.secondaryText,
                }}
              />
              <span className="text-xs" style={{ color: theme.secondaryText }}>
                Checking delivery availability...
              </span>
            </div>
          )}
          {quoteError ? (
            <div
              className="mb-3 flex flex-col gap-1.5 rounded-[10px] border-[1.5px] p-3"
              style={{
                borderColor: "#dc2626",
                backgroundColor: "#fef2f2",
              }}
            >
              <div className="flex flex-row items-center gap-1.5">
                <CircleAlert size={16} color="#dc2626" />
                <span
                  className="text-[13px] font-bold"
                  style={{ color: "#dc2626" }}
                >
                  Cannot Deliver to This Address
                </span>
              </div>
              <p
                className="text-xs leading-[18px]"
                style={{ color: "#7f1d1d" }}
              >
                {quoteError}
              </p>
              <div className="mt-0.5 flex flex-row items-center gap-1">
                <Info size={13} color="#991b1b" />
                <span className="text-[11px]" style={{ color: "#991b1b" }}>
                  Try changing your delivery address or contact the seller.
                </span>
              </div>
            </div>
          ) : null}

          {appliedCoupons.map((coupon) => (
            <div
              key={coupon.code}
              className="mb-3.5 flex flex-row justify-between"
            >
              <span
                className="text-[15px]"
                style={{ color: theme.secondaryText }}
              >
                Coupon ({coupon.code})
              </span>
              <span
                className="text-[15px] font-bold"
                style={{ color: "#059669" }}
              >
                -₹{(coupon.appliedDiscount || 0).toLocaleString()}
              </span>
            </div>
          ))}

          {appliedCoupons.length === 0 && discountAmount > 0 && (
            <div className="mb-3.5 flex flex-row justify-between">
              <span
                className="text-[15px]"
                style={{ color: theme.secondaryText }}
              >
                Coupon ({appliedCoupon?.code || ""})
              </span>
              <span
                className="text-[15px] font-bold"
                style={{ color: "#059669" }}
              >
                -₹{discountAmount.toLocaleString()}
              </span>
            </div>
          )}

          <div
            className="my-[18px] h-px"
            style={{ backgroundColor: theme.border }}
          />

          <div className="flex flex-row items-center justify-between">
            <span
              className="text-lg font-extrabold"
              style={{ color: theme.text }}
            >
              Total Payable
            </span>
            <span
              className="text-[22px] font-black"
              style={{ color: theme.primary }}
            >
              ₹{totalPayable.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Footer — viewport-fixed so the tab bar never covers the CTA */}
      <div
        className="fixed right-0 left-0 z-40 p-6"
        style={{
          bottom: footerBottom,
          backgroundColor: theme.background + "D0",
        }}
      >
        <button
          type="button"
          onClick={handlePlaceOrder}
          disabled={
            isProcessingPayment || isQuoteLoading || Boolean(quoteError)
          }
          className="h-16 w-full overflow-hidden rounded-[20px]"
          style={{
            backgroundColor: theme.primary,
            opacity:
              isProcessingPayment || isQuoteLoading || Boolean(quoteError)
                ? 0.5
                : 1,
            cursor:
              isProcessingPayment || isQuoteLoading || Boolean(quoteError)
                ? "not-allowed"
                : "pointer",
          }}
        >
          {isProcessingPayment ? (
            <div className="flex h-full flex-1 flex-row items-center justify-center px-6">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            </div>
          ) : (
            <div className="flex h-full flex-1 flex-row items-center justify-center px-6">
              <span className="text-lg font-black text-white">
                ₹{totalPayable.toLocaleString()}
              </span>
              <div className="mx-4 h-6 w-px bg-white/30" />
              <span className="text-lg font-extrabold tracking-[0.5px] text-white">
                {paymentMethod === "COD"
                  ? "Place COD Order"
                  : "Pay & Place Order"}
              </span>
            </div>
          )}
        </button>
      </div>

      {/* Custom Alert Dialog */}
      <IOSAlertDialog
        visible={alertConfig.visible}
        onClose={hideAlert}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
      />

      {/* Phone OTP verification sheet for checkout */}
      {selectedAddress && (
        <PhoneOtpSheet
          visible={otpSheetVisible}
          initialPhone={selectedAddress.phone || user?.phone || ""}
          onVerified={async (verifiedPhone) => {
            setOtpSheetVisible(false);
            try {
              await updateAddressRequest(selectedAddress._id, {
                ...selectedAddress,
                phone: verifiedPhone,
              });
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
};

export default CheckoutScreen;
