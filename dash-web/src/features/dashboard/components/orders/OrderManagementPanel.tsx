import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Eye,
  FileDown,
  Truck,
  UserPlus,
  Clock,
  CheckCircle,
  Coins,
  History,
  AlertTriangle,
  User,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFulfillmentRealtime } from "@/hooks/useFulfillmentRealtime";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useAdminSubOrders,
  useAdminAssignRider,
  useAdminSettleCod,
  useManagedPeople,
} from "../../hooks/useAdminManagement";
import {
  inputClass,
  selectClass,
  downloadCsv,
  formatDate,
  formatAmount,
} from "../../utils";
import {
  ManagementToolbar,
  PaginationFooter,
  DetailTile,
  LoadingState,
  EmptyState,
  DeliveryStatusBadge,
} from "../shared/TableHelpers";

const subOrderStatuses = [
  { value: "ALL", label: "All statuses" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "PROCESSING", label: "Processing" },
  { value: "PACKED", label: "Packed" },
  { value: "READY_FOR_PICKUP", label: "Ready For Pickup" },
  { value: "RIDER_ASSIGNED", label: "Rider Assigned" },
  { value: "RIDER_ARRIVING", label: "Rider Arriving" },
  { value: "RIDER_REACHED_STORE", label: "Rider Reached Store" },
  { value: "PICKED_UP", label: "Picked Up" },
  { value: "IN_TRANSIT", label: "In Transit" },
  { value: "NEAR_CUSTOMER", label: "Near Customer" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export function OrderManagementPanel() {
  useFulfillmentRealtime();
  const [params, setParams] = useState({
    page: 1,
    limit: 10,
    status: "ALL",
    search: "",
  });
  
  const [selectedSubOrder, setSelectedSubOrder] = useState<any | null>(null);
  const [assignmentSubOrder, setAssignmentSubOrder] = useState<any | null>(null);
  const [timelineSubOrder, setTimelineSubOrder] = useState<any | null>(null);

  // Fetch admin sub-orders
  const subOrdersQuery = useAdminSubOrders(params);
  const subOrders = subOrdersQuery.data?.data || [];

  // Fetch online delivery riders for assignment lookup
  const ridersQuery = useManagedPeople({ role: "DELIVERY", status: "APPROVED" });
  const onlineRiders = useMemo(() => {
    return (ridersQuery.data || []).filter((r: any) => r.deliveryProfile?.isOnline);
  }, [ridersQuery.data]);

  const assignRiderMutation = useAdminAssignRider();
  const settleCodMutation = useAdminSettleCod();

  const setParam = (key: string, value: any) => {
    setParams((current) => ({
      ...current,
      [key]: value,
      page: key === "page" ? Number(value) : 1,
    }));
  };

  const exportSubOrders = () => {
    const rows = [
      ["Sub-Order ID", "Parent Order ID", "Seller Store", "Customer", "Phone", "Status", "Amount", "COD Mode", "Created At"],
      ...subOrders.map((so: any) => [
        so.subOrderId,
        so.parentOrderId?.orderId || "",
        so.storeId?.name || "",
        so.parentOrderId?.shippingAddress?.fullName || "",
        so.parentOrderId?.shippingAddress?.phone || "",
        so.status,
        String(so.payableAmount || 0),
        so.packageDetails?.isCod ? "COD" : "Prepaid",
        so.createdAt || "",
      ]),
    ];
    downloadCsv("sub_orders.csv", rows);
  };

  return (
    <div className="grid gap-4 text-white">
      <ManagementToolbar
        title="Sub-Order Shipments Operations"
        search={params.search}
        onSearch={(value) => setParam("search", value)}
        status={params.status}
        statuses={subOrderStatuses as any}
        onStatus={(value) => setParam("status", value)}
        sortBy="createdAt"
        sortOptions={[{ value: "createdAt", label: "Created" }]}
        onSortBy={() => {}}
        sortOrder="desc"
        onSortOrder={() => {}}
        onRefresh={() => subOrdersQuery.refetch()}
        extraAction={
          <Button
            variant="outline"
            className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            onClick={exportSubOrders}
          >
            <FileDown className="h-4 w-4" />
            Export CSV
          </Button>
        }
      />

      <Card className="border-white/10 bg-[#1c1c1c]">
        <CardContent className="px-0">
          {subOrdersQuery.isLoading && <LoadingState label="Loading sub-order shipments..." />}
          {!subOrdersQuery.isLoading && !subOrders.length && (
            <EmptyState label="No sub-order shipments found." />
          )}
          {!subOrdersQuery.isLoading && Boolean(subOrders.length) && (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="px-4 text-gray-400">Sub-Order ID</TableHead>
                  <TableHead className="text-gray-400">Merchant Store</TableHead>
                  <TableHead className="text-gray-400">Customer</TableHead>
                  <TableHead className="text-gray-400">Payment & Amount</TableHead>
                  <TableHead className="text-gray-400">Rider / Delivery</TableHead>
                  <TableHead className="text-gray-400">Fulfillment Status</TableHead>
                  <TableHead className="text-right text-gray-400">Operations</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subOrders.map((so: any) => {
                  const hasRider = !!so.delivery?.riderId;
                  const isCod = !!so.packageDetails?.isCod;
                  const isDelivered = ["DELIVERED", "COMPLETED"].includes(so.status);
                  const isCodSettled = so.timeline?.some((event: any) => event.status === "COD_SETTLED");
                  
                  return (
                    <TableRow key={so._id} className="border-white/10 hover:bg-white/[0.03]">
                      <TableCell className="px-4">
                        <div className="font-semibold text-white">{so.subOrderId}</div>
                        <div className="text-[10px] text-gray-500">Parent: {so.parentOrderId?.orderId || "QB-ORDER"}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium text-white">{so.storeId?.name || "Merchant"}</div>
                        <div className="text-[10px] text-gray-500">Seller ID: {so.sellerId?.fullName || "Seller"}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-300">{so.parentOrderId?.shippingAddress?.fullName || "Customer"}</div>
                        <div className="text-xs text-gray-500">{so.parentOrderId?.shippingAddress?.phone}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-bold text-white">Rs. {formatAmount(so.payableAmount)}</div>
                        <span className={cn(
                          "inline-block mt-0.5 px-1 py-0.5 rounded text-[10px] font-bold",
                          isCod ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                        )}>
                          {isCod ? "COD CASH" : "PREPAID ONLINE"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <DeliveryStatusBadge status={so.delivery?.status || "UNASSIGNED"} />
                          <div className="text-[11px] text-gray-400 font-medium">
                            {so.delivery?.riderId?.fullName || "Unassigned Rider"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          "px-2 py-1 rounded text-xs font-bold border",
                          so.status === "DELIVERED" && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                          so.status === "CANCELLED" && "bg-red-500/10 text-red-400 border-red-500/20",
                          !["DELIVERED", "CANCELLED"].includes(so.status) && "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                        )}>
                          {so.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1.5 flex-wrap">
                          {/* Settle COD trigger */}
                          {isCod && isDelivered && !isCodSettled && (
                            <Button
                              size="sm"
                              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] h-8"
                              onClick={() => {
                                if (confirm(`Confirm deposit of Rs. ${so.payableAmount} collected by rider?`)) {
                                  settleCodMutation.mutate(so._id);
                                }
                              }}
                              disabled={settleCodMutation.isPending}
                            >
                              <Coins className="h-3 w-3 mr-1" />
                              Settle Cash
                            </Button>
                          )}
                          {isCod && isDelivered && isCodSettled && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded">
                              <ShieldCheck className="h-3.5 w-3.5" />
                              Cash Settled
                            </span>
                          )}

                          {/* Manual assignment trigger */}
                          {!isDelivered && so.status !== "CANCELLED" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-white/10 bg-white/5 text-white hover:bg-white/10 text-[11px] h-8"
                              onClick={() => setAssignmentSubOrder(so)}
                            >
                              <UserPlus className="h-3 w-3 mr-1" />
                              Assign
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            className="border-white/10 bg-white/5 text-white hover:bg-white/10 text-[11px] h-8"
                            onClick={() => setTimelineSubOrder(so)}
                          >
                            <History className="h-3 w-3 mr-1" />
                            Logs
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-white/10 bg-white/5 text-white hover:bg-white/10 text-[11px] h-8"
                            onClick={() => setSelectedSubOrder(so)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <PaginationFooter
        page={params.page}
        totalPages={subOrdersQuery.data?.totalPages || 1}
        onPage={(page) => setParam("page", page)}
      />

      {/* Detail Dialog */}
      <SubOrderDetailsDialog
        subOrder={selectedSubOrder}
        onOpenChange={(open) => !open && setSelectedSubOrder(null)}
      />

      {/* Manual Rider Assignment Dialog */}
      {assignmentSubOrder && (
        <RiderAssignmentDialog
          subOrder={assignmentSubOrder}
          riders={onlineRiders}
          onOpenChange={(open) => !open && setAssignmentSubOrder(null)}
          onAssign={(riderUserId) => {
            assignRiderMutation.mutate({
              subOrderId: assignmentSubOrder._id,
              riderUserId,
            }, {
              onSuccess: () => setAssignmentSubOrder(null),
            });
          }}
          isPending={assignRiderMutation.isPending}
        />
      )}

      {/* Timeline Audit Logs Dialog */}
      {timelineSubOrder && (
        <TimelineLogsDialog
          subOrder={timelineSubOrder}
          onOpenChange={(open) => !open && setTimelineSubOrder(null)}
        />
      )}
    </div>
  );
}

// Dialog to show full suborder details
function SubOrderDetailsDialog({
  subOrder,
  onOpenChange,
}: {
  subOrder: any | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={Boolean(subOrder)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-[#1c1c1c] text-white sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Sub-Order Shipment Specifications ({subOrder?.subOrderId})</DialogTitle>
        </DialogHeader>
        {subOrder && (
          <div className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-4">
              <DetailTile
                title="Customer Address"
                lines={[
                  subOrder.parentOrderId?.shippingAddress?.fullName || "Recipient",
                  subOrder.parentOrderId?.shippingAddress?.phone || "No phone",
                  subOrder.parentOrderId?.shippingAddress?.street || "",
                  `${subOrder.parentOrderId?.shippingAddress?.city || ""}, ${subOrder.parentOrderId?.shippingAddress?.pincode || ""}`,
                ]}
              />
              <DetailTile
                title="Store Pickup"
                lines={[
                  subOrder.storeId?.name || "Merchant",
                  subOrder.storeId?.contact?.phone || "No contact",
                  subOrder.storeId?.address?.line1 || "Store Address",
                ]}
              />
              <DetailTile
                title="Package Specifications"
                lines={[
                  `Weight: ${subOrder.packageDetails?.weight || 0} grams`,
                  `Packages: ${subOrder.packageDetails?.packageCount || 1} box(es)`,
                  `Fragile: ${subOrder.packageDetails?.isFragile ? "Yes" : "No"}`,
                  `OTP Code: ${subOrder.delivery?.pickupOtp || "-"}`,
                ]}
              />
              <DetailTile
                title="Fulfillment details"
                lines={[
                  `Payout: Rs. ${formatAmount(subOrder.delivery?.payoutAmount || 0)}`,
                  `Rider: ${subOrder.delivery?.riderId?.fullName || "Unassigned"}`,
                  `OTP: ${subOrder.delivery?.deliveryOtp || "-"}`,
                ]}
              />
            </div>
            
            <Card className="border-white/10 bg-white/[0.03]">
              <CardHeader className="border-b border-white/10 py-3">
                <CardTitle className="text-sm font-semibold text-white">Itemized Package Contents</CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="px-4 text-gray-400">Product Title</TableHead>
                      <TableHead className="text-gray-400">SKU / Variant</TableHead>
                      <TableHead className="text-gray-400">Qty</TableHead>
                      <TableHead className="text-gray-400 text-right font-medium">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subOrder.items?.map((item: any, idx: number) => (
                      <TableRow key={idx} className="border-white/10 hover:bg-transparent">
                        <TableCell className="px-4 text-white font-medium">{item.title}</TableCell>
                        <TableCell className="text-gray-400 font-mono text-[11px]">
                          {item.sku} • {item.size} / {item.color}
                        </TableCell>
                        <TableCell className="text-gray-300 font-medium">{item.quantity}</TableCell>
                        <TableCell className="text-white text-right font-bold">Rs. {formatAmount(item.price * item.quantity)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Dialog to manually assign rider
function RiderAssignmentDialog({
  subOrder,
  riders,
  onOpenChange,
  onAssign,
  isPending,
}: {
  subOrder: any;
  riders: any[];
  onOpenChange: (open: boolean) => void;
  onAssign: (riderUserId: string) => void;
  isPending: boolean;
}) {
  const [selectedRider, setSelectedRider] = useState("");

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-[#1c1c1c] text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manual Rider Allocation ({subOrder.subOrderId})</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-3">
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-xs text-cyan-400 flex items-start gap-2">
            <Truck className="h-5 w-5 shrink-0" />
            <div>
              <div className="font-bold">Merchant: {subOrder.storeId?.name}</div>
              <div className="mt-0.5 text-[10px] text-gray-400">
                Pickup address: {subOrder.storeId?.address?.line1}, {subOrder.storeId?.address?.city}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
              Online Delivery Partners (Within Radius)
            </label>
            <select
              value={selectedRider}
              onChange={(e) => setSelectedRider(e.target.value)}
              className={selectClass}
            >
              <option value="">Select an online delivery rider...</option>
              {riders.length === 0 ? (
                <option value="" disabled>No active riders are online right now</option>
              ) : (
                riders.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.fullName} ({r.phone || r.email})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} disabled={isPending}>
              Dismiss
            </Button>
            <Button
              size="sm"
              onClick={() => onAssign(selectedRider)}
              disabled={isPending || !selectedRider}
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold"
            >
              Dispatch Rider
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Dialog to display status timeline logs
function TimelineLogsDialog({
  subOrder,
  onOpenChange,
}: {
  subOrder: any;
  onOpenChange: (open: boolean) => void;
}) {
  const events = subOrder.timeline || [];

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto border-white/10 bg-[#1c1c1c] text-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-cyan-400" />
            Shipment Event Timeline logs
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-6">
          {events.length === 0 ? (
            <div className="text-center py-6 text-sm text-gray-500">No events logged for this shipment.</div>
          ) : (
            <div className="relative border-l border-white/10 pl-6 ml-3 space-y-6">
              {events.map((event: any, index: number) => {
                const isSystem = event.actor === "SYSTEM";
                const isAdmin = event.actor === "ADMIN";
                const isRider = event.actor === "RIDER";
                const isSeller = event.actor === "SELLER";
                const isCustomer = event.actor === "CUSTOMER";
                
                return (
                  <div key={index} className="relative">
                    {/* Pulsing indicator marker dot */}
                    <span className={cn(
                      "absolute -left-[31px] top-1.5 flex h-4 w-4 rounded-full border-2 bg-[#1c1c1c] items-center justify-center",
                      isSystem && "border-gray-500",
                      isAdmin && "border-amber-500",
                      isRider && "border-cyan-400",
                      isSeller && "border-purple-400",
                      isCustomer && "border-red-400"
                    )}>
                      <span className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        isSystem && "bg-gray-500",
                        isAdmin && "bg-amber-500",
                        isRider && "bg-cyan-400",
                        isSeller && "bg-purple-400",
                        isCustomer && "bg-red-400"
                      )} />
                    </span>
                    
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-white text-xs tracking-wide">{event.status}</span>
                        <span className="text-[10px] text-gray-500 font-mono">{formatDate(event.timestamp)}</span>
                      </div>
                      <div className="text-xs text-gray-400 flex items-center gap-1.5 font-medium">
                        <User className="h-3.5 w-3.5" />
                        <span>Actor: {event.actor} {event.actorId ? `(${event.actorId})` : ""}</span>
                      </div>
                      <div className="p-2.5 bg-black/30 border border-white/5 rounded-lg text-xs text-gray-300 leading-relaxed font-sans mt-1">
                        {event.metadata?.message || event.metadata?.note || "Status checkpoint verified successfully."}
                      </div>
                      {(event.ipAddress || event.deviceInfo) && (
                        <div className="text-[9px] text-gray-500 font-mono tracking-tight flex flex-wrap gap-2 pt-0.5 pl-1">
                          {event.ipAddress && <span>IP: {event.ipAddress}</span>}
                          {event.deviceInfo && <span className="truncate max-w-xs">UA: {event.deviceInfo}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
