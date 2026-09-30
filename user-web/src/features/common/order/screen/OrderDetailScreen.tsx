import React, { useEffect, useState, useMemo } from "react";

import { useNavigate } from "react-router-dom";
import { goTo, replaceTo, useRouteParams } from "@/src/utils/navigation";
import { ArrowLeft, Banknote, Bike, Check, ChevronDown, ChevronRight, ChevronUp, CircleHelp, Copy, CreditCard, Info, MapPin, PackageMinus, Phone, Send, ShieldCheck, ShoppingBag, Store, Trophy } from "lucide-react";
import dayjs from "dayjs";
import * as Haptics from "@/lib/haptics";

import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { SUPPORT_CALL_NUMBER } from "@/src/constants";
import { goBack } from "@/src/utils/navigation";
import { getOrderByIdRequest } from "../api/order.api";
import { useSocketStore } from "@/src/store/useSocketStore";
import { SocketEvents } from "@/src/constants/socketEvents";
import { filterOrderItemsByModule } from "../lib/orderModule";
import { cn } from "@/src/lib/utils";

const ORDER_STEP_STAGES = [
  { key: "CONFIRMED", label: "Order Placed", shortLabel: "Confirmed" },
  { key: "PROCESSING", label: "Processing / Packed", shortLabel: "Packed" },
  { key: "IN_TRANSIT", label: "Out for Delivery", shortLabel: "In Transit" },
  { key: "DELIVERED", label: "Delivered", shortLabel: "Delivered" },
];

/**
 * Bulletproof helper to extract valid image URL from any product/item structure.
 */
const extractProductImageUrl = (item: any): string | null => {
  if (!item) return null;

  // 1. Direct string image on item
  if (typeof item.image === "string" && item.image.trim().startsWith("http")) {
    return item.image.trim();
  }
  if (typeof item.imageUrl === "string" && item.imageUrl.trim().startsWith("http")) {
    return item.imageUrl.trim();
  }

  // 2. Direct object on item.image
  if (item.image && typeof item.image === "object" && typeof item.image.url === "string") {
    return item.image.url.trim();
  }

  // 3. Populated productId object
  const prod = item.productId || item.product;
  if (prod && typeof prod === "object") {
    if (Array.isArray(prod.images) && prod.images.length > 0) {
      for (const img of prod.images) {
        if (typeof img === "string" && img.trim().startsWith("http")) {
          return img.trim();
        }
        if (img && typeof img === "object" && typeof img.url === "string" && img.url.trim().startsWith("http")) {
          return img.url.trim();
        }
      }
    }
    if (typeof prod.image === "string" && prod.image.trim().startsWith("http")) return prod.image.trim();
    if (typeof prod.thumbnail === "string" && prod.thumbnail.trim().startsWith("http")) return prod.thumbnail.trim();
    if (typeof prod.mainImage === "string" && prod.mainImage.trim().startsWith("http")) return prod.mainImage.trim();
  }

  // 4. Any generic non-empty image string
  if (typeof item.image === "string" && item.image.trim().length > 0) {
    return item.image.trim();
  }

  return null;
};

