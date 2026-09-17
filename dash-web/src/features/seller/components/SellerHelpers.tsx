import React, { type ReactNode } from "react";
import { CheckCircle2, RefreshCcw, Trash2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SellerQueryParams } from "@/features/seller/api/sellerManagement.api";
import type { SellerPayoutMethod } from "@/features/seller/api/sellerPanel.api";
import { cn } from "@/lib/utils";

export const inputClass =
  "w-full border-border bg-muted text-foreground placeholder:text-muted-foreground";
export const selectClass =
  "h-9 w-full rounded-lg border border-border bg-background px-2 text-sm text-foreground outline-none";
export const labelClass = "grid gap-1 text-xs font-medium uppercase text-muted-foreground";

export function Metric({
  title,
  value,
  icon,
  onClick,
}: {
  title: string;
  value: string | number;
  icon: ReactNode;
  onClick?: () => void;
}) {
  const content = (
    <CardContent className="flex items-center justify-between gap-3 p-3 sm:p-4">
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase text-muted-foreground">{title}</p>
        <p className="mt-1 break-words text-lg font-semibold text-foreground sm:text-2xl">{value}</p>
      </div>
      <div className="shrink-0 rounded-lg bg-primary/10 p-2 text-primary">{icon}</div>
    </CardContent>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-full rounded-lg border border-border bg-card text-left transition hover:border-primary/40 hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {content}
      </button>
    );
  }

  return (
    <Card className="border-border bg-card">
      {content}
    </Card>
  );
}

export function StatusTile({
  title,
  label,
  active,
  onClick,
}: {
  title: string;
  label: string;
  active: boolean;
  onClick?: () => void;
}) {
  const content = (
    <>
      <div className="text-xs font-medium uppercase text-muted-foreground">{title}</div>
      <div className="mt-2 flex items-center justify-between gap-3">
        <div className="text-sm font-medium text-foreground">{label}</div>
        {active ? (
          <CheckCircle2 className="h-4 w-4 text-primary" />
        ) : (
          <XCircle className="h-4 w-4 text-destructive" />
        )}
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-full rounded-lg border border-border bg-muted p-3 text-left transition hover:border-primary/40 hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {content}
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-muted p-3">
      {content}
    </div>
  );
}

export function StatusBadge({ label }: { label: string }) {
  const normalized = label.toUpperCase();
  const positive = [
    "APPROVED",
    "SUCCESS",
    "OK",
    "VERIFIED",
    "DELIVERED",
    "PAID",
    "ACTIVE",
  ].includes(normalized);
  const warning = [
    "PENDING",
    "PENDING_REVIEW",
    "PENDING_SELLER_CONFIRMATION",
    "DRAFT",
    "LOW",
    "PROCESSING",
    "SHIPPED",
    "INFO",
    "WARNING",
  ].includes(normalized);
  return (
    <Badge
      variant="outline"
      className={cn(
        "whitespace-nowrap",
        positive && "border-emerald-600/30 text-emerald-700 dark:border-emerald-400/30 dark:text-emerald-300",
        warning && "border-amber-600/30 text-amber-700 dark:border-amber-400/30 dark:text-amber-300",
        !positive && !warning && "border-red-600/30 text-red-700 dark:border-red-400/30 dark:text-red-300"
      )}
    >
      {label}
    </Badge>
  );
}

export function LoadingState({ label }: { label: string }) {
  return <div className="py-10 text-center text-sm text-muted-foreground">{label}</div>;
}

export function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}

