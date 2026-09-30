import { ArrowLeft, Check, Gift, MapPin, Phone, Share2, Shield } from "lucide-react";
import dayjs from "dayjs";
import * as Haptics from "@/lib/haptics";
import { useNavigate } from "react-router-dom";
import { goBack, goTo, useRouteParams } from "@/src/utils/navigation";
import React, { useEffect, useState } from "react";

import { APP_CURRENCY } from "@/src/constants";
import { SocketEvents } from "@/src/constants/socketEvents";
import { getOrderByIdRequest } from "@/src/features/common/order/api/order.api";
import { filterOrderItemsByModule } from "@/src/features/common/order/lib/orderModule";
import { useColors } from "@/src/features/Jewelery/hooks/useColors";
import { useTopPad } from "@/src/hooks/useTopPad";

import { socketClient } from "@/src/lib/socket";

const ORDER_TIMELINE = [
  { key: "CONFIRMED", title: "Order Confirmed", sub: "Order verified & logged" },
  { key: "PROCESSING", title: "Crafting & Packing", sub: "Artisanal prep & inspection" },
  { key: "IN_TRANSIT", title: "Out for Delivery", sub: "Secured courier dispatched" },
  { key: "DELIVERED", title: "Hand Delivered", sub: "Safely received" },
];

