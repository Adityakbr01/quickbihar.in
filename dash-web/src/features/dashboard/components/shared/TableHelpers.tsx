import React from "react";
import { Search, RefreshCcw, Package, CheckCircle2, XCircle, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { DeliveryStatus } from "@/features/delivery/api/delivery.api";
import { inputClass, selectClass, deliveryStatusLabel } from "../../utils";

export function ManagementToolbar({
  title,
  search,
  onSearch,
  status,
  statuses,
  onStatus,
  sortBy,
  sortOptions,
  onSortBy,
  sortOrder,
  onSortOrder,
  onRefresh,
  extraAction,
}: {
  title: string;
  search: string;
  onSearch: (value: string) => void;
  status: string;
  statuses: Array<{ value: string; label: string }>;
  onStatus: (value: string) => void;
  sortBy: string;
  sortOptions: Array<{ value: string; label: string }>;
  onSortBy: (value: string) => void;
  sortOrder: "asc" | "desc";
  onSortOrder: (value: "asc" | "desc") => void;
  onRefresh: () => void;
  extraAction?: React.ReactNode;
}) {
  return (
    <Card className="border-white/10 bg-[#1c1c1c]">
      <CardHeader className="gap-4 border-b border-white/10 md:flex-row md:items-center md:justify-between">
        <CardTitle className="text-base text-white">{title}</CardTitle>
        <div className="flex flex-wrap gap-2">
          {extraAction}
          <Button
            variant="outline"
            className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            onClick={onRefresh}
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-2 md:grid-cols-[1fr_160px_160px_120px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search"
            className={`${inputClass} pl-8`}
          />
        </div>
        <select
          value={status}
          onChange={(event) => onStatus(event.target.value)}
          className={selectClass}
        >
          {statuses.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(event) => onSortBy(event.target.value)}
          className={selectClass}
        >
          {sortOptions.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <select
          value={sortOrder}
          onChange={(event) =>
            onSortOrder(event.target.value as "asc" | "desc")
          }
          className={selectClass}
        >
          <option value="desc">Desc</option>
          <option value="asc">Asc</option>
        </select>
      </CardContent>
    </Card>
  );
}

export function PaginationFooter({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-[#1c1c1c] px-4 py-3">
      <div className="text-sm text-gray-400">
        Page {page} of {Math.max(totalPages, 1)}
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="border-white/10 bg-white/5 text-white hover:bg-white/10"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          className="border-white/10 bg-white/5 text-white hover:bg-white/10"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

export function DetailTile({
  title,
  lines,
}: {
  title: string;
  lines: Array<string | undefined>;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <div className="text-xs font-medium uppercase text-gray-500">{title}</div>
      <div className="mt-2 grid gap-1">
        {lines.filter(Boolean).map((line) => (
          <div key={line} className="text-sm text-gray-300">
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}

export function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-gray-400">
      <Package className="h-4 w-4 animate-pulse" />
      {label}
    </div>
  );
}

export function EmptyState({ label }: { label: string }) {
  return <div className="px-4 py-10 text-sm text-gray-400">{label}</div>;
}

export function StatusBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <Badge
      variant="outline"
      className={
        active
          ? "border-emerald-400/30 text-emerald-300"
          : "border-red-400/30 text-red-300"
      }
    >
      {active ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : (
        <XCircle className="h-3 w-3" />
      )}
      {label}
    </Badge>
  );
}

export function DeliveryStatusBadge({ status }: { status: DeliveryStatus }) {
  const active = [
    "ASSIGNED",
    "ACCEPTED",
    "PICKED_UP",
    "OUT_FOR_DELIVERY",
  ].includes(status);
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-white/10 text-gray-300",
        active && "border-cyan-400/30 text-cyan-300",
        status === "DELIVERED" && "border-emerald-400/30 text-emerald-300",
        status === "CANCELLED" && "border-red-400/30 text-red-300",
      )}
    >
      <Truck className="h-3 w-3" />
      {deliveryStatusLabel(status)}
    </Badge>
  );
}
