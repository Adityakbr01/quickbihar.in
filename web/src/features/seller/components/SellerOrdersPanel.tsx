import React, { useState } from "react";
import { ChevronDown, Copy, Package, Phone, PhoneCall, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useFulfillmentRealtime } from "@/hooks/useFulfillmentRealtime";
import type { SellerQueryParams } from "@/features/seller/api/sellerManagement.api";
import {
  useSellerSubOrders,
  useSellerSubOrderStatusMutation,
  useSellerSubOrderCancellationMutation,
  useSellerConfirmSubOrderMutation,
  useSellerDeclineSubOrderMutation,
} from "../hooks/useSellerManagement";
import { maskPhone } from "@/features/auth/utils/privacy";
import {
  ModuleCard,
  ListFilters,
  SimpleTable,
  StatusBadge,
  RowActions,
  PaginationBar,
  formatAmount,
  formatDate,
} from "./SellerHelpers";

function ItemsDropdownCell({ items }: { items: any[] }) {
  if (!items || items.length === 0) {
    return <span className="text-xs text-gray-500">No items</span>;
  }

  const totalQty = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const firstItem = items[0];

  return (
    <Popover>
      <PopoverTrigger
        type="button"
        className="group inline-flex max-w-[190px] items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-left text-xs text-gray-200 transition hover:border-indigo-400/40 hover:bg-white/10 hover:text-white cursor-pointer"
      >
        <Package className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
        <span className="truncate flex-1 font-medium">
          {firstItem.title}
        </span>
        {items.length > 1 ? (
          <span className="shrink-0 rounded bg-indigo-500/20 px-1 py-0.2 text-[10px] font-bold text-indigo-300">
            +{items.length - 1}
          </span>
        ) : (
          <span className="shrink-0 text-[11px] font-semibold text-gray-400">
            x{firstItem.quantity || 1}
          </span>
        )}
        <ChevronDown className="h-3 w-3 text-gray-400 transition-transform group-data-open:rotate-180 shrink-0" />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-80 border border-white/15 bg-[#18181b] p-3 text-white shadow-2xl rounded-xl z-50"
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-200">
            <Package className="h-3.5 w-3.5 text-indigo-400" />
            <span>Package Contents ({items.length} {items.length === 1 ? "Item" : "Items"})</span>
          </div>
          <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-gray-300">
            Total Qty: {totalQty}
          </span>
        </div>
        <div className="mt-2 divide-y divide-white/5 max-h-60 overflow-y-auto pr-1">
          {items.map((item: any, idx: number) => (
            <div key={idx} className="py-2.5 first:pt-1 last:pb-0 text-xs">
              <div className="font-semibold text-gray-100 line-clamp-2">
                {item.title}
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] text-gray-400">
                <span className="text-gray-400 truncate max-w-[170px]">
                  {[item.color, item.size, item.sku].filter(Boolean).join(" • ") || "Standard"}
                </span>
                <span className="shrink-0 font-bold text-emerald-400">
                  Qty: {item.quantity || 1} {item.price ? `(₹${item.price})` : ""}
                </span>
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function SellerOrdersPanel() {
  useFulfillmentRealtime();
  const [params, setParams] = useState<SellerQueryParams>({ page: 1, limit: 10 });
  const subOrdersQuery = useSellerSubOrders(params);
  const updateStatus = useSellerSubOrderStatusMutation();
  const processCancellation = useSellerSubOrderCancellationMutation();
  // Phase 9 — call-and-confirm mutations.
  const confirmSubOrder = useSellerConfirmSubOrderMutation();
  const declineSubOrder = useSellerDeclineSubOrderMutation();

  // State for Ready for Pickup modal
  const [selectedSubOrder, setSelectedSubOrder] = useState<any | null>(null);
  const [weight, setWeight] = useState<number>(500);
  const [packageCount, setPackageCount] = useState<number>(1);
  const [isFragile, setIsFragile] = useState<boolean>(false);
  const [pickupNotes, setPickupNotes] = useState<string>("");

  // Phase 9 — decline-modal state. The seller types a reason; the server
  // triggers a refund for online payments and marks the order REJECTED for COD.
  const [declineTarget, setDeclineTarget] = useState<any | null>(null);
  const [declineReason, setDeclineReason] = useState<string>("");

  const copyToClipboard = async (value?: string | null) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Older browsers / insecure context — fall back to a temporary input.
      const input = document.createElement("input");
      input.value = value;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
  };

  const handleOpenPickupModal = (subOrder: any) => {
    setSelectedSubOrder(subOrder);
    setWeight(500);
    setPackageCount(1);
    setIsFragile(false);
    setPickupNotes("");
  };

  const handleConfirmPickup = () => {
    if (!selectedSubOrder) return;
    updateStatus.mutate({
      subOrderId: selectedSubOrder._id,
      status: "READY_FOR_PICKUP",
      packageDetails: {
        weight,
        packageCount,
        isFragile,
        pickupNotes,
      },
    }, {
      onSuccess: () => {
        setSelectedSubOrder(null);
      }
    });
  };

  return (
    <ModuleCard
      title="Sub-Orders Fulfillment"
      filters={
        <ListFilters
          params={params}
          onChange={setParams}
          statusOptions={[
            "ALL",
            "PENDING_SELLER_CONFIRMATION",
            "CONFIRMED",
            "PROCESSING",
            "PACKED",
            "READY_FOR_PICKUP",
            "RIDER_ASSIGNED",
            "RIDER_ARRIVING",
            "RIDER_REACHED_STORE",
            "PICKED_UP",
            "IN_TRANSIT",
            "NEAR_CUSTOMER",
            "DELIVERED",
            "CANCELLED",
            "REJECTED",
            "SELLER_REJECTED",
          ]}
        />
      }
    >
      <SimpleTable
        empty={subOrdersQuery.isLoading ? "Loading sub-orders..." : "No sub-orders found."}
        columns={["Sub-Order", "Customer", "Items", "Amount", "Status", "Rider Assignment / Action"]}
        rows={(subOrdersQuery.data?.data || []).map((subOrder: any) => {
          const isCancelRequested = subOrder.timeline?.some(
            (event: any) => event.status === subOrder.status && event.actor === "CUSTOMER" && event.metadata?.message?.includes("requested cancellation")
          );

          return [
            <div key={`${subOrder._id}-id`}>
              <div className="font-semibold text-white">{subOrder.subOrderId}</div>
              <div className="text-xs text-gray-500">{formatDate(subOrder.createdAt)}</div>
              {subOrder.packageDetails?.isCod && (
                <span className="inline-block mt-1 px-1.5 py-0.5 text-[10px] font-bold bg-amber-500/10 text-amber-500 rounded border border-amber-500/20">
                  CASH ON DELIVERY
                </span>
              )}
            </div>,
            <div key={`${subOrder._id}-customer`}>
              <div className="text-sm text-gray-200">
                {subOrder.parentOrderId?.shippingAddress?.fullName || "Customer"}
              </div>
              <div className="text-xs text-gray-500 font-mono">
                {maskPhone(subOrder.parentOrderId?.shippingAddress?.phone)}
              </div>
            </div>,
            <ItemsDropdownCell key={`${subOrder._id}-items`} items={subOrder.items} />,
            `Rs. ${formatAmount(subOrder.payableAmount || 0)}`,
            <div key={`${subOrder._id}-status-col`} className="flex flex-col gap-1.5 items-start">
              <StatusBadge label={subOrder.status} />
              {isCancelRequested && (
                <span className="text-[10px] font-medium bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded animate-pulse">
                  Cancel Requested
                </span>
              )}
            </div>,
            <div key={`${subOrder._id}-actions`} className="flex flex-col gap-2">
              {/* Phase 9 — pending seller confirmation. The seller must phone
                  the customer, read the OTPs, then click Confirm. OTPs are
                  generated up-front in finalizePendingConfirmation so they
                  exist from the moment the order is created. */}
              {subOrder.status === "PENDING_SELLER_CONFIRMATION" && (() => {
                const customerPhone = subOrder.parentOrderId?.shippingAddress?.phone;
                return (
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 text-xs space-y-2.5">
                    <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                      <PhoneCall className="h-3.5 w-3.5" />
                      Call customer to confirm
                    </div>

                    {customerPhone && (
                      <a
                        href={`tel:${customerPhone}`}
                        className="flex items-center justify-between gap-2 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-2 transition group"
                      >
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="font-mono text-emerald-300 font-bold">
                            {maskPhone(customerPhone)}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-400 group-hover:text-emerald-300">
                          TAP TO CALL →
                        </span>
                      </a>
                    )}

                    {subOrder.delivery?.pickupOtp && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(subOrder.delivery.pickupOtp)}
                        className="flex items-center justify-between gap-2 w-full rounded-md bg-black/30 hover:bg-black/40 border border-white/10 px-2.5 py-2 transition"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            Pickup OTP
                          </span>
                          <span className="font-mono text-emerald-400 font-bold tracking-wider text-sm">
                            {subOrder.delivery.pickupOtp}
                          </span>
                        </div>
                        <Copy className="h-3.5 w-3.5 text-gray-400" />
                      </button>
                    )}

                    {subOrder.delivery?.deliveryOtp && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(subOrder.delivery.deliveryOtp)}
                        className="flex items-center justify-between gap-2 w-full rounded-md bg-black/30 hover:bg-black/40 border border-white/10 px-2.5 py-2 transition"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            Delivery OTP
                          </span>
                          <span className="font-mono text-emerald-400 font-bold tracking-wider text-sm">
                            {subOrder.delivery.deliveryOtp}
                          </span>
                        </div>
                        <Copy className="h-3.5 w-3.5 text-gray-400" />
                      </button>
                    )}

                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => confirmSubOrder.mutate({ subOrderId: subOrder._id, method: "phone_call" })}
                        disabled={confirmSubOrder.isPending}
                      >
                        Confirm Order
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
                        onClick={() => {
                          setDeclineTarget(subOrder);
                          setDeclineReason("");
                        }}
                        disabled={declineSubOrder.isPending}
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                );
              })()}

              {/* State transition buttons */}
              {subOrder.status === "CONFIRMED" && (
                <Button
                  size="sm"
                  variant="default"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  onClick={() => updateStatus.mutate({ subOrderId: subOrder._id, status: "PROCESSING" })}
                  disabled={updateStatus.isPending}
                >
                  Accept & Process
                </Button>
              )}
              {subOrder.status === "PROCESSING" && (
                <Button
                  size="sm"
                  variant="default"
                  className="bg-violet-600 hover:bg-violet-700 text-white"
                  onClick={() => updateStatus.mutate({ subOrderId: subOrder._id, status: "PACKED" })}
                  disabled={updateStatus.isPending}
                >
                  Mark Packed
                </Button>
              )}
              {subOrder.status === "PACKED" && (
                <Button
                  size="sm"
                  variant="default"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => handleOpenPickupModal(subOrder)}
                  disabled={updateStatus.isPending}
                >
                  Ready for Pickup
                </Button>
              )}

              {/* Rider assigned details */}
              {subOrder.delivery?.riderId && (
                <div className="bg-white/5 border border-white/10 rounded p-2 text-xs">
                  <div className="text-gray-400 font-medium">Assigned Rider:</div>
                  <div className="text-white mt-0.5 font-semibold">
                    {subOrder.delivery.riderId.fullName || "Delivery Partner"}
                  </div>
                  <div className="text-gray-500">{subOrder.delivery.riderId.phone}</div>
                  <div className="flex items-center justify-between gap-4 mt-1.5 pt-1 border-t border-white/5">
                    <span className="text-gray-400">Pickup OTP:</span>
                    <span className="font-mono text-emerald-400 font-bold tracking-wider">
                      {subOrder.delivery.pickupOtp}
                    </span>
                  </div>
                </div>
              )}

              {/* Cancellation requests approvals */}
              {isCancelRequested && (
                <div className="flex gap-2.5 mt-1">
                  <Button
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white flex-1"
                    onClick={() => processCancellation.mutate({ subOrderId: subOrder._id, approve: true })}
                    disabled={processCancellation.isPending}
                  >
                    Approve Cancel
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/10 text-white hover:bg-white/10 flex-1"
                    onClick={() => processCancellation.mutate({ subOrderId: subOrder._id, approve: false })}
                    disabled={processCancellation.isPending}
                  >
                    Reject Request
                  </Button>
                </div>
              )}

              {/* Default labels if in matching pool */}
              {subOrder.status === "READY_FOR_PICKUP" && !subOrder.delivery?.riderId && (
                <div className="text-xs text-amber-400 font-medium animate-pulse flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  Searching for Riders...
                </div>
              )}
            </div>,
          ];
        })}
      />
      <PaginationBar result={subOrdersQuery.data} params={params} onChange={setParams} />

      {/* Glassmorphic Pickup Modal */}
      {selectedSubOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#181818] border border-white/15 rounded-xl shadow-2xl overflow-hidden p-6 text-white animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-white border-b border-white/10 pb-3">
              Lock Package Details ({selectedSubOrder.subOrderId})
            </h3>
            
            <div className="space-y-4 py-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Package Weight (Grams)
                </label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Number of Packages
                </label>
                <input
                  type="number"
                  value={packageCount}
                  onChange={(e) => setPackageCount(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2.5 py-1">
                <input
                  type="checkbox"
                  id="isFragile"
                  checked={isFragile}
                  onChange={(e) => setIsFragile(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-white/10 rounded focus:ring-indigo-500 focus:ring-2 bg-black/30"
                />
                <label htmlFor="isFragile" className="text-sm font-medium text-gray-200 cursor-pointer select-none">
                  Package contains fragile items
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Pickup Instructions
                </label>
                <textarea
                  value={pickupNotes}
                  onChange={(e) => setPickupNotes(e.target.value)}
                  placeholder="E.g., third floor, gate code, store locator details..."
                  className="w-full h-20 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 resize-none text-sm placeholder:text-gray-600"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-white/10 pt-4 mt-2">
              <Button
                variant="ghost"
                className="text-gray-400 hover:bg-white/5 hover:text-white"
                onClick={() => setSelectedSubOrder(null)}
              >
                Cancel
              </Button>
              <Button
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={handleConfirmPickup}
                disabled={updateStatus.isPending}
              >
                Confirm & Request Rider
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Phase 9 — Decline-sub-order modal. Triggers a refund for online
          payments; for COD the order is just marked REJECTED. */}
      {declineTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#181818] border border-red-500/30 rounded-xl shadow-2xl overflow-hidden p-6 text-white animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <X className="h-5 w-5 text-red-400" />
                Decline Sub-Order
              </h3>
              <button
                type="button"
                onClick={() => setDeclineTarget(null)}
                className="text-gray-400 hover:text-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 py-4 text-sm text-gray-300">
              <p>
                Declining <span className="font-mono text-white">{declineTarget.subOrderId}</span>{" "}
                will reject the order. The customer will be notified and, for online
                payments, the money will be refunded.
              </p>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Reason
                </label>
                <textarea
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder="e.g. Customer unreachable after 3 attempts"
                  className="w-full h-24 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500 resize-none text-sm placeholder:text-gray-600"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-white/10 pt-4 mt-2">
              <Button
                variant="ghost"
                className="text-gray-400 hover:bg-white/5 hover:text-white"
                onClick={() => setDeclineTarget(null)}
                disabled={declineSubOrder.isPending}
              >
                Cancel
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => {
                  if (!declineReason.trim()) return;
                  declineSubOrder.mutate(
                    { subOrderId: declineTarget._id, reason: declineReason.trim() },
                    { onSuccess: () => setDeclineTarget(null) },
                  );
                }}
                disabled={declineSubOrder.isPending || declineReason.trim().length < 2}
              >
                {declineSubOrder.isPending ? "Declining…" : "Decline Sub-Order"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ModuleCard>
  );
}