export function SimpleTable({
  columns,
  rows,
  empty,
}: {
  columns: string[];
  rows: ReactNode[][];
  empty: string;
}) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            {columns.map((column) => (
              <TableHead key={column} className="text-muted-foreground">
                {column}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length ? (
            rows.map((row, index) => (
              <TableRow
                key={index}
                className="border-border hover:bg-muted"
              >
                {row.map((cell, cellIndex) => (
                  <TableCell key={cellIndex} className="text-muted-foreground align-middle py-3">
                    {cell}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow className="border-border">
              <TableCell
                colSpan={columns.length}
                className="py-8 text-center text-muted-foreground"
              >
                {empty}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export function Field({
  name,
  label,
  defaultValue,
  type = "text",
  required,
  optional,
  helper,
  disabled,
}: {
  name: string;
  label: string;
  defaultValue?: string | number;
  type?: string;
  required?: boolean;
  optional?: boolean;
  helper?: string;
  disabled?: boolean;
}) {
  return (
    <label className={labelClass}>
      <span className="flex items-center gap-2">
        {label}
        {required && (
          <span className="text-[10px] normal-case text-destructive">Required</span>
        )}
        {optional && (
          <span className="text-[10px] normal-case text-muted-foreground">Optional</span>
        )}
      </span>
      <Input
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        required={required}
        disabled={disabled}
        className={inputClass}
      />
      {helper && <span className="text-xs normal-case text-muted-foreground">{helper}</span>}
    </label>
  );
}

export function RowActions({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}

export function DeleteButton({ onDelete, label = "this item" }: { onDelete: () => void; label?: string }) {
  const confirm = useConfirm();
  return (
    <Button
      size="sm"
      variant="outline"
      className="border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20"
      onClick={async () => {
        const ok = await confirm({
          title: `Delete ${label}?`,
          description: "This action cannot be undone.",
          confirmLabel: "Delete",
        });
        if (ok) onDelete();
      }}
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );
}

export function ModuleCard({
  title,
  actions,
  filters,
  children,
}: {
  title: string;
  actions?: ReactNode;
  filters?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="border-b border-border">
        <CardTitle className="flex flex-col gap-3 text-base text-foreground lg:flex-row lg:items-center lg:justify-between">
          <span>{title}</span>
          <div className="flex flex-wrap items-center gap-2">
            {filters}
            {actions}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 pt-4">{children}</CardContent>
    </Card>
  );
}

export function ListFilters({
  params,
  onChange,
  approval,
  statusOptions,
}: {
  params: SellerQueryParams;
  onChange: (params: SellerQueryParams) => void;
  approval?: boolean;
  statusOptions?: string[];
}) {
  return (
    <>
      <Input
        value={params.search || ""}
        onChange={(event) => onChange({ ...params, search: event.target.value, page: 1 })}
        placeholder="Search"
        className={cn(inputClass, "w-44")}
      />
      {statusOptions && (
        <select
          value={params.status || "ALL"}
          onChange={(event) => onChange({ ...params, status: event.target.value, page: 1 })}
          className={selectClass}
        >
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      )}
      {approval && (
        <select
          value={params.approvalStatus || "ALL"}
          onChange={(event) =>
            onChange({ ...params, approvalStatus: event.target.value, page: 1 })
          }
          className={selectClass}
        >
          <option value="ALL">All</option>
          <option value="DRAFT">Draft</option>
          <option value="PENDING_REVIEW">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      )}
      <Button
        variant="outline"
        className="border-border bg-muted text-foreground hover:bg-muted"
        onClick={() => onChange({ page: 1, limit: params.limit || 10 })}
      >
        <RefreshCcw className="h-4 w-4" />
      </Button>
    </>
  );
}

export function PaginationBar({
  result,
  params,
  onChange,
}: {
  result?: { page: number; totalPages: number; total: number };
  params: SellerQueryParams;
  onChange: (params: SellerQueryParams) => void;
}) {
  if (!result) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3 text-sm text-muted-foreground">
      <span>{result.total} total</span>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={(params.page || 1) <= 1}
          className="border-border bg-muted text-foreground hover:bg-muted"
          onClick={() =>
            onChange({ ...params, page: Math.max(1, (params.page || 1) - 1) })
          }
        >
          Previous
        </Button>
        <span>
          Page {result.page} / {Math.max(1, result.totalPages)}
        </span>
        <Button
          size="sm"
          variant="outline"
          disabled={(params.page || 1) >= result.totalPages}
          className="border-border bg-muted text-foreground hover:bg-muted"
          onClick={() => onChange({ ...params, page: (params.page || 1) + 1 })}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

export function text(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function numberValue(form: FormData, key: string) {
  const raw = text(form, key);
  if (!raw) return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

export function list(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function files(form: FormData, key: string) {
  return form
    .getAll(key)
    .filter((item): item is File => item instanceof File && item.size > 0);
}

export function parseRows(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount);
}

export function formatDate(value?: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(
    new Date(value)
  );
}

export function dateInput(value?: string) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

export function payoutMethodLabel(method: SellerPayoutMethod) {
  if (method.type === "BANK") {
    const account = method.bank?.accountNumber || "";
    return (
      [
        method.bank?.bankName,
        account ? `A/C ${account.slice(-4)}` : undefined,
      ]
        .filter(Boolean)
        .join(" - ") || "Bank account"
    );
  }
  if (method.type === "UPI") return method.upi?.upiId || "UPI";
  if (method.type === "PAYPAL") return method.paypal?.email || "PayPal";
  return method.stripeConnect?.accountId || "Stripe Connect";
}
