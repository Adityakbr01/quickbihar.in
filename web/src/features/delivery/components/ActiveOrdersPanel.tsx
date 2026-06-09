import { ReactNode } from "react";
import { Truck, MapPin, Navigation, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeliveryOrder, DeliveryStatus } from "@/features/delivery/api/delivery.api";
import {
  activeStatuses,
  selectClass,
  inputClass,
  DeliveryStatusBadge,
  EmptyState,
  deliveryStatusLabel,
  deliveryStatusOf,
  formatDate,
  formatAmount,
} from "./DeliveryHelpers";

const nextActionByStatus: Record<
  string,
  { action: "ACCEPTED" | "PICKED_UP" | "OUT_FOR_DELIVERY" | "DELIVERED"; label: string; icon: ReactNode }
> = {
  ASSIGNED: { action: "ACCEPTED", label: "Accept", icon: null },
  ACCEPTED: { action: "PICKED_UP", label: "Picked up", icon: null },
  PICKED_UP: { action: "OUT_FOR_DELIVERY", label: "Out for delivery", icon: null },
  OUT_FOR_DELIVERY: { action: "DELIVERED", label: "Complete", icon: null },
};

export function ActiveOrdersPanel({
  orders,
  loading,
  otpByOrder,
  onOtp,
  onNext,
  onLocation,
  onSelect,
  isPending,
  statusFilter,
  onStatusFilterChange,
  selectedOrderId,
}: {
  orders: DeliveryOrder[];
  loading: boolean;
  otpByOrder: Record<string, string>;
  onOtp: (orderId: string, value: string) => void;
  onNext: (order: DeliveryOrder) => void;
  onLocation: (order: DeliveryOrder) => void;
  onSelect: (orderId: string) => void;
  isPending: boolean;
  statusFilter: DeliveryStatus | "ALL";
  onStatusFilterChange: (status: DeliveryStatus | "ALL") => void;
  selectedOrderId: string | null;
}) {
  const activeOrders = orders.filter((order) => activeStatuses.includes(deliveryStatusOf(order)));
  const selectedActiveOrder = activeOrders.find((order) => order._id === selectedOrderId) || null;

  return (
    <section className="grid gap-4 xl:grid-cols-[1fr_340px]">
      <Card className="border-white/10 bg-[#1c1c1c]">
        <CardHeader className="flex flex-col gap-3 border-b border-white/10 md:flex-row md:items-center md:justify-between">
          <CardTitle className="flex items-center gap-2 text-base text-white">
            <Truck className="h-4 w-4 text-cyan-300" />
            Active Jobs
          </CardTitle>
          <select
            value={statusFilter}
            onChange={(event) => onStatusFilterChange(event.target.value as DeliveryStatus | "ALL")}
            className={selectClass}
          >
            <option value="ALL">All statuses</option>
            {activeStatuses.map((status) => (
              <option key={status} value={status}>
                {deliveryStatusLabel(status)}
              </option>
            ))}
          </select>
        </CardHeader>
        <CardContent className="px-0">
          <OrdersTable
            orders={activeOrders}
            loading={loading}
            otpByOrder={otpByOrder}
            onOtp={onOtp}
            onNext={onNext}
            onLocation={onLocation}
            onSelect={onSelect}
            isPending={isPending}
          />
        </CardContent>
      </Card>
      <OrderDetailPanel order={selectedActiveOrder || activeOrders[0] || null} />
    </section>
  );
}

function OrdersTable({
  orders,
  loading,
  otpByOrder,
  onOtp,
  onNext,
  onLocation,
  onSelect,
  isPending,
}: {
  orders: DeliveryOrder[];
  loading: boolean;
  otpByOrder: Record<string, string>;
  onOtp: (orderId: string, value: string) => void;
  onNext: (order: DeliveryOrder) => void;
  onLocation: (order: DeliveryOrder) => void;
  onSelect: (orderId: string) => void;
  isPending: boolean;
}) {
  if (loading) return <div className="px-4 py-10 text-sm text-gray-400">Loading orders...</div>;
  if (!orders.length) return <div className="px-4 py-10 text-sm text-gray-400">No active orders.</div>;

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-white/10 hover:bg-transparent">
          <TableHead className="px-4 text-gray-400">Order</TableHead>
          <TableHead className="text-gray-400">Customer</TableHead>
          <TableHead className="text-gray-400">Drop</TableHead>
          <TableHead className="text-gray-400">Status</TableHead>
          <TableHead className="text-right text-gray-400">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <DeliveryOrderRow
            key={order._id}
            order={order}
            otp={otpByOrder[order._id] || ""}
            onOtp={(value) => onOtp(order._id, value)}
            onNext={() => onNext(order)}
            onLocation={() => onLocation(order)}
            onSelect={() => onSelect(order._id)}
            isPending={isPending}
          />
        ))}
      </TableBody>
    </Table>
  );
}