export default function OrderDetailScreen() {
  const theme = useTheme() as any;
  const navigate = useNavigate();
  const params = useRouteParams();
  const orderId = String(params.id || params.orderId || "");

  const [order, setOrder] = useState<any>(null);
  const [selectedSubOrderIndex, setSelectedSubOrderIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Accordion UI State toggles (Collapsed by default as requested)
  const [isTimelineExpanded, setIsTimelineExpanded] = useState<boolean>(false);
  const [isPriceDetailsExpanded, setIsPriceDetailsExpanded] = useState<boolean>(false);
  const [isFeesExpanded, setIsFeesExpanded] = useState<boolean>(false);
  const [isDiscountExpanded, setIsDiscountExpanded] = useState<boolean>(false);

  const socket = useSocketStore((state) => state.socket);
  const isConnected = useSocketStore((state) => state.isConnected);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
      useSocketStore.getState().connect();
    }
  }, [orderId]);

  // Real-time socket updates & room subscriptions
  useEffect(() => {
    if (!socket || !isConnected || !orderId) return;

    // Join order room
    socket.emit(SocketEvents.JOIN_ORDER_ROOM, orderId);

    // Also join sub-order rooms if they exist
    if (order?.subOrders && Array.isArray(order.subOrders)) {
      order.subOrders.forEach((sub: any) => {
        if (sub.subOrderId) {
          socket.emit("join_suborder_room", sub.subOrderId);
        }
      });
    }

    const handleUpdate = (data: any) => {
      console.log("[OrderDetailScreen] Live Order event received:", data);
      fetchOrderDetails(false);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    };

    socket.on(SocketEvents.ORDER_STATUS_UPDATE, handleUpdate);
    socket.on(SocketEvents.FULFILLMENT_EVENT, handleUpdate);
    socket.on("delivery_status_updated", handleUpdate);
    socket.on("suborder_status_updated", handleUpdate);
    socket.on("order_updated", handleUpdate);

    return () => {
      socket.emit(SocketEvents.LEAVE_ORDER_ROOM, orderId);
      if (order?.subOrders && Array.isArray(order.subOrders)) {
        order.subOrders.forEach((sub: any) => {
          if (sub.subOrderId) {
            socket.emit("leave_suborder_room", sub.subOrderId);
          }
        });
      }
      socket.off(SocketEvents.ORDER_STATUS_UPDATE, handleUpdate);
      socket.off(SocketEvents.FULFILLMENT_EVENT, handleUpdate);
      socket.off("delivery_status_updated", handleUpdate);
      socket.off("suborder_status_updated", handleUpdate);
      socket.off("order_updated", handleUpdate);
    };
  }, [orderId, socket, isConnected, order?.subOrders]);

  // Active status smart polling fallback (every 10s if active)
  useEffect(() => {
    const isFinished = ["DELIVERED", "CANCELLED", "REJECTED", "REFUNDED"].includes(
      order?.status || ""
    );

    if (isFinished || !orderId) return;

    const pollInterval = setInterval(() => {
      fetchOrderDetails(false);
    }, 10000);

    return () => clearInterval(pollInterval);
  }, [orderId, order?.status]);

  const fetchOrderDetails = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      const res = await getOrderByIdRequest(orderId);
      const data = res?.data || res;
      setOrder(data);
    } catch (err: any) {
      console.error("[OrderDetailScreen] Fetch error:", err);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  // If a jewelery order was opened on the clothing order detail route,
  // seamlessly redirect to the dedicated jewelery order detail screen.
  useEffect(() => {
    if (order && order.orderId) {
      const isJeweleryOrder =
        String(order.module || "").toLowerCase() === "jewelery" ||
        String(order.module || "").toLowerCase() === "jewellery" ||
        String(order.vertical || "").toLowerCase() === "jewelery" ||
        String(order.vertical || "").toLowerCase() === "jewellery" ||
        order.items?.some((i: any) => {
          const p = typeof i.productId === "object" ? i.productId : null;
          const v = String(i.vertical || p?.vertical || "").toLowerCase();
          const m = String(i.module || p?.module || "").toLowerCase();
          return (
            v === "jewelery" ||
            v === "jewellery" ||
            m === "jewelery" ||
            m === "jewellery" ||
            Boolean(i.jeweleryDetails) ||
            Boolean(p?.jeweleryDetails)
          );
        });

      if (isJeweleryOrder) {
        replaceTo(navigate, {
          pathname: "/jewelery/orders/[id]" as any,
          params: { id: order.orderId },
        });
      }
    }
  }, [order, navigate]);

  const subOrders = useMemo(() => {
    return (order?.subOrders && order.subOrders.length > 0)
      ? order.subOrders
      : [order];
  }, [order]);

  const currentSubOrder = useMemo(() => {
    if (!subOrders || subOrders.length === 0) return order;
    return subOrders[selectedSubOrderIndex] || subOrders[0] || order;
  }, [subOrders, selectedSubOrderIndex, order]);

  // Delivery OTP extraction
  const deliveryOtp = useMemo(() => {
    if (currentSubOrder?.delivery?.deliveryOtp) {
      return String(currentSubOrder.delivery.deliveryOtp);
    }
    if (order?.delivery?.otp?.code) {
      return String(order.delivery.otp.code);
    }
    if (order?.deliveryOtp) {
      return String(order.deliveryOtp);
    }
    return null;
  }, [currentSubOrder, order]);

  // Phase 9 — pickup OTP (rider shares it with the seller at store pickup).
  // Generated up front when the sub-order is created (finalizePendingConfirmation).
  const pickupOtp = useMemo(() => {
    if (currentSubOrder?.delivery?.pickupOtp) {
      return String(currentSubOrder.delivery.pickupOtp);
    }
    return null;
  }, [currentSubOrder]);

  // Determine current active step index for progress bar
  const currentStatus = (currentSubOrder?.status || order?.status || "CONFIRMED").toUpperCase();

  const activeStepIndex = useMemo(() => {
    switch (currentStatus) {
      case "PENDING":
      case "PENDING_PAYMENT":
      case "CONFIRMED":
        return 0;
      case "PROCESSING":
      case "PACKED":
      case "READY_FOR_PICKUP":
      case "RIDER_ASSIGNED":
      case "RIDER_ARRIVING":
      case "RIDER_REACHED_STORE":
      case "PICKED_UP":
        return 1;
      case "IN_TRANSIT":
      case "NEAR_CUSTOMER":
      case "OUT_FOR_DELIVERY":
        return 2;
      case "DELIVERED":
      case "DELIVERY_CONFIRMED":
      case "COMPLETED":
        return 3;
      case "CANCELLED":
      case "REJECTED":
      case "REFUNDED":
        return -1;
      default:
        return 0;
    }
  }, [currentStatus]);

  const handleCopyOrderId = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (order?.orderId && typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(String(order.orderId)).catch(() => {});
    }
  };

  const handleShare = async () => {
    if (!order) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const itemsText = (order.items || [])
        .map((i: any) => `• ${i.title} (x${i.quantity}) - ₹${i.price * i.quantity}`)
        .join("\n");

      const title = `Order Details - #${order.orderId}`;
      const message =
        `📦 *Quick Bihar Order Details*\n\n` +
        `*Order ID:* #${order.orderId}\n` +
        `*Status:* ${currentStatus.replace(/_/g, " ")}\n` +
        `${deliveryOtp ? `*Delivery OTP:* ${deliveryOtp}\n` : ""}` +
        `*Total Amount:* ₹${order.payableAmount || order.totalAmount}\n\n` +
        `*Items:*\n${itemsText}\n\n` +
        `_Track and manage your order on Quick Bihar!_`;

      if (typeof navigator !== "undefined" && (navigator as any).share) {
        await (navigator as any).share({ title, text: message });
      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(message);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleHelp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      window.open(`tel:${SUPPORT_CALL_NUMBER}`, "_self");
    } catch {
      // Haptic-only fallback — dialer failures are rare and the Help
      // button itself already signals the tap.
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleCallRider = (phone?: string) => {
    if (!phone) return;
    window.open(`tel:${phone}`, "_self");
  };

  const handleNavigateToProduct = (item: any) => {
    const prod =
      item.productId && typeof item.productId === "object"
        ? item.productId
        : null;
    const prodId = prod?.slug || prod?._id || item.productId || item._id;
    if (prodId && typeof prodId === "string") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // Jewelery lines open the jewelery detail screen — the clothing
      // detail screen can't render jewelery products.
      const vertical = prod?.vertical || item.vertical;
      const isJewelery =
        vertical === "JEWELERY" ||
        String(vertical || "").toLowerCase() === "jewelery" ||
        String(vertical || "").toLowerCase() === "jewellery" ||
        item.module === "jewelery" ||
        item.module === "jewellery" ||
        prod?.module === "jewelery" ||
        prod?.module === "jewellery" ||
        Boolean(prod?.jeweleryDetails) ||
        Boolean(item.jeweleryDetails) ||
        order?.module === "jewelery" ||
        order?.vertical === "JEWELERY" ||
        String(order?.module || "").toLowerCase() === "jewelery" ||
        String(order?.vertical || "").toLowerCase() === "jewelery";

      if (isJewelery) {
        const rawId = prod?._id || prodId || item.productId;
        const jeweleryId =
          typeof rawId === "object" ? rawId?._id : rawId;
        if (jeweleryId) {
          goTo(navigate, {
            pathname: "/jewelery/product/[id]" as any,
            params: { id: String(jeweleryId) },
          });
          return;
        }
      }
      goTo(navigate, {
        pathname: "/product/[id]" as any,
        params: { id: prodId },
      });
    }
  };

  if (isLoading && !order) {
    return (
      <div className="flex min-h-screen flex-col" style={{ backgroundColor: theme.background }}>
        <div
          className="flex flex-row items-center justify-between border-b px-4 py-4"
          style={{ backgroundColor: theme.background, borderBottomColor: theme.border }}
        >
          <button
            type="button"
            onClick={() => goBack(navigate, "/account/orders")}
            className="flex h-10 w-10 items-center justify-center rounded-xl border"
            style={{
              backgroundColor: theme.tertiaryBackground,
              borderColor: theme.border,
            }}
            aria-label="Go back"
          >
            <ArrowLeft size={22} color={theme.text} />
          </button>
          <h2 className="text-xl font-extrabold tracking-[-0.3px]" style={{ color: theme.text }}>
            Order Details
          </h2>
          <div className="w-10" />
        </div>
        <div
          className="flex flex-1 flex-col items-center justify-center"
          style={{ backgroundColor: theme.background }}
        >
          <span
            className="h-8 w-8 animate-spin rounded-full border-[3px] border-t-transparent"
            style={{ borderColor: `${theme.primary}44`, borderTopColor: theme.primary }}
          />
          <p className="mt-3 text-sm" style={{ color: theme.secondaryText }}>
            Fetching order details...
          </p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-screen flex-col" style={{ backgroundColor: theme.background }}>
        <div
          className="flex flex-row items-center justify-between border-b px-4 py-4"
          style={{ backgroundColor: theme.background, borderBottomColor: theme.border }}
        >
          <button
            type="button"
            onClick={() => goBack(navigate, "/account/orders")}
            className="flex h-10 w-10 items-center justify-center rounded-xl border"
            style={{
              backgroundColor: theme.tertiaryBackground,
              borderColor: theme.border,
            }}
            aria-label="Go back"
          >
            <ArrowLeft size={22} color={theme.text} />
          </button>
          <h2 className="text-xl font-extrabold tracking-[-0.3px]" style={{ color: theme.text }}>
            Order Details
          </h2>
          <div className="w-10" />
        </div>
        <div
          className="flex flex-1 flex-col items-center justify-center p-8"
          style={{ backgroundColor: theme.background }}
        >
          <PackageMinus size={56} color={theme.secondaryText} />
          <p className="mt-3 text-lg font-bold" style={{ color: theme.text }}>
            Order not found
          </p>
          <p className="mt-1.5 mb-5 text-center text-sm" style={{ color: theme.secondaryText }}>
            We couldn&apos;t retrieve details for order #{orderId}.
          </p>
          <button
            type="button"
            onClick={() => fetchOrderDetails(true)}
            className="rounded-xl px-6 py-3"
            style={{ backgroundColor: theme.primary }}
          >
            <span className="text-sm font-bold text-white">Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  const itemsToDisplay = filterOrderItemsByModule(
    currentSubOrder?.items || order?.items || [],
    "clothing",
  );
  const assignedRider = currentSubOrder?.delivery?.riderId || order?.delivery?.partnerUserId;
  const isCod = order?.paymentInfo?.razorpayOrderId === "COD" || currentSubOrder?.packageDetails?.isCod;
  const totalItemCount = itemsToDisplay.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0);

  const isActivelyDelivering = [
    "PICKED_UP",
    "IN_TRANSIT",
    "NEAR_CUSTOMER",
    "OUT_FOR_DELIVERY",
    "RIDER_ASSIGNED",
    "RIDER_ARRIVING",
  ].includes(currentStatus);
  const isOrderFinished = [
    "DELIVERED",
    "DELIVERY_CONFIRMED",
    "COMPLETED",
    "CANCELLED",
    "REJECTED",
    "REFUNDED",
  ].includes(currentStatus);
  const canShowRiderContact = isActivelyDelivering && !isOrderFinished && Boolean(assignedRider?.phone);

  // Status subtitle copy
  const getStatusSubtitle = () => {
    switch (currentStatus) {
      case "CONFIRMED":
        return `Order confirmed on ${dayjs(order.createdAt).format("ddd, DD MMM 'YY")}. Store is preparing your package.`;
      case "PROCESSING":
      case "PACKED":
        return "Your items have been packed by the store and are ready for pickup.";
      case "RIDER_ASSIGNED":
      case "RIDER_ARRIVING":
        return "Delivery partner assigned. Heading to the store for pickup.";
      case "PICKED_UP":
      case "IN_TRANSIT":
      case "NEAR_CUSTOMER":
      case "OUT_FOR_DELIVERY":
        return "Your order is on the way! Delivery partner is approaching your destination.";
      case "DELIVERED":
      case "COMPLETED":
        return `Delivered successfully on ${dayjs(order.updatedAt || order.createdAt).format("ddd, DD MMM 'YY - hh:mm A")}.`;
      case "CANCELLED":
        return "This order was cancelled.";
      default:
        return "Order is being processed.";
    }
  };

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: theme.background }}>
      {/* Top Header */}
      <div
        className="flex flex-row items-center justify-between border-b px-4 py-4"
        style={{ backgroundColor: theme.background, borderBottomColor: theme.border }}
      >
        <div className="flex flex-row items-center gap-3">
          <button
            type="button"
            onClick={() => goBack(navigate, "/account/orders")}
            className="flex h-10 w-10 items-center justify-center rounded-xl border"
            style={{
              backgroundColor: theme.tertiaryBackground,
              borderColor: theme.border,
            }}
            aria-label="Go back"
          >
            <ArrowLeft size={22} color={theme.text} />
          </button>
          <h2 className="text-xl font-extrabold tracking-[-0.3px]" style={{ color: theme.text }}>
            Order Details
          </h2>
        </div>

        <div className="flex flex-row items-center gap-2">
          <button
            type="button"
            onClick={handleHelp}
            className="rounded-full border px-3.5 py-[7px]"
            style={{
              backgroundColor: theme.tertiaryBackground,
              borderColor: theme.border,
            }}
          >
            <span className="text-[13px] font-bold" style={{ color: theme.text }}>Help</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="flex h-[38px] w-[38px] items-center justify-center rounded-full border"
            style={{
              backgroundColor: theme.tertiaryBackground,
              borderColor: theme.border,
            }}
            aria-label="Share order"
          >
            <Send size={17} color={theme.text} />
          </button>
        </div>
      </div>

      <div className="overflow-auto p-4" style={{ paddingBottom: 60 }}>
        {/* Order Meta & ID Row */}
        <div className="mb-3 flex flex-row items-center justify-between px-0.5">
          <button
            type="button"
            onClick={handleCopyOrderId}
            className="flex flex-row items-center gap-1.5"
          >
            <span className="text-sm font-semibold" style={{ color: theme.secondaryText }}>
              Order #{order.orderId}
            </span>
            <Copy size={15} color={theme.primary} />
          </button>
          <span className="text-xs" style={{ color: theme.tertiaryText }}>
            {dayjs(order.createdAt).format("DD MMM YYYY, hh:mm A")}
          </span>
        </div>

        {/* Multi-SubOrder / Multi-Store Package Tabs */}
        {subOrders.length > 1 && (
          <div className="mb-3">
            <div className="mb-3.5 flex flex-row gap-2 overflow-x-auto">
              {subOrders.map((sub: any, idx: number) => {
                const isSelected = idx === selectedSubOrderIndex;
                const pkgItemCount = (sub.items || []).reduce((acc: number, it: any) => acc + (it.quantity || 1), 0);

                return (
                  <button
                    key={sub.subOrderId || idx}
                    type="button"
                    onClick={() => setSelectedSubOrderIndex(idx)}
                    className="mr-2 shrink-0 rounded-xl border px-3.5 py-2"
                    style={{
                      backgroundColor: isSelected ? theme.primary + "15" : theme.tertiaryBackground,
                      borderColor: isSelected ? theme.primary : theme.border,
                    }}
                  >
                    <span
                      className="text-[13px] font-semibold"
                      style={{
                        color: isSelected ? theme.primary : theme.secondaryText,
                        fontWeight: isSelected ? 700 : 600,
                      }}
                    >
                      📦 Package {idx + 1} ({pkgItemCount} {pkgItemCount === 1 ? "item" : "items"})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Items Section Header */}
        <div className="mt-1 mb-2.5 flex flex-row items-center justify-between">
          <h3 className="text-base font-extrabold tracking-[-0.2px]" style={{ color: theme.text }}>
            {subOrders.length > 1
              ? `Package ${selectedSubOrderIndex + 1} Items (${itemsToDisplay.length})`
              : `Ordered Items (${itemsToDisplay.length})`}
          </h3>
          <div
            className="rounded-full border px-2 py-[3px]"
            style={{
              backgroundColor: theme.tertiaryBackground,
              borderColor: theme.border,
            }}
          >
            <span className="text-xs font-bold" style={{ color: theme.primary }}>
              Total Qty: {totalItemCount}
            </span>
          </div>
        </div>

        {/* Product Items List (Handles multiple products with rich UX) */}
        {itemsToDisplay.map((item: any, idx: number) => {
          const imageUrl = extractProductImageUrl(item);
          const storeName = item.storeId?.name || currentSubOrder?.storeId?.name;

          return (
            <div
              key={item.sku || idx}
              className="mb-3 rounded-3xl border p-3.5"
              style={{
                backgroundColor: theme.background,
                borderColor: theme.border,
              }}
            >
              <div className="flex flex-row items-start gap-3.5">
                {/* Product Image Thumbnail */}
                <button
                  type="button"
                  onClick={() => handleNavigateToProduct(item)}
                  className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border"
                  style={{
                    backgroundColor: theme.tertiaryBackground,
                    borderColor: theme.border,
                  }}
                  aria-label="View product"
                >
                  {imageUrl ? (
                    <img src={imageUrl} alt={`${item.title || "Product"} - Shop Online in Bihar`} title={`${item.title || "Product"} | QuickBihar`} className="h-full w-full object-cover" loading="lazy" decoding="async" />
                  ) : (
                    <ShoppingBag size={32} color={theme.primary} />
                  )}
                </button>

                {/* Product Details */}
                <div className="flex-1">
                  <button type="button" onClick={() => handleNavigateToProduct(item)} className="text-left">
                    <p
                      className={cn("line-clamp-2 text-[15px] leading-5 font-bold")}
                      style={{ color: theme.text }}
                    >
                      {item.title}
                    </p>
                  </button>

                  {/* Visual Chips Row for Size, Color, SKU */}
                  <div className="mt-1.5 flex flex-row flex-wrap items-center gap-1.5">
                    {item.color && (
                      <div
                        className="rounded-lg border px-[7px] py-[2.5px]"
                        style={{
                          backgroundColor: theme.tertiaryBackground,
                          borderColor: theme.border,
                        }}
                      >
                        <span className="text-[11px] font-semibold" style={{ color: theme.secondaryText }}>
                          Color: {item.color}
                        </span>
                      </div>
                    )}
                    {item.size && (
                      <div
                        className="rounded-lg border px-[7px] py-[2.5px]"
                        style={{
                          backgroundColor: theme.tertiaryBackground,
                          borderColor: theme.border,
                        }}
                      >
                        <span className="text-[11px] font-semibold" style={{ color: theme.secondaryText }}>
                          Size: {item.size}
                        </span>
                      </div>
                    )}
                    <div
                      className="rounded-lg border px-[7px] py-[2.5px]"
                      style={{
                        backgroundColor: theme.tertiaryBackground,
                        borderColor: theme.border,
                      }}
                    >
                      <span className="text-[11px] font-semibold" style={{ color: theme.secondaryText }}>
                        Qty: {item.quantity || 1}
                      </span>
                    </div>
                  </div>

                  {/* Price & Unit Breakdown */}
                  <div className="mt-2 flex flex-row items-center justify-between">
                    <span className="text-[15px] font-black" style={{ color: theme.text }}>
                      ₹{item.price * (item.quantity || 1)}
                    </span>
                    {(item.quantity || 1) > 1 && (
                      <span className="text-xs font-medium" style={{ color: theme.secondaryText }}>
                        (₹{item.price} each)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Product Card Footer (Store & View Product link) */}
              <div
                className="mt-2.5 flex flex-row items-center justify-between border-t pt-2"
                style={{ borderTopColor: theme.border }}
              >
                <div className="flex flex-row items-center gap-1">
                  <Store size={13} color={theme.tertiaryText} />
                  <span className="text-[11px]" style={{ color: theme.tertiaryText }}>
                    {storeName ? `Sold by: ${storeName}` : "Quick Bihar Fulfilled"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleNavigateToProduct(item)}
                  className="flex flex-row items-center gap-0.5"
                >
                  <span className="text-xs font-bold" style={{ color: theme.primary }}>View Item</span>
                  <ChevronRight size={14} color={theme.primary} />
                </button>
              </div>
            </div>
          );
        })}

        {/* Phase 9 — Prominent Delivery + Pickup OTP card.
            Generated up front when the sub-order is created; NOT sent via SMS.
            The customer shows the delivery OTP to the rider on arrival. */}
        {(deliveryOtp || pickupOtp) &&
          currentStatus !== "DELIVERED" &&
          currentStatus !== "CANCELLED" && (
            <div
              className="mb-4 rounded-3xl border-[1.5px] p-4"
              style={{
                backgroundColor: "#f0fdf4",
                borderColor: "#86efac",
              }}
            >
              <div className="mb-2.5 flex flex-row items-center justify-between">
                <div className="flex flex-row items-center gap-1.5">
                  <ShieldCheck size={18} color="#15803d" />
                  <span className="text-[15px] font-extrabold" style={{ color: "#15803d" }}>
                    Verification OTPs
                  </span>
                </div>
                <div className="rounded-full bg-[#bbf7d0] px-2 py-[3px]">
                  <span className="text-[11px] font-bold" style={{ color: "#166534" }}>
                    Show to delivery person
                  </span>
                </div>
              </div>

              {deliveryOtp && (
                <div className="mb-3">
                  <p className="mb-1.5 text-xs font-bold" style={{ color: "#0f172a", marginTop: 0 }}>
                    Delivery OTP (for delivery at your door)
                  </p>
                  <div className="my-1.5 flex flex-row items-center justify-center gap-2">
                    {deliveryOtp.split("").map((digit: string, i: number) => (
                      <div
                        key={i}
                        className="flex h-12 w-[42px] items-center justify-center rounded-xl border-[1.5px] bg-white"
                        style={{ borderColor: "#4ade80" }}
                      >
                        <span className="text-[22px] font-black" style={{ color: "#15803d" }}>
                          {digit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pickupOtp && (
                <div>
                  <p className="mb-1.5 text-xs font-bold" style={{ color: "#0f172a", marginTop: 0 }}>
                    Pickup OTP (rider uses at the store)
                  </p>
                  <div className="my-1.5 flex flex-row items-center justify-center gap-2">
                    {pickupOtp.split("").map((digit: string, i: number) => (
                      <div
                        key={i}
                        className="flex h-12 w-[42px] items-center justify-center rounded-xl border-[1.5px] bg-white"
                        style={{ borderColor: "#4ade80" }}
                      >
                        <span className="text-[22px] font-black" style={{ color: "#15803d" }}>
                          {digit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="mt-3 text-center text-xs leading-4" style={{ color: "#64748b" }}>
                {deliveryOtp
                  ? "Share the delivery OTP only when the rider arrives at your door with your package."
                  : "The seller will share the delivery OTP with you on their confirmation call."}
              </p>
            </div>
          )}

        {/* Order Status & Progress Card */}
        <div
          className="mb-4 rounded-3xl border p-4"
          style={{
            backgroundColor: theme.background,
            borderColor: theme.border,
          }}
        >
          <button
            type="button"
            onClick={() => setIsTimelineExpanded(!isTimelineExpanded)}
            className="flex w-full flex-row items-center justify-between text-left"
          >
            <div className="flex-1">
              <p className="text-lg font-extrabold tracking-[-0.3px]" style={{ color: theme.text }}>
                {currentStatus.replace(/_/g, " ")}
              </p>
              <p className="mt-1.5 text-sm leading-5" style={{ color: theme.secondaryText }}>
                {getStatusSubtitle()}
              </p>
            </div>
            {isTimelineExpanded ? (
              <ChevronUp size={20} color={theme.secondaryText} className="ml-2 shrink-0" />
            ) : (
              <ChevronDown size={20} color={theme.secondaryText} className="ml-2 shrink-0" />
            )}
          </button>

          {/* Horizontal Stepper (Compact Mode) */}
          {!isTimelineExpanded && activeStepIndex >= 0 && (
            <div className="my-[18px]">
              <div className="relative flex flex-row items-center justify-between">
                {ORDER_STEP_STAGES.map((stage, idx) => {
                  const isCompleted = idx <= activeStepIndex;
                  const isCurrent = idx === activeStepIndex;

                  return (
                    <React.Fragment key={stage.key}>
                      <div className="z-[2] flex items-center">
                        <div
                          className="flex h-7 w-7 items-center justify-center rounded-full border-2"
                          style={{
                            backgroundColor: isCompleted ? "#10b981" : theme.tertiaryBackground,
                            borderColor: isCurrent ? "#a7f3d0" : isCompleted ? "#10b981" : theme.border,
                            borderWidth: isCurrent ? 4 : 2,
                          }}
                        >
                          {isCompleted ? (
                            <Check size={14} color="#ffffff" />
                          ) : null}
                        </div>
                      </div>
                      {idx < ORDER_STEP_STAGES.length - 1 && (
                        <div
                          className="z-[1] -mx-1 h-[3px] flex-1"
                          style={{
                            backgroundColor: idx < activeStepIndex ? "#10b981" : theme.border,
                          }}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              <div className="mt-2.5 flex flex-row justify-between">
                {ORDER_STEP_STAGES.map((stage, idx) => (
                  <div key={stage.key} className="flex flex-col items-center">
                    <span
                      className={cn("line-clamp-1 w-20 text-center text-xs font-semibold")}
                      style={{
                        color: idx <= activeStepIndex ? theme.text : theme.secondaryText,
                        fontWeight: idx <= activeStepIndex ? 700 : 600,
                      }}
                    >
                      {stage.shortLabel}
                    </span>
                    <span className="mt-0.5 text-center text-[11px]" style={{ color: theme.tertiaryText }}>
                      {idx === 0
                        ? "Today"
                        : idx === activeStepIndex
                        ? "Active"
                        : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vertical Detailed Timeline (Expanded Mode) */}
          {isTimelineExpanded && (
            <div className="mt-4 pl-1">
              {ORDER_STEP_STAGES.map((stage, idx) => {
                const isPassed = idx <= activeStepIndex;
                const isCurrent = idx === activeStepIndex;
                const isLast = idx === ORDER_STEP_STAGES.length - 1;

                return (
                  <div
                    key={stage.key}
                    className="relative flex flex-row"
                    style={{ paddingBottom: isLast ? 0 : 22 }}
                  >
                    {!isLast && (
                      <div
                        className="absolute bottom-0 top-6 w-0.5"
                        style={{
                          left: 11,
                          backgroundColor: idx < activeStepIndex ? "#10b981" : theme.border,
                        }}
                      />
                    )}

                    <div
                      className="z-[2] mr-3.5 flex h-6 w-6 items-center justify-center rounded-full border-2"
                      style={{
                        backgroundColor: isPassed ? "#10b981" : theme.tertiaryBackground,
                        borderColor: isCurrent ? "#bbf7d0" : isPassed ? "#10b981" : theme.border,
                        borderWidth: isCurrent ? 3 : 2,
                      }}
                    >
                      {isPassed && (
                        <Check size={12} color="#ffffff" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-row items-center justify-between">
                        <span
                          className="text-sm font-bold"
                          style={{ color: theme.text }}
                        >
                          {stage.label}
                        </span>
                        {isCurrent && (
                          <span className="text-xs" style={{ color: theme.tertiaryText }}>
                            {dayjs(order.updatedAt || order.createdAt).format("hh:mm A")}
                          </span>
                        )}
                      </div>
                      <p className="mt-[3px] text-[13px] leading-[18px]" style={{ color: theme.secondaryText }}>
                        {idx === 0
                          ? `Order payment verified and order created.`
                          : idx === 1
                          ? `Seller confirmed & package ready for handover.`
                          : idx === 2
                          ? `Rider is on the way to delivery address.`
                          : `Package handed over with OTP verification.`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Rider / Delivery Partner Card (ONLY shown when actively out for delivery, and hidden when completed/delivered) */}
          {isActivelyDelivering && assignedRider ? (
            <div
              className="mt-3 flex flex-row items-center justify-between rounded-xl border p-3"
              style={{
                backgroundColor: theme.tertiaryBackground,
                borderColor: theme.border,
              }}
            >
              <div className="flex flex-1 flex-row items-center gap-2.5">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: theme.primary + "20" }}
                >
                  <Bike size={22} color={theme.primary} />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: theme.text }}>
                    {assignedRider.fullName || "Delivery Partner"}
                  </p>
                  <p className="text-xs" style={{ color: theme.secondaryText }}>
                    {currentSubOrder?.delivery?.status?.replace(/_/g, " ") || "Out for Delivery"}
                  </p>
                </div>
              </div>

              {canShowRiderContact && (
                <button
                  type="button"
                  onClick={() => handleCallRider(assignedRider.phone)}
                  className="flex h-9 w-9 items-center justify-center rounded-full"
                  style={{ backgroundColor: "#10b981" }}
                  aria-label="Call rider"
                >
                  <Phone size={16} color="#ffffff" />
                </button>
              )}
            </div>
          ) : isOrderFinished ? null : (
            <div
              className="mt-3 flex flex-row items-center gap-2.5 rounded-xl p-3"
              style={{ backgroundColor: theme.tertiaryBackground }}
            >
              <Info size={18} color={theme.secondaryText} className="shrink-0" />
              <p className="flex-1 text-[13px] leading-[18px]" style={{ color: theme.secondaryText }}>
                Delivery partner details will be available once the order is out for delivery.
              </p>
            </div>
          )}
        </div>

        {/* Shipping Address Card */}
        {order.shippingAddress && (
          <div
            className="mb-4 rounded-3xl border p-4"
            style={{
              backgroundColor: theme.background,
              borderColor: theme.border,
            }}
          >
            <div className="flex flex-row items-center justify-between">
              <h3 className="text-[17px] font-extrabold tracking-[-0.2px]" style={{ color: theme.text }}>
                Delivery Address
              </h3>
              <MapPin size={20} color={theme.primary} />
            </div>

            <p className="mt-2.5 text-[15px] font-bold" style={{ color: theme.text }}>
              {order.shippingAddress.fullName}
            </p>
            {order.shippingAddress.phone && (
              <p className="mt-0.5 text-[13px]" style={{ color: theme.secondaryText }}>
                +91 {order.shippingAddress.phone}
              </p>
            )}
            <p className="mt-1.5 text-[13px] leading-[19px]" style={{ color: theme.secondaryText }}>
              {[
                order.shippingAddress.street,
                order.shippingAddress.landmark,
                order.shippingAddress.city,
                order.shippingAddress.state,
                order.shippingAddress.pincode,
              ]
                .filter(Boolean)
                .join(", ")}
            </p>
          </div>
        )}

        {/* Price Details Card (Collapsed by default, tap to expand) */}
        <div
          className="mb-4 rounded-3xl border p-4"
          style={{
            backgroundColor: theme.background,
            borderColor: theme.border,
          }}
        >
          <button
            type="button"
            onClick={() => setIsPriceDetailsExpanded(!isPriceDetailsExpanded)}
            className="flex w-full flex-row items-center justify-between"
          >
            <h3 className="text-[17px] font-extrabold tracking-[-0.2px]" style={{ color: theme.text }}>
              Price details
            </h3>
            <div className="flex flex-row items-center gap-2">
              {!isPriceDetailsExpanded && (
                <span className="text-base font-extrabold" style={{ color: theme.text }}>
                  ₹{order.payableAmount || order.totalAmount}
                </span>
              )}
              {isPriceDetailsExpanded ? (
                <ChevronUp size={20} color={theme.secondaryText} />
              ) : (
                <ChevronDown size={20} color={theme.secondaryText} />
              )}
            </div>
          </button>

          {isPriceDetailsExpanded && (
            <div className="mt-3">
              {/* Listing price (MRP) */}
              <div className="flex flex-row items-center justify-between py-2">
                <span className="text-sm" style={{ color: theme.secondaryText }}>Listing price</span>
                <span className="text-sm font-semibold" style={{ color: theme.text }}>
                  ₹{order.mrpTotal || order.totalAmount}
                </span>
              </div>

              {/* Selling price */}
              <div className="flex flex-row items-center justify-between py-2">
                <span className="text-sm" style={{ color: theme.secondaryText }}>Selling price</span>
                <span className="text-sm font-semibold" style={{ color: theme.text }}>₹{order.totalAmount}</span>
              </div>

              {/* Total fees accordion */}
              <button
                type="button"
                onClick={() => setIsFeesExpanded(!isFeesExpanded)}
                className="flex w-full flex-row items-center justify-between py-2"
              >
                <div className="flex flex-row items-center gap-1">
                  <span className="text-sm" style={{ color: theme.secondaryText }}>Total fees</span>
                  {isFeesExpanded ? (
                    <ChevronUp size={14} color={theme.secondaryText} />
                  ) : (
                    <ChevronDown size={14} color={theme.secondaryText} />
                  )}
                </div>
                <span className="text-sm font-semibold" style={{ color: theme.text }}>
                  ₹{(order.shippingFee || 0) + (order.dynamicDeliverySurcharge || 0)}
                </span>
              </button>

              {isFeesExpanded && (
                <>
                  <div className="flex flex-row items-center justify-between py-[5px] pl-3">
                    <span className="text-[13px] underline decoration-dotted" style={{ color: theme.tertiaryText }}>
                      Delivery Fee
                    </span>
                    <span
                      className="text-[13px] font-medium"
                      style={{
                        color: order.shippingFee === 0 ? "#10b981" : theme.secondaryText,
                        fontWeight: order.shippingFee === 0 ? 700 : 500,
                      }}
                    >
                      {order.shippingFee === 0 ? "FREE" : `₹${order.shippingFee}`}
                    </span>
                  </div>

                  {order.dynamicDeliverySurcharge > 0 && (
                    <div className="flex flex-row items-center justify-between py-[5px] pl-3">
                      <span className="text-[13px] underline decoration-dotted" style={{ color: theme.tertiaryText }}>
                        Dynamic Delivery Surcharge
                      </span>
                      <span className="text-[13px] font-medium" style={{ color: theme.secondaryText }}>
                        ₹{order.dynamicDeliverySurcharge}
                      </span>
                    </div>
                  )}
                </>
              )}

              {/* Discounts accordion */}
              {(order.productDiscount > 0 || order.discountAmount > 0) && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsDiscountExpanded(!isDiscountExpanded)}
                    className="flex w-full flex-row items-center justify-between py-2"
                  >
                    <div className="flex flex-row items-center gap-1">
                      <span className="text-sm" style={{ color: theme.secondaryText }}>Other discount</span>
                      {isDiscountExpanded ? (
                        <ChevronUp size={14} color={theme.secondaryText} />
                      ) : (
                        <ChevronDown size={14} color={theme.secondaryText} />
                      )}
                    </div>
                    <span className="text-sm font-bold" style={{ color: "#10b981" }}>
                      -₹{(order.productDiscount || 0) + (order.discountAmount || 0)}
                    </span>
                  </button>

                  {isDiscountExpanded && (
                    <>
                      {order.productDiscount > 0 && (
                        <div className="flex flex-row items-center justify-between py-[5px] pl-3">
                          <span className="text-[13px] underline decoration-dotted" style={{ color: theme.tertiaryText }}>
                            Product Discount
                          </span>
                          <span className="text-[13px] font-bold" style={{ color: "#10b981" }}>
                            -₹{order.productDiscount}
                          </span>
                        </div>
                      )}

                      {order.discountAmount > 0 && (
                        <div className="flex flex-row items-center justify-between py-[5px] pl-3">
                          <span className="text-[13px] underline decoration-dotted" style={{ color: theme.tertiaryText }}>
                            Coupon ({order.couponCode || "Discount"})
                          </span>
                          <span className="text-[13px] font-bold" style={{ color: "#10b981" }}>
                            -₹{order.discountAmount}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              <div className="my-2.5 h-px border-t border-dashed" style={{ borderColor: theme.border }} />

              {/* Total Amount */}
              <div className="flex flex-row items-center justify-between py-1.5">
                <span className="text-base font-extrabold" style={{ color: theme.text }}>Total amount</span>
                <span className="text-lg font-black" style={{ color: theme.text }}>
                  ₹{order.payableAmount || order.totalAmount}
                </span>
              </div>

              {/* Paid By Box */}
              <div
                className="mt-3.5 flex flex-row items-center justify-between rounded-xl border p-3"
                style={{
                  backgroundColor: theme.tertiaryBackground,
                  borderColor: theme.border,
                }}
              >
                <div className="flex flex-row items-center gap-2.5">
                  {isCod ? (
                    <Banknote size={20} color={theme.text} />
                  ) : (
                    <CreditCard size={20} color={theme.text} />
                  )}
                  <span className="text-sm font-semibold" style={{ color: theme.text }}>
                    Paid By: {isCod ? "Cash on Delivery" : "Online (Razorpay)"}
                  </span>
                </div>

                <div className="rounded-lg bg-[#10b98115] px-2 py-[3px]">
                  <span className="text-[11px] font-bold" style={{ color: "#10b981" }}>
                    {isCod ? "COD" : "PAID"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Offers Earned Box */}
        {order.discountAmount > 0 && (
          <div
            className="mb-4 flex flex-row items-center justify-between rounded-3xl border p-3.5"
            style={{
              backgroundColor: theme.tertiaryBackground,
              borderColor: theme.border,
            }}
          >
            <div className="flex flex-row items-center gap-2.5">
              <Trophy size={20} color="#eab308" />
              <span className="text-sm font-bold" style={{ color: theme.text }}>
                Offers applied on this order
              </span>
            </div>
            <span className="text-sm font-bold" style={{ color: "#10b981" }}>
              Saved ₹{order.discountAmount}
            </span>
          </div>
        )}

        {/* Action Buttons (Shop more, Support) */}
        <div className="mt-2 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => replaceTo(navigate, "/(tabs)/clothing/home")}
            className="flex w-full flex-row items-center justify-center gap-2 rounded-xl py-3.5"
            style={{ backgroundColor: theme.primary }}
          >
            <ShoppingBag size={18} color="#ffffff" />
            <span className="text-[15px] font-bold text-white">Continue Shopping</span>
          </button>

          <button
            type="button"
            onClick={handleHelp}
            className="flex w-full flex-row items-center justify-center gap-2 rounded-xl border py-3.5"
            style={{
              backgroundColor: theme.tertiaryBackground,
              borderColor: theme.border,
            }}
          >
            <CircleHelp size={18} color={theme.text} />
            <span className="text-[15px] font-bold" style={{ color: theme.text }}>
              Need Help with this Order?
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
