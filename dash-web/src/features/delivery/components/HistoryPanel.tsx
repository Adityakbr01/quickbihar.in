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
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-col gap-3 border-b border-border xl:flex-row xl:items-center xl:justify-between">
        <CardTitle className="flex items-center gap-2 text-base text-foreground">
          <History className="h-4 w-4 text-cyan-700 dark:text-cyan-300" />
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
        {loading && <div className="px-4 py-10 text-sm text-muted-foreground">Loading history...</div>}
        {!loading && !orders.length && <div className="px-4 py-10 text-sm text-muted-foreground">No history found.</div>}
        {!loading && Boolean(orders.length) && (
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="px-4 text-muted-foreground">Order</TableHead>
                <TableHead className="text-muted-foreground">Customer</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Payout</TableHead>
                <TableHead className="text-muted-foreground">Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order._id} className="border-border hover:bg-muted">
                  <TableCell className="px-4">
                    <button
                      type="button"
                      onClick={() => onSelect(order._id)}
                      className="font-medium text-foreground hover:text-cyan-700 dark:hover:text-cyan-300"
                    >
                      {order.orderId}
                    </button>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{order.shippingAddress.fullName}</TableCell>
                  <TableCell>
                    <DeliveryStatusBadge status={deliveryStatusOf(order)} />
                  </TableCell>
                  <TableCell className="text-foreground">
                    Rs. {formatAmount(order.delivery?.payoutAmount || 0)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(order.updatedAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