function DeliveryOrderRow({
  order,
  otp,
  onOtp,
  onNext,
  onLocation,
  onSelect,
  isPending,
}: {
  order: DeliveryOrder;
  otp: string;
  onOtp: (value: string) => void;
  onNext: () => void;
  onLocation: () => void;
  onSelect: () => void;
  isPending: boolean;
}) {
  const deliveryStatus = deliveryStatusOf(order);
  const next = nextActionByStatus[deliveryStatus];
  const needsOtp = next?.action === "DELIVERED";

  return (
    <TableRow className="border-white/10 hover:bg-white/[0.03]">
      <TableCell className="px-4">
        <button
          type="button"
          onClick={onSelect}
          className="text-left font-medium text-white hover:text-cyan-300"
        >
          {order.orderId}
        </button>
        <div className="text-xs text-gray-500">{formatDate(order.createdAt)}</div>
      </TableCell>
      <TableCell>
        <div className="text-sm text-white">{order.shippingAddress.fullName}</div>
        <div className="text-xs text-gray-500">{order.shippingAddress.phone}</div>
      </TableCell>
      <TableCell>
        <div className="max-w-60 truncate text-sm text-white">{order.shippingAddress.street}</div>
        <div className="text-xs text-gray-500">
          {order.shippingAddress.city}, {order.shippingAddress.pincode}
        </div>
      </TableCell>
      <TableCell>
        <DeliveryStatusBadge status={deliveryStatus} />
        <div className="mt-1 text-xs text-gray-500">
          Rs. {formatAmount(order.delivery?.payoutAmount || order.shippingFee || 0)}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap justify-end gap-2">
          {needsOtp && (
            <Input
              value={otp}
              onChange={(event) => onOtp(event.target.value)}
              placeholder="OTP"
              className={cn(inputClass, "h-9 w-24")}
            />
          )}
          {next && (
            <Button size="sm" onClick={onNext} disabled={isPending || (needsOtp && otp.trim().length < 4)}>
              {next.label}
            </Button>
          )}
          {activeStatuses.includes(deliveryStatus) && (
            <Button
              size="sm"
              variant="outline"
              onClick={onLocation}
              disabled={isPending}
              className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              <Navigation className="h-3.5 w-3.5" />
              Location
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

function OrderDetailPanel({ order }: { order: DeliveryOrder | null }) {
  if (!order) {
    return (
      <Card className="border-white/10 bg-[#1c1c1c]">
        <CardContent className="py-10">
          <EmptyState label="Select an order to view details." />
        </CardContent>
      </Card>
    );
  }

  const mapHref =
    order.shippingAddress.latitude && order.shippingAddress.longitude
      ? `https://www.google.com/maps/search/?api=1&query=${order.shippingAddress.latitude},${order.shippingAddress.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${order.shippingAddress.street} ${order.shippingAddress.city} ${order.shippingAddress.pincode}`
        )}`;

  return (
    <Card className="border-white/10 bg-[#1c1c1c]">
      <CardHeader className="border-b border-white/10">
        <CardTitle className="flex items-center gap-2 text-base text-white">
          <MapPin className="h-4 w-4 text-cyan-300" />
          Order Detail
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 text-sm">
        <div>
          <div className="font-medium text-white">{order.orderId}</div>
          <div className="text-xs text-gray-500">{formatDate(order.createdAt)}</div>
        </div>
        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-2">
          <span className="text-gray-400">Customer</span>
          <span className="text-right text-white">{order.shippingAddress.fullName}</span>
        </div>
        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-2">
          <span className="text-gray-400">Phone</span>
          <span className="text-right text-white">{order.shippingAddress.phone}</span>
        </div>
        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-2">
          <span className="text-gray-400">Status</span>
          <span className="text-right text-white">{deliveryStatusLabel(deliveryStatusOf(order))}</span>
        </div>
        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-2">
          <span className="text-gray-400">Payout</span>
          <span className="text-right text-white">
            Rs. {formatAmount(order.delivery?.payoutAmount || order.shippingFee || 0)}
          </span>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-gray-300">
          {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
          {order.shippingAddress.pincode}
        </div>
        <div className="grid gap-2">
          {(order.items || []).map((item) => (
            <div
              key={`${item.sku}-${item.size}-${item.color}`}
              className="flex justify-between gap-3 border-b border-white/10 pb-2 last:border-0"
            >
              <span className="text-gray-300">{item.title}</span>
              <span className="text-white">x{item.quantity}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={mapHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 text-sm font-medium text-white hover:bg-white/10"
          >
            <Navigation className="h-4 w-4" />
            Map
          </a>
          <a
            href={`tel:${order.shippingAddress.phone}`}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 text-sm font-medium text-white hover:bg-white/10"
          >
            <Phone className="h-4 w-4" />
            Call
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
