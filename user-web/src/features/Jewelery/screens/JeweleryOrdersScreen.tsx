import { ArrowLeft, ArrowRight, ChevronRight, CircleCheck, CircleX, Clock, Gift, Package, Shield, Truck } from "lucide-react";
import dayjs from "dayjs";
import * as Haptics from "@/lib/haptics";
import { useNavigate } from "react-router-dom";
import { goBack, goTo, replaceTo } from "@/src/utils/navigation";
import React, { useEffect, useState } from "react";

import { APP_CURRENCY } from "@/src/constants";
import { SocketEvents } from "@/src/constants/socketEvents";
import { getMyOrdersRequest } from "@/src/features/common/order/api/order.api";
import { orderHasModule } from "@/src/features/common/order/lib/orderModule";
import { useColors } from "@/src/features/Jewelery/hooks/useColors";
import { useTopPad } from "@/src/hooks/useTopPad";
import { socketClient } from "@/src/lib/socket";

export default function JeweleryOrdersScreen() {
  const colors = useColors();
  const navigate = useNavigate();
  const topPad = useTopPad();
  const bottomPad = 34;

  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const res = await getMyOrdersRequest();
      // Jewellery catalogue shows jewellery orders only — clothing
      // orders live in the clothing order history.
      setOrders((res.data || []).filter((o: any) => orderHasModule(o, "jewelery")));
    } catch (e) {
      console.error("Failed to fetch jewelry orders:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    socketClient.on(SocketEvents.ORDER_STATUS_UPDATE, () => {
      fetchOrders();
    });

    return () => {
      socketClient.off(SocketEvents.ORDER_STATUS_UPDATE);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchOrders();
    setIsRefreshing(false);
  };

  const getStatusBadge = (status: string) => {
    const s = (status || "PENDING").toUpperCase();
    switch (s) {
      case "CONFIRMED":
      case "PROCESSING":
        return {
          bg: colors.champagne,
          color: colors.gold,
          icon: CircleCheck,
          label: s === "PROCESSING" ? "Crafting / Packed" : "Confirmed",
        };
      case "IN_TRANSIT":
      case "SHIPPED":
        return {
          bg: colors.pearl,
          color: colors.gold,
          icon: Truck,
          label: "In Transit",
        };
      case "DELIVERED":
        return {
          bg: "#f0fdf4",
          color: "#166534",
          icon: Shield,
          label: "Delivered",
        };
      case "CANCELLED":
      case "REJECTED":
        return {
          bg: "#fef2f2",
          color: "#991b1b",
          icon: CircleX,
          label: "Cancelled",
        };
      default:
        return {
          bg: colors.pearl,
          color: colors.warmGray,
          icon: Clock,
          label: "Processing",
        };
    }
  };

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
            goBack(navigate, "/jewelery/(tabs)/profile");
          }}
          aria-label="Go back"
          className="flex h-9 w-9 cursor-pointer items-center justify-center"
        >
          <ArrowLeft size={18} color={colors.ink} />
        </button>

        <div className="flex-1">
          <h1
            className="text-[18px] tracking-[1.5px]"
            style={{
              color: colors.ink,
              fontFamily: "CormorantGaramond_600SemiBold",
            }}
          >
            YOUR ORDERS
          </h1>
          <p
            className="mt-[2px] text-[11px]"
            style={{ color: colors.warmGray, fontFamily: "DMSans_400Regular" }}
          >
            {orders.length > 0
              ? `${orders.length} order${orders.length === 1 ? "" : "s"} on record`
              : "Track and manage your pieces"}
          </p>
        </div>

        <Package size={16} color={colors.gold} />
      </div>

      <div className="overflow-auto p-4" style={{ paddingBottom: bottomPad + 40 }}>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-[60px]">
            <span
              className="h-5 w-5 animate-spin rounded-full border-2"
              style={{ borderColor: `${colors.gold}30`, borderTopColor: colors.gold }}
            />
            <span
              className="text-[13px]"
              style={{ color: colors.warmGray, fontFamily: "DMSans_400Regular" }}
            >
              Loading your orders...
            </span>
          </div>
        ) : orders.length > 0 ? (
          <div className="flex flex-col gap-[14px]">
            {orders.map((order) => {
              const statusMeta = getStatusBadge(order.status);
              const totalItems = (order.items || []).reduce(
                (sum: number, it: any) => sum + (it.quantity || 1),
                0
              );

              return (
                <button
                  key={order._id || order.orderId}
                  type="button"
                  onClick={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    goTo(navigate, {
                      pathname: "/jewelery/orders/[id]" as any,
                      params: { id: order.orderId },
                    });
                  }}
                  className="w-full cursor-pointer rounded-[3px] border p-4 text-left shadow-sm"
                  style={{
                    backgroundColor: colors.cardBg,
                    borderColor: colors.border,
                  }}
                >
                  {/* Top Bar */}
                  <div className="flex flex-row items-start justify-between">
                    <div>
                      <span
                        className="block text-[13px] tracking-[0.8px]"
                        style={{
                          color: colors.ink,
                          fontFamily: "DMSans_700Bold",
                        }}
                      >
                        ORDER #{order.orderId}
                      </span>
                      <span
                        className="mt-[3px] block text-[11px]"
                        style={{
                          color: colors.warmGray,
                          fontFamily: "DMSans_400Regular",
                        }}
                      >
                        {dayjs(order.createdAt).format("DD MMM YYYY, hh:mm A")}
                      </span>
                    </div>

                    <div
                      className="flex flex-row items-center gap-1 rounded-[2px] border px-2 py-[3px]"
                      style={{
                        backgroundColor: statusMeta.bg,
                        borderColor: statusMeta.color,
                        borderWidth: 1,
                      }}
                    >
                      <statusMeta.icon size={10} color={statusMeta.color} />
                      <span
                        className="text-[10px] tracking-[0.4px]"
                        style={{
                          color: statusMeta.color,
                          fontFamily: "DMSans_600SemiBold",
                        }}
                      >
                        {statusMeta.label}
                      </span>
                    </div>
                  </div>

                  <div
                    className="my-3 h-px"
                    style={{ backgroundColor: colors.border }}
                  />

                  {/* Items Preview */}
                  <div className="flex flex-row items-center gap-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-full"
                      style={{ backgroundColor: colors.champagne }}
                    >
                      <Gift size={16} color={colors.gold} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span
                        className="mb-[2px] block truncate text-[15px]"
                        style={{
                          color: colors.ink,
                          fontFamily: "CormorantGaramond_500Medium_Italic",
                        }}
                      >
                        {order.items?.[0]?.title ||
                          order.items?.[0]?.productTitle ||
                          "Jewellery Creation"}
                        {order.items?.length > 1
                          ? ` & ${order.items.length - 1} other piece${order.items.length > 2 ? "s" : ""}`
                          : ""}
                      </span>
                      <span
                        className="block text-[11.5px]"
                        style={{
                          color: colors.warmGray,
                          fontFamily: "DMSans_400Regular",
                        }}
                      >
                        {totalItems} piece{totalItems !== 1 ? "s" : ""} ·{" "}
                        {order.paymentMethod === "COD" ? "Cash on Delivery" : "Online Payment"}
                      </span>
                    </div>
                  </div>

                  <div
                    className="my-3 h-px"
                    style={{ backgroundColor: colors.border }}
                  />

                  {/* Footer */}
                  <div className="flex flex-row items-center justify-between">
                    <div>
                      <span
                        className="block text-[10.5px] tracking-[0.5px]"
                        style={{
                          color: colors.warmGray,
                          fontFamily: "DMSans_400Regular",
                        }}
                      >
                        Total Amount
                      </span>
                      <span
                        className="mt-[2px] block text-[15px]"
                        style={{
                          color: colors.ink,
                          fontFamily: "DMSans_700Bold",
                        }}
                      >
                        {APP_CURRENCY}
                        {(order.payableAmount || 0).toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="flex flex-row items-center gap-1">
                      <span
                        className="text-[11px] tracking-[1px]"
                        style={{
                          color: colors.gold,
                          fontFamily: "DMSans_600SemiBold",
                        }}
                      >
                        VIEW DETAILS
                      </span>
                      <ChevronRight size={14} color={colors.gold} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center px-6 py-20">
            <div
              className="mb-5 flex h-[76px] w-[76px] items-center justify-center rounded-full border"
              style={{
                backgroundColor: colors.champagne,
                borderColor: colors.gold,
              }}
            >
              <Gift size={32} color={colors.gold} />
            </div>
            <h2
              className="mb-2 text-[22px] tracking-[0.5px]"
              style={{
                color: colors.ink,
                fontFamily: "CormorantGaramond_600SemiBold",
              }}
            >
              No Jewellery Orders Yet
            </h2>
            <p
              className="mb-7 text-center text-[13px] leading-5"
              style={{
                color: colors.warmGray,
                fontFamily: "DMSans_400Regular",
              }}
            >
              Explore our handcrafted collections and acquire your first signature piece.
            </p>
            <button
              type="button"
              onClick={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                replaceTo(navigate, "/jewelery/(tabs)/collections" as any);
              }}
              className="flex cursor-pointer flex-row items-center justify-center gap-2 rounded-[2px] px-6 py-[14px]"
              style={{ backgroundColor: colors.gold }}
            >
              <span
                className="text-[12px] tracking-[1.2px]"
                style={{
                  color: colors.onBrand,
                  fontFamily: "DMSans_600SemiBold",
                }}
              >
                EXPLORE COLLECTIONS
              </span>
              <ArrowRight size={14} color={colors.onBrand} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
