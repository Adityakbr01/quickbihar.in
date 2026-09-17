import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DeliveryStatus, DeliveryOrder } from "@/features/delivery/api/delivery.api";

export const activeStatuses: DeliveryStatus[] = [
  "ASSIGNMENT_OPEN",
  "ASSIGNED",
  "ACCEPTED",
  "ARRIVING_AT_STORE",
  "REACHED_STORE",
  "PICKUP_VERIFICATION_PENDING",
  "PICKED_UP",
  "IN_TRANSIT",
  "NEAR_CUSTOMER",
  "OUT_FOR_DELIVERY",
];
export const terminalStatuses: DeliveryStatus[] = ["DELIVERED", "DELIVERY_CONFIRMED", "CANCELLED", "FAILED", "RETURNED"];

export const selectClass = "h-9 rounded-lg border border-white/10 bg-[#181818] px-2 text-sm text-white outline-none";
export const inputClass = "border-white/10 bg-white/5 text-white placeholder:text-gray-500";
export const textareaClass = "min-h-24 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-gray-500";

export function Metric({ title, value, icon }: { title: string; value: number | string; icon: ReactNode }) {
  return (
    <Card className="border-white/10 bg-[#1c1c1c]">
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <div className="text-sm text-gray-400">{title}</div>
          <div className="mt-1 text-xl font-semibold text-white">{value}</div>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-cyan-300">{icon}</div>
      </CardContent>
    </Card>
  );
}

export function ProfileLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-2 last:border-b-0">
      <span className="text-gray-400">{label}</span>
      <span className="text-right text-white">{value}</span>
    </div>
  );
}

export function DeliveryStatusBadge({ status }: { status: DeliveryStatus }) {
  const className = cn(
    "border-white/10 text-gray-300",
    status === "DELIVERED" && "border-emerald-400/30 text-emerald-300",
    status === "DELIVERY_CONFIRMED" && "border-emerald-400/30 text-emerald-300",
    activeStatuses.includes(status) && "border-cyan-400/30 text-cyan-300",
    (status === "CANCELLED" || status === "FAILED") && "border-red-400/30 text-red-300",
  );
  return <Badge variant="outline" className={className}>{deliveryStatusLabel(status)}</Badge>;
}

export function EmptyState({ label }: { label: string }) {
  return <div className="py-6 text-sm text-gray-400">{label}</div>;
}

export function deliveryStatusOf(order: DeliveryOrder): DeliveryStatus {
  return order.delivery?.status || "UNASSIGNED";
}

export function deliveryStatusLabel(status: DeliveryStatus) {
  return status.replace(/_/g, " ");
}

export function formatDate(value?: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export function todayInputValue() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount);
}

export function text(form: FormData, key: string) {
  return String(form.get(key) || "").trim();
}

export function optionalText(form: FormData, key: string) {
  const value = text(form, key);
  return value || undefined;
}
