"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useFulfillmentRealtime } from "@/hooks/useFulfillmentRealtime";
import type { SellerQueryParams } from "@/features/seller/api/sellerManagement.api";
import {
  useSellerSubOrders,
  useSellerSubOrderStatusMutation,
  useSellerSubOrderCancellationMutation,
} from "../hooks/useSellerManagement";
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

export function SellerOrdersPanel() {
  useFulfillmentRealtime();
  const [params, setParams] = useState<SellerQueryParams>({ page: 1, limit: 10 });
  const subOrdersQuery = useSellerSubOrders(params);
  const updateStatus = useSellerSubOrderStatusMutation();
  const processCancellation = useSellerSubOrderCancellationMutation();

  // State for Ready for Pickup modal
  const [selectedSubOrder, setSelectedSubOrder] = useState<any | null>(null);
  const [weight, setWeight] = useState<number>(500);
  const [packageCount, setPackageCount] = useState<number>(1);
  const [isFragile, setIsFragile] = useState<boolean>(false);
  const [pickupNotes, setPickupNotes] = useState<string>("");

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
              <div className="text-xs text-gray-500">
                {subOrder.parentOrderId?.shippingAddress?.phone}
              </div>
            </div>,
            <div key={`${subOrder._id}-items`} className="max-w-[200px] text-xs text-gray-300">
              {subOrder.items.map((item: any) => `${item.title} x${item.quantity}`).join(", ")}
            </div>,
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
    </ModuleCard>
  );
}
