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

export const selectClass = "h-9 rounded-lg border border-border bg-background px-2 text-sm text-foreground outline-none";
export const inputClass = "border-border bg-muted text-foreground placeholder:text-muted-foreground";
export const textareaClass = "min-h-24 rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground";

export function Metric({ title, value, icon, onTab }: { title: string; value: number | string; icon: ReactNode; onTab?: () => void }) {
  const content = (
    <>
      <div className="min-w-0">
        <div className="truncate text-sm text-muted-foreground">{title}</div>
        <div className="mt-1 truncate text-xl font-semibold text-foreground">{value}</div>
      </div>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-cyan-700 transition-colors group-hover:bg-primary/10 group-hover:text-primary dark:text-cyan-300">{icon}</div>
    </>
  );
  if (onTab) {
    return (
      <button
        type="button"
        onClick={onTab}
        title={`Go to ${title}`}
        aria-label={`${title}: ${value}. Go to ${title}`}
        className="group flex min-w-0 items-center justify-between gap-2 rounded-xl bg-card p-4 text-left ring-1 ring-foreground/10 transition hover:shadow-md hover:ring-primary/50"
      >
        {content}
      </button>
    );
  }
  return (
    <Card className="group min-w-0 border-border bg-card">
      <CardContent className="flex items-center justify-between gap-2 p-4">
        {content}
      </CardContent>
    </Card>
  );
}

export function ProfileLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right text-foreground">{value}</span>
    </div>
  );
}

export function DeliveryStatusBadge({ status }: { status: DeliveryStatus }) {
  const className = cn(
    "border-border text-muted-foreground",
    status === "DELIVERED" && "border-emerald-400/30 text-emerald-700 dark:text-emerald-300",
    status === "DELIVERY_CONFIRMED" && "border-emerald-400/30 text-emerald-700 dark:text-emerald-300",
    activeStatuses.includes(status) && "border-cyan-400/30 text-cyan-700 dark:text-cyan-300",
    (status === "CANCELLED" || status === "FAILED") && "border-red-400/30 text-red-700 dark:text-red-300",
  );
  return <Badge variant="outline" className={className}>{deliveryStatusLabel(status)}</Badge>;
}

export function EmptyState({ label }: { label: string }) {
  return <div className="py-6 text-sm text-muted-foreground">{label}</div>;
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
