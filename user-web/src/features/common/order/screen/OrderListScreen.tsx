import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { goBack, goTo, replaceTo } from "@/src/utils/navigation";
import { ChevronLeft, ChevronRight, Package, ShoppingBag } from "lucide-react";
import * as Haptics from "@/lib/haptics";
import { OrderCardSkeleton } from "../components/OrderCardSkeleton";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { getMyOrdersRequest } from "../api/order.api";
import { orderHasModule } from "../lib/orderModule";
import { socketClient } from "@/src/lib/socket";
import { SocketEvents } from "@/src/constants/socketEvents";
import dayjs from "dayjs";
import { cn } from "@/src/lib/utils";

const OrderListScreen = () => {
  const theme = useTheme() as any;
  const navigate = useNavigate();

  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrders();

    // Listen for status updates in real-time
    console.log(
      "[OrderListScreen] Socket connected:",
      socketClient.isConnected,
    );

    socketClient.on(SocketEvents.ORDER_STATUS_UPDATE, (data) => {
      console.log("[OrderListScreen] Received update event:", data);
      fetchOrders();
    });

    return () => {
      socketClient.off(SocketEvents.ORDER_STATUS_UPDATE);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const response = await getMyOrdersRequest();
      // Clothing catalogue shows clothing orders only — jewellery orders
      // live in the jewellery order history.
      setOrders((response.data || []).filter((o: any) => orderHasModule(o, "clothing")));
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING":
      case "PENDING_PAYMENT":
        return "#F59E0B";
      case "CONFIRMED":
      case "PROCESSING":
        return "#10B981";
      case "SHIPPED":
        return "#3B82F6";
      case "DELIVERED":
        return "#8B5CF6";
      case "CANCELLED":
      case "REJECTED":
        return "#EF4444";
      default:
        return theme.secondaryText;
    }
  };

  const renderOrderItem = (item: any) => {
    // Shared module check (vertical/module/jeweleryDetails aware).
    // The list itself is clothing-filtered; jewellery rows route to the
    // jewellery detail screen if they ever appear (e.g. deep links).
    const isJeweleryOrder =
      orderHasModule(item, "jewelery") && !orderHasModule(item, "clothing");

    return (
      <button
        key={item._id}
        type="button"
        onClick={() => {
          if (isJeweleryOrder) {
            goTo(navigate, {
              pathname: "/jewelery/orders/[id]" as any,
              params: { id: item.orderId },
            });
          } else {
            goTo(navigate, {
              pathname: "/order/[id]" as any,
              params: { id: item.orderId },
            });
          }
        }}
        className="mb-2.5 block w-full rounded-2xl border p-3.5 text-left"
        style={{
          backgroundColor: theme.tertiaryBackground,
          borderColor: theme.border,
        }}
      >
        <div className="mb-3 flex flex-row items-start justify-between gap-2">
          <div>
            <p
              className="text-[15px] font-extrabold tracking-[-0.3px]"
              style={{ color: theme.text }}
            >
              Order #{item.orderId}
            </p>
            <p
              className="mt-1 text-xs font-medium"
              style={{ color: theme.secondaryText }}
            >
              {dayjs(item.createdAt).format("DD MMM, YYYY")}
            </p>
          </div>
          <div
            className="rounded-lg px-2.5 py-[5px]"
            style={{ backgroundColor: getStatusColor(item.status) + "15" }}
          >
            <span
              className="text-[10px] font-extrabold tracking-[0.5px] uppercase"
              style={{ color: getStatusColor(item.status) }}
            >
              {item.status.replace("_", " ")}
            </span>
          </div>
        </div>

        <div
          className="mb-3 flex flex-row items-center gap-2.5 rounded-xl border p-2.5"
          style={{
            backgroundColor: theme.background,
            borderColor: theme.border,
          }}
        >
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl"
            style={{ backgroundColor: theme.secondaryBackground }}
          >
            <Package size={24} color={theme.primary} />
          </div>
          <p
            className={cn("ml-0.5 line-clamp-1 flex-1 text-[13px] font-semibold")}
            style={{ color: theme.secondaryText }}
          >
            {item.items.length} {item.items.length === 1 ? "item" : "items"} in
            this order
          </p>
          {item.items.length > 1 && (
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full"
              style={{ backgroundColor: theme.secondaryBackground }}
            >
              <span
                className="text-xs font-extrabold"
                style={{ color: theme.primary }}
              >
                +{item.items.length - 1}
              </span>
            </div>
          )}
        </div>

        <div
          className="flex flex-row items-center justify-between border-t pt-3"
          style={{ borderTopColor: theme.border }}
        >
          <div>
            <p
              className="text-[11px] font-bold tracking-[0.5px] uppercase"
              style={{ color: theme.secondaryText }}
            >
              Total Amount
            </p>
            <p
              className="mt-0.5 text-[17px] font-extrabold"
              style={{ color: theme.text }}
            >
              ₹{item.payableAmount.toLocaleString()}
            </p>
          </div>
          <div className="flex flex-row items-center">
            {/* {["CONFIRMED", "PROCESSING", "SHIPPED"].includes(item.status.toUpperCase()) && (
              <button ...>Track</button>
            )} */}
            <div
              className="flex h-9 flex-row items-center gap-1 rounded-full px-3.5"
              style={{ backgroundColor: theme.primary + "18" }}
            >
              <span
                className="text-xs font-extrabold tracking-[0.2px]"
                style={{ color: theme.primary }}
              >
                Details
              </span>
              <ChevronRight size={14} color={theme.primary} />
            </div>
          </div>
        </div>
      </button>
    );
  };

  const renderEmpty = () => (
    <div className="flex flex-1 flex-col items-center justify-center px-8 pb-10">
      <div
        className="mb-[18px] flex h-[110px] w-[110px] items-center justify-center rounded-full"
        style={{ backgroundColor: theme.primary + "15" }}
      >
        <ShoppingBag size={52} color={theme.primary} />
      </div>
      <p
        className="text-center text-xl font-extrabold tracking-[-0.3px]"
        style={{ color: theme.text }}
      >
        No Orders Yet
      </p>
      <p
        className="mt-2 max-w-[320px] text-center text-sm leading-5"
        style={{ color: theme.secondaryText }}
      >
        You haven&apos;t placed any orders yet. Start shopping to see them here!
      </p>
      <button
        type="button"
        onClick={() => replaceTo(navigate, "/(tabs)/clothing/home")}
        className="mt-5 flex h-12 items-center justify-center rounded-full px-6"
        style={{ backgroundColor: theme.primary }}
      >
        <span className="text-sm font-extrabold tracking-[0.3px] text-white">
          Explore Products
        </span>
      </button>
    </div>
  );

  const renderSkeletons = () => (
    <div className="overflow-auto px-4 pt-2 pb-8">
      {[0, 1, 2, 3].map((i) => (
        <OrderCardSkeleton key={i} />
      ))}
    </div>
  );

  return (
    <>
      <div
        className="flex min-h-screen flex-1 flex-col"
        style={{ backgroundColor: theme.background }}
      >
        {/* Top app bar (same language as Notifications) */}
        <div className="flex flex-row items-center gap-2 px-3 pt-2 pb-3">
          <button
            type="button"
            onClick={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
                () => null,
              );
              goBack(navigate, "/(tabs)/clothing/home");
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: theme.secondaryBackground }}
            aria-label="Go back"
          >
            <ChevronLeft size={22} color={theme.text} />
          </button>

          <div className="flex-1 px-1">
            <h2
              className="text-[22px] font-extrabold tracking-[-0.4px]"
              style={{ color: theme.text }}
            >
              My Orders
            </h2>
            <p
              className="mt-0.5 text-xs font-medium"
              style={{ color: theme.secondaryText }}
            >
              {orders.length > 0
                ? `${orders.length} order${orders.length === 1 ? "" : "s"}`
                : "Track and manage your orders"}
            </p>
          </div>

          <div className="w-10" />
        </div>

        {isLoading ? (
          renderSkeletons()
        ) : orders.length === 0 ? (
          renderEmpty()
        ) : (
          <div className="overflow-auto px-4 pt-2 pb-8">
            {orders.map((item) => renderOrderItem(item))}
          </div>
        )}
      </div>
    </>
  );
};

export default OrderListScreen;