export default function JeweleryOrderDetailScreen() {
  const colors = useColors();
  const navigate = useNavigate();
  const topPad = useTopPad();
  const bottomPad = 34;

  const params = useRouteParams<{ id?: string; orderId?: string }>();
  const orderId = String(params.id || params.orderId || "");

  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Jewellery catalogue shows jewellery lines only (order totals stay
  // order-level — they reflect what was actually paid).
  const jeweleryItems = React.useMemo(
    () => filterOrderItemsByModule(order?.items, "jewelery"),
    [order],
  );

  const fetchOrderDetail = async () => {
    if (!orderId) return;
    try {
      setIsLoading(true);
      const res = await getOrderByIdRequest(orderId);
      setOrder(res.data);
    } catch (e) {
      console.error("Failed to load jewelry order detail:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();

    socketClient.on(SocketEvents.ORDER_STATUS_UPDATE, (data) => {
      if (data?.orderId === orderId) {
        fetchOrderDetail();
      }
    });

    return () => {
      socketClient.off(SocketEvents.ORDER_STATUS_UPDATE);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchOrderDetail();
    setIsRefreshing(false);
  };

  const handleShare = async () => {
    if (!order) return;
    // Share only this catalogue's pieces.
    const shareItems = jeweleryItems;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const itemsText = shareItems
        .map(
          (i: any) =>
            `• ${i.title || i.productTitle || "Jewellery Piece"} (x${i.quantity}) - ${APP_CURRENCY}${(
              (i.price || 0) * (i.quantity || 1)
            ).toLocaleString("en-IN")}`
        )
        .join("\n");

      const title = `Receipt - Order #${order.orderId}`;
      const text =
        `👑 QuickBihar Jewellery\n` +
        `Order #${order.orderId}\n` +
        `Status: ${order.status}\n\n` +
        `Items:\n${itemsText}\n\n` +
        `Total Paid: ${APP_CURRENCY}${(order.payableAmount || 0).toLocaleString("en-IN")}\n` +
        `Thank you for acquiring our fine jewellery.`;
      if (navigator.share) {
        await navigator.share({ title, text });
      } else {
        await navigator.clipboard.writeText(`${title}\n${text}`);
        window.alert("Receipt copied to clipboard");
      }
    } catch {}
  };

  const handleNavigateToProduct = (item: any) => {
    const prod =
      item.productId && typeof item.productId === "object"
        ? item.productId
        : null;
    const prodId = prod?.slug || prod?._id || item.productId || item._id;
    if (prodId && typeof prodId === "string") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      goTo(navigate, {
        pathname: "/jewelery/product/[id]" as any,
        params: { id: prodId },
      });
    }
  };

  const getCurrentStepIndex = (status: string) => {
    const s = (status || "").toUpperCase();
    if (s === "DELIVERED") return 3;
    if (s === "IN_TRANSIT" || s === "SHIPPED") return 2;
    if (s === "PROCESSING") return 1;
    return 0; // CONFIRMED or PENDING
  };

  const activeStep = getCurrentStepIndex(order?.status);

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: colors.ivory }}>
      {/* Header */}
      <div
        className="flex flex-row items-center gap-3 px-5 pb-[14px]"
        style={{
          paddingTop: topPad + 12,
          backgroundColor: colors.ivory,
          borderBottomColor: colors.midGray,
          borderBottomWidth: 1,
          borderBottomStyle: "solid",
        }}
      >
        <button
          type="button"
          onClick={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            goBack(navigate, "/jewelery/orders");
          }}
          aria-label="Go back"
          className="flex h-9 w-9 cursor-pointer items-center justify-center"
        >
          <ArrowLeft size={18} color={colors.ink} />
        </button>

        <div className="flex-1">
          <h1
            className="text-[17px] tracking-[1.2px]"
            style={{
              color: colors.ink,
              fontFamily: "CormorantGaramond_600SemiBold",
            }}
          >
            {order ? `ORDER #${order.orderId}` : "ORDER DETAILS"}
          </h1>
          {order && (
            <p
              className="mt-[2px] text-[11px]"
              style={{ color: colors.warmGray, fontFamily: "DMSans_400Regular" }}
            >
              Placed on {dayjs(order.createdAt).format("DD MMMM YYYY")}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={handleShare}
          aria-label="Share receipt"
          className="flex h-9 w-9 cursor-pointer items-center justify-center"
        >
          <Share2 size={16} color={colors.gold} />
        </button>
      </div>

      <div className="overflow-auto p-4" style={{ paddingBottom: bottomPad + 40 }}>
        {isLoading && !order ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <span
              className="h-5 w-5 animate-spin rounded-full border-2"
              style={{ borderColor: `${colors.gold}30`, borderTopColor: colors.gold }}
            />
            <span
              className="text-[13px]"
              style={{ color: colors.warmGray, fontFamily: "DMSans_400Regular" }}
            >
              Loading order details...
            </span>
          </div>
        ) : order ? (
          <div className="flex flex-col gap-4">
            {/* Status Timeline */}
            <div
              className="rounded-[3px] border p-4 shadow-sm"
              style={{
                backgroundColor: colors.cardBg,
                borderColor: colors.border,
              }}
            >
              <h2
                className="mb-3 text-[14px] tracking-[1px]"
                style={{
                  color: colors.ink,
                  fontFamily: "CormorantGaramond_600SemiBold",
                }}
              >
                DELIVERY PROGRESS
              </h2>

              <div className="flex flex-col gap-1">
                {ORDER_TIMELINE.map((step, idx) => {
                  const isDone = idx <= activeStep;
                  const isCurrent = idx === activeStep;

                  return (
                    <div key={step.key} className="flex flex-row gap-3">
                      <div className="flex w-5 flex-col items-center">
                        <div
                          className="flex h-[18px] w-[18px] items-center justify-center rounded-full border"
                          style={{
                            backgroundColor: isDone ? colors.gold : colors.pearl,
                            borderColor: isDone ? colors.gold : colors.midGray,
                            borderWidth: 1.5,
                          }}
                        >
                          {isDone ? (
                            <Check size={10} color={colors.onBrand} />
                          ) : (
                            <div
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: colors.warmGray }}
                            />
                          )}
                        </div>
                        {idx < ORDER_TIMELINE.length - 1 && (
                          <div
                            className="my-[2px] h-7 w-[1.5px]"
                            style={{
                              backgroundColor:
                                idx < activeStep ? colors.gold : colors.midGray,
                            }}
                          />
                        )}
                      </div>

                      <div className="flex-1 pb-4">
                        <span
                          className="block text-[13px]"
                          style={{
                            color: isCurrent ? colors.gold : colors.ink,
                            fontFamily: isCurrent
                              ? "DMSans_700Bold"
                              : "DMSans_500Medium",
                          }}
                        >
                          {step.title}
                        </span>
                        <span
                          className="mt-[2px] block text-[11px]"
                          style={{
                            color: colors.warmGray,
                            fontFamily: "DMSans_400Regular",
                          }}
                        >
                          {step.sub}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pieces in Order */}
            <div
              className="rounded-[3px] border p-4 shadow-sm"
              style={{
                backgroundColor: colors.cardBg,
                borderColor: colors.border,
              }}
            >
              <h2
                className="mb-3 text-[14px] tracking-[1px]"
                style={{
                  color: colors.ink,
                  fontFamily: "CormorantGaramond_600SemiBold",
                }}
              >
                YOUR ACQUISITIONS ({jeweleryItems.length})
              </h2>

              <div className="flex flex-col gap-3">
                {jeweleryItems.map((item: any, idx: number) => {
                  const imgUri =
                    typeof item.image === "string"
                      ? item.image
                      : item.image?.url ||
                        item.productId?.images?.[0] ||
                        item.productId?.image;

                  return (
                    <button
                      key={item.sku || idx}
                      type="button"
                      onClick={() => handleNavigateToProduct(item)}
                      className="flex w-full cursor-pointer flex-row gap-3 py-[10px] text-left"
                      style={{
                        borderBottomColor: colors.border,
                        borderBottomWidth:
                          idx < jeweleryItems.length - 1 ? 1 : 0,
                        borderBottomStyle:
                          idx < jeweleryItems.length - 1 ? "solid" : undefined,
                      }}
                    >
                      {imgUri ? (
                        <img
                          src={imgUri}
                          alt={`${item.title || item.productTitle || "Fine Jewellery Piece"} - Shop Online in Bihar`}
                          title={`${item.title || item.productTitle || "Fine Jewellery Piece"} | QuickBihar Jewellery`}
                          className="h-20 w-16 rounded-[2px] object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div
                          className="flex h-20 w-16 items-center justify-center rounded-[2px]"
                          style={{ backgroundColor: colors.champagne }}
                        >
                          <Gift size={20} color={colors.gold} />
                        </div>
                      )}

                      <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                        <span
                          className="line-clamp-2 text-[15px] tracking-[0.3px]"
                          style={{
                            color: colors.ink,
                            fontFamily: "CormorantGaramond_600SemiBold",
                          }}
                        >
                          {item.title || item.productTitle || "Fine Jewellery Piece"}
                        </span>

                        {item.sku && (
                          <span
                            className="text-[10.5px]"
                            style={{
                              color: colors.warmGray,
                              fontFamily: "DMSans_400Regular",
                            }}
                          >
                            SKU: {item.sku}
                          </span>
                        )}

                        <div className="mt-1.5 flex flex-row items-center justify-between">
                          <span
                            className="text-[11.5px]"
                            style={{
                              color: colors.warmGray,
                              fontFamily: "DMSans_400Regular",
                            }}
                          >
                            Qty: {item.quantity || 1}
                          </span>
                          <span
                            className="text-[14px]"
                            style={{
                              color: colors.ink,
                              fontFamily: "DMSans_600SemiBold",
                            }}
                          >
                            {APP_CURRENCY}
                            {(
                              (item.price || 0) * (item.quantity || 1)
                            ).toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Delivery Address */}
            {order.shippingAddress && (
              <div
                className="rounded-[3px] border p-4 shadow-sm"
                style={{
                  backgroundColor: colors.cardBg,
                  borderColor: colors.border,
                }}
              >
                <div className="mb-3 flex flex-row items-center justify-between">
                  <h2
                    className="text-[14px] tracking-[1px]"
                    style={{
                      color: colors.ink,
                      fontFamily: "CormorantGaramond_600SemiBold",
                    }}
                  >
                    DESTINATION
                  </h2>
                  <MapPin size={14} color={colors.gold} />
                </div>

                <p
                  className="mb-1 text-[14px]"
                  style={{
                    color: colors.ink,
                    fontFamily: "DMSans_600SemiBold",
                  }}
                >
                  {order.shippingAddress.fullName}
                </p>
                <p
                  className="mb-[10px] text-[12.5px] leading-[18px]"
                  style={{
                    color: colors.warmGray,
                    fontFamily: "DMSans_400Regular",
                  }}
                >
                  {order.shippingAddress.street}
                  {order.shippingAddress.landmark
                    ? `, Near ${order.shippingAddress.landmark}`
                    : ""}
                  <br />
                  {order.shippingAddress.city}, {order.shippingAddress.state} —{" "}
                  {order.shippingAddress.pincode}
                </p>
                <div className="flex flex-row items-center gap-1.5">
                  <Phone size={11} color={colors.gold} />
                  <span
                    className="text-[12px]"
                    style={{
                      color: colors.ink,
                      fontFamily: "DMSans_500Medium",
                    }}
                  >
                    {order.shippingAddress.phone}
                  </span>
                </div>
              </div>
            )}

            {/* Payment & Charges Summary */}
            <div
              className="rounded-[3px] border p-4 shadow-sm"
              style={{
                backgroundColor: colors.cardBg,
                borderColor: colors.border,
              }}
            >
              <h2
                className="mb-3 text-[14px] tracking-[1px]"
                style={{
                  color: colors.ink,
                  fontFamily: "CormorantGaramond_600SemiBold",
                }}
              >
                PAYMENT BREAKDOWN
              </h2>

              <div className="mb-2 flex flex-row items-center justify-between">
                <span
                  className="text-[12px]"
                  style={{
                    color: colors.warmGray,
                    fontFamily: "DMSans_400Regular",
                  }}
                >
                  Payment Method
                </span>
                <span
                  className="text-[12.5px]"
                  style={{
                    color: colors.ink,
                    fontFamily: "DMSans_500Medium",
                  }}
                >
                  {order.paymentMethod === "COD" ? "Cash on Delivery" : "Online Gateway (Razorpay)"}
                </span>
              </div>

              <div className="mb-2 flex flex-row items-center justify-between">
                <span
                  className="text-[12px]"
                  style={{
                    color: colors.warmGray,
                    fontFamily: "DMSans_400Regular",
                  }}
                >
                  Subtotal
                </span>
                <span
                  className="text-[12.5px]"
                  style={{
                    color: colors.ink,
                    fontFamily: "DMSans_500Medium",
                  }}
                >
                  {APP_CURRENCY}
                  {(order.subtotal || order.payableAmount || 0).toLocaleString("en-IN")}
                </span>
              </div>

              <div className="mb-2 flex flex-row items-center justify-between">
                <span
                  className="text-[12px]"
                  style={{
                    color: colors.warmGray,
                    fontFamily: "DMSans_400Regular",
                  }}
                >
                  Insured Delivery
                </span>
                <span
                  className="text-[12.5px]"
                  style={{
                    color: colors.gold,
                    fontFamily: "DMSans_600SemiBold",
                  }}
                >
                  {order.shippingFee === 0 || !order.shippingFee
                    ? "Complimentary"
                    : `${APP_CURRENCY}${order.shippingFee}`}
                </span>
              </div>

              {order.discountAmount > 0 && (
                <div className="mb-2 flex flex-row items-center justify-between">
                  <span
                    className="text-[12px]"
                    style={{
                      color: colors.warmGray,
                      fontFamily: "DMSans_400Regular",
                    }}
                  >
                    Privilege Savings
                  </span>
                  <span
                    className="text-[12.5px]"
                    style={{
                      color: colors.gold,
                      fontFamily: "DMSans_600SemiBold",
                    }}
                  >
                    -{APP_CURRENCY}
                    {(order.discountAmount || 0).toLocaleString("en-IN")}
                  </span>
                </div>
              )}

              <div
                className="my-[10px] h-px"
                style={{ backgroundColor: colors.border }}
              />

              <div className="flex flex-row items-center justify-between">
                <span
                  className="text-[14px]"
                  style={{
                    color: colors.ink,
                    fontFamily: "DMSans_700Bold",
                  }}
                >
                  Total Paid
                </span>
                <span
                  className="text-[16px]"
                  style={{
                    color: colors.gold,
                    fontFamily: "DMSans_700Bold",
                  }}
                >
                  {APP_CURRENCY}
                  {(order.payableAmount || 0).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Assistance & Concierge Card */}
            <div
              className="flex flex-row items-center gap-3 rounded-[2px] border p-[14px]"
              style={{
                backgroundColor: colors.champagne,
                borderColor: colors.gold,
                borderWidth: 1,
              }}
            >
              <Shield size={20} color={colors.gold} />
              <div className="flex flex-1 flex-col gap-[2px]">
                <span
                  className="text-[15px]"
                  style={{
                    color: colors.ink,
                    fontFamily: "CormorantGaramond_600SemiBold",
                  }}
                >
                  Jewellery Concierge
                </span>
                <span
                  className="text-[11.5px] leading-4"
                  style={{
                    color: colors.warmGray,
                    fontFamily: "DMSans_400Regular",
                  }}
                >
                  Every piece is certified, insured, and handled with white-glove delivery care.
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-[60px]">
            <span className="text-[13px]" style={{ color: colors.warmGray }}>
              Order could not be located.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
