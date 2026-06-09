import React, { useState, useMemo } from "react";
import {
  Eye,
  FileDown,
  Truck,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import type { DeliveryPartner, DeliveryStatus } from "@/features/delivery/api/delivery.api";
import {
  AdminOrder,
  OrderStatus,
  QueryParams,
} from "../../api/catalogManagement.api";
import {
  useAdminOrders,
  useDeliveryRiders,
  useAssignDeliveryPartner,
  useUpdateOrderStatus,
  useUnassignDeliveryPartner,
} from "../../hooks/useCatalogManagement";
import {
  inputClass,
  selectClass,
  downloadCsv,
  formatDate,
  formatAmount,
  deliveryPartnerOf,
  deliveryStatusLabel,
} from "../../utils";
import {
  ManagementToolbar,
  PaginationFooter,
  DetailTile,
  LoadingState,
  EmptyState,
  DeliveryStatusBadge,
} from "../shared/TableHelpers";

const orderStatuses: Array<{ value: OrderStatus | "ALL"; label: string }> = [
  { value: "ALL", label: "All statuses" },
  { value: "PENDING_PAYMENT", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "PROCESSING", label: "Processing" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "REFUNDED", label: "Refunded" },
  { value: "REJECTED", label: "Rejected" },
  { value: "FAILED", label: "Failed" },
];

const editableOrderStatuses = orderStatuses.filter(
  (item) => item.value !== "ALL",
) as Array<{ value: OrderStatus; label: string }>;

const deliveryStatuses: Array<{
  value: DeliveryStatus | "ALL";
  label: string;
}> = [
  { value: "ALL", label: "All delivery" },
  { value: "UNASSIGNED", label: "Unassigned" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "PICKED_UP", label: "Picked up" },
  { value: "OUT_FOR_DELIVERY", label: "Out for delivery" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
];

export function OrderManagementPanel() {
  const [params, setParams] = useState<QueryParams>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [assignmentOrder, setAssignmentOrder] = useState<AdminOrder | null>(
    null,
  );
  const ordersQuery = useAdminOrders(params);
  const updateOrderStatus = useUpdateOrderStatus();
  const riderLookupParams = useMemo(() => {
    const latitude = assignmentOrder?.shippingAddress?.latitude;
    const longitude = assignmentOrder?.shippingAddress?.longitude;
    return {
      available: true,
      ...(typeof latitude === "number" ? { latitude } : {}),
      ...(typeof longitude === "number" ? { longitude } : {}),
    };
  }, [
    assignmentOrder?.shippingAddress?.latitude,
    assignmentOrder?.shippingAddress?.longitude,
  ]);
  const ridersQuery = useDeliveryRiders(riderLookupParams);
  const orders = ordersQuery.data?.data || [];

  const setParam = (
    key: keyof QueryParams,
    value: QueryParams[keyof QueryParams],
  ) => {
    setParams((current) => ({
      ...current,
      [key]: value,
      page: key === "page" ? Number(value) : 1,
    }));
  };

  const exportOrders = () => {
    const rows = [
      [
        "Order ID",
        "Customer",
        "Phone",
        "Status",
        "Amount",
        "Items",
        "Created At",
      ],
      ...orders.map((order) => [
        order.orderId,
        order.shippingAddress?.fullName || order.userId?.fullName || "",
        order.shippingAddress?.phone || order.userId?.phone || "",
        order.status,
        String(order.payableAmount || 0),
        String(order.items?.length || 0),
        order.createdAt || "",
      ]),
    ];
    downloadCsv("orders.csv", rows);
  };

  return (
    <div className="grid gap-4">
      <ManagementToolbar
        title="Order Management"
        search={params.search || ""}
        onSearch={(value) => setParam("search", value)}
        status={params.status || "ALL"}
        statuses={orderStatuses as any}
        onStatus={(value) => setParam("status", value)}
        sortBy={params.sortBy || "createdAt"}
        sortOptions={[
          { value: "createdAt", label: "Created" },
          { value: "payableAmount", label: "Amount" },
          { value: "orderId", label: "Order ID" },
          { value: "status", label: "Status" },
        ]}
        onSortBy={(value) => setParam("sortBy", value)}
        sortOrder={params.sortOrder || "desc"}
        onSortOrder={(value) => setParam("sortOrder", value)}
        onRefresh={() => ordersQuery.refetch()}
        extraAction={
          <div className="flex flex-wrap gap-2">
            <select
              value={params.deliveryStatus || "ALL"}
              onChange={(event) =>
                setParam("deliveryStatus", event.target.value)
              }
              className={selectClass}
            >
              {deliveryStatuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              className="border-white/10 bg-white/5 text-white hover:bg-white/10"
              onClick={exportOrders}
            >
              <FileDown className="h-4 w-4" />
              Export
            </Button>
          </div>
        }
      />

      <Card className="border-white/10 bg-[#1c1c1c]">
        <CardContent className="px-0">
          {ordersQuery.isLoading && <LoadingState label="Loading orders..." />}
          {!ordersQuery.isLoading && !orders.length && (
            <EmptyState label="No orders found." />
          )}
          {!ordersQuery.isLoading && Boolean(orders.length) && (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="px-4 text-gray-400">Order</TableHead>
                  <TableHead className="text-gray-400">Customer</TableHead>
                  <TableHead className="text-gray-400">Products</TableHead>
                  <TableHead className="text-gray-400">Payment</TableHead>
                  <TableHead className="text-gray-400">Delivery</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-right text-gray-400">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow
                    key={order._id}
                    className="border-white/10 hover:bg-white/[0.03]"
                  >
                    <TableCell className="px-4">
                      <div className="font-medium text-white">
                        {order.orderId}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(order.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-white">
                        {order.shippingAddress?.fullName ||
                          order.userId?.fullName ||
                          "Customer"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {order.shippingAddress?.phone || order.userId?.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-white">
                        {order.items?.length || 0} items
                      </div>
                      <div className="text-xs text-gray-500">
                        {order.items?.[0]?.title || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-white">
                        Rs. {formatAmount(order.payableAmount || 0)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {order.paymentInfo?.razorpayPaymentId
                          ? "Paid"
                          : "Pending"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DeliverySummary order={order} />
                    </TableCell>
                    <TableCell>
                      <select
                        value={order.status}
                        className={selectClass}
                        onChange={(event) =>
                          updateOrderStatus.mutate({
                            orderId: order._id,
                            status: event.target.value as OrderStatus,
                          })
                        }
                        disabled={updateOrderStatus.isPending}
                      >
                        {editableOrderStatuses.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                          onClick={() => setAssignmentOrder(order)}
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          Delivery
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Details
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <PaginationFooter
        page={params.page || 1}
        totalPages={ordersQuery.data?.totalPages || 1}
        onPage={(page) => setParam("page", page)}
      />
      <OrderDetailsDialog
        order={selectedOrder}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
      />
      {assignmentOrder && (
        <DeliveryAssignmentDialog
          key={assignmentOrder._id}
          order={assignmentOrder}
          riders={ridersQuery.data || []}
          isLoading={ridersQuery.isLoading}
          onOpenChange={(open) => !open && setAssignmentOrder(null)}
        />
      )}
    </div>
  );
}

function DeliverySummary({ order }: { order: AdminOrder }) {
  const status = order.delivery?.status || "UNASSIGNED";
  const partner = deliveryPartnerOf(order);

  return (
    <div className="grid gap-1">
      <DeliveryStatusBadge status={status} />
      <div className="text-xs text-gray-500">
        {partner?.fullName || "No rider assigned"}
      </div>
    </div>
  );
}

function DeliveryAssignmentDialog({
  order,
  riders,
  isLoading,
  onOpenChange,
}: {
  order: AdminOrder;
  riders: DeliveryPartner[];
  isLoading: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const assignDelivery = useAssignDeliveryPartner();
  const unassignDelivery = useUnassignDeliveryPartner();
  const current = deliveryPartnerOf(order);
  const [deliveryUserId, setDeliveryUserId] = useState(
    current?.userId || current?._id || "",
  );
  const [payoutAmount, setPayoutAmount] = useState(
    order.delivery?.payoutAmount ? String(order.delivery.payoutAmount) : "",
  );

  const save = () => {
    if (!deliveryUserId) return;
    assignDelivery.mutate(
      {
        orderId: order._id,
        deliveryUserId,
        payoutAmount: payoutAmount.trim() ? Number(payoutAmount) : undefined,
      },
      {
        onSuccess: () => onOpenChange(false),
      },
    );
  };

  const unassign = () => {
    unassignDelivery.mutate(order._id, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-[#1c1c1c] text-white sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Delivery Assignment {order?.orderId}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-400">Current status</span>
              <DeliveryStatusBadge
                status={order.delivery?.status || "UNASSIGNED"}
              />
            </div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-gray-400">Customer OTP</span>
              <span className="font-medium text-white">
                {order.deliveryOtp || order.delivery?.otp?.code || "-"}
              </span>
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-gray-300">Rider</label>
            <select
              value={deliveryUserId}
              onChange={(event) => setDeliveryUserId(event.target.value)}
              className={selectClass}
            >
              <option value="">
                {isLoading ? "Loading riders..." : "Select delivery rider"}
              </option>
              {riders.map((rider) => (
                <option
                  key={rider.userId || rider._id}
                  value={rider.userId || rider._id}
                >
                  {rider.fullName || rider.email}{" "}
                  {rider.isOnline ? "(Online)" : "(Offline)"}
                  {typeof rider.distanceKm === "number"
                    ? ` - ${rider.distanceKm.toFixed(1)} km`
                    : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-gray-300">Payout Amount</label>
            <Input
              value={payoutAmount}
              onChange={(event) => setPayoutAmount(event.target.value)}
              type="number"
              min="0"
              placeholder="Default payout"
              className={inputClass}
            />
          </div>

          <div className="flex flex-wrap justify-between gap-2">
            <Button
              variant="destructive"
              onClick={unassign}
              disabled={unassignDelivery.isPending || !deliveryPartnerOf(order)}
            >
              Unassign
            </Button>
            <Button
              onClick={save}
              disabled={assignDelivery.isPending || !deliveryUserId}
            >
              <Truck className="h-4 w-4" />
              Save Assignment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function OrderDetailsDialog({
  order,
  onOpenChange,
}: {
  order: AdminOrder | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={Boolean(order)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-[#1c1c1c] text-white sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Order Details {order?.orderId}</DialogTitle>
        </DialogHeader>
        {order && (
          <div className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-4">
              <DetailTile
                title="Customer"
                lines={[
                  order.shippingAddress.fullName,
                  order.shippingAddress.phone,
                  order.userId?.email,
                ]}
              />
              <DetailTile
                title="Payment"
                lines={[
                  `Payable: Rs. ${formatAmount(order.payableAmount)}`,
                  `Tax: Rs. ${formatAmount(order.totalTax || 0)}`,
                  order.paymentInfo?.razorpayPaymentId || "Payment pending",
                ]}
              />
              <DetailTile
                title="Shipping"
                lines={[
                  order.shippingAddress.street,
                  `${order.shippingAddress.city}, ${order.shippingAddress.state}`,
                  order.shippingAddress.pincode,
                ]}
              />
              <DetailTile
                title="Delivery"
                lines={[
                  deliveryStatusLabel(order.delivery?.status || "UNASSIGNED"),
                  deliveryPartnerOf(order)?.fullName || "No rider assigned",
                  `OTP: ${order.deliveryOtp || order.delivery?.otp?.code || "-"}`,
                ]}
              />
            </div>
            <Card className="border-white/10 bg-white/[0.03]">
              <CardHeader className="border-b border-white/10">
                <CardTitle className="text-base text-white">
                  Ordered Products
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="px-4 text-gray-400">
                        Product
                      </TableHead>
                      <TableHead className="text-gray-400">Variant</TableHead>
                      <TableHead className="text-gray-400">Qty</TableHead>
                      <TableHead className="text-gray-400">Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map((item) => (
                      <TableRow
                        key={`${item.productId}-${item.sku}`}
                        className="border-white/10"
                      >
                        <TableCell className="px-4 text-white">
                          {item.title}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {item.size} / {item.color} / {item.sku}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-white">
                          Rs. {formatAmount(item.price)}
                        </TableCell>
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
