import { History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
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
  terminalStatuses,
  selectClass,
  inputClass,
  DeliveryStatusBadge,
  deliveryStatusLabel,
  deliveryStatusOf,
  formatDate,
  formatAmount,
} from "./DeliveryHelpers";
import { cn } from "@/lib/utils";

export function HistoryPanel({
  orders,
  loading,
  historyStatus,
  setHistoryStatus,
  dateFrom,
  dateTo,
  setDateFrom,
  setDateTo,
  onSelect,
}: {
  orders: DeliveryOrder[];
  loading: boolean;
  historyStatus: DeliveryStatus | "ALL";
  setHistoryStatus: (status: DeliveryStatus | "ALL") => void;
  dateFrom: string;
  dateTo: string;
  setDateFrom: (value: string) => void;
  setDateTo: (value: string) => void;
  onSelect: (orderId: string) => void;
}) {
  return (
    <Card className="border-white/10 bg-[#1c1c1c]">
      <CardHeader className="flex flex-col gap-3 border-b border-white/10 xl:flex-row xl:items-center xl:justify-between">
        <CardTitle className="flex items-center gap-2 text-base text-white">
          <History className="h-4 w-4 text-cyan-300" />
          Order History
        </CardTitle>
        <div className="flex flex-wrap gap-2">
          <select
            value={historyStatus}
            onChange={(event) => setHistoryStatus(event.target.value as DeliveryStatus | "ALL")}
            className={selectClass}
          >
            <option value="ALL">All statuses</option>
            {[...activeStatuses, ...terminalStatuses].map((status) => (
              <option key={status} value={status}>
                {deliveryStatusLabel(status)}
              </option>
            ))}
          </select>
          <DatePicker
            value={dateFrom}
            onChange={setDateFrom}
            placeholder="Date From"
            className={cn(inputClass, "w-36")}
          />
          <DatePicker value={dateTo} onChange={setDateTo} placeholder="Date To" className={cn(inputClass, "w-36")} />
        </div>
      </CardHeader>
      <CardContent className="px-0">
        {loading && <div className="px-4 py-10 text-sm text-gray-400">Loading history...</div>}
        {!loading && !orders.length && <div className="px-4 py-10 text-sm text-gray-400">No history found.</div>}
        {!loading && Boolean(orders.length) && (
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="px-4 text-gray-400">Order</TableHead>
                <TableHead className="text-gray-400">Customer</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-gray-400">Payout</TableHead>
                <TableHead className="text-gray-400">Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order._id} className="border-white/10 hover:bg-white/[0.03]">
                  <TableCell className="px-4">
                    <button
                      type="button"
                      onClick={() => onSelect(order._id)}
                      className="font-medium text-white hover:text-cyan-300"
                    >
                      {order.orderId}
                    </button>
                  </TableCell>
                  <TableCell className="text-gray-300">{order.shippingAddress.fullName}</TableCell>
                  <TableCell>
                    <DeliveryStatusBadge status={deliveryStatusOf(order)} />
                  </TableCell>
                  <TableCell className="text-white">
                    Rs. {formatAmount(order.delivery?.payoutAmount || 0)}
                  </TableCell>
                  <TableCell className="text-gray-400">{formatDate(order.updatedAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
