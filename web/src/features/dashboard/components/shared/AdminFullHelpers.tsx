import React from "react";
import { Plus, RefreshCcw, Search, FileDown, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { inputClass, selectClass } from "../../utils";

export function SectionHeader({
  icon,
  title,
  actionLabel,
  onAction,
  onRefresh,
}: {
  icon: React.ReactNode;
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  onRefresh?: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white">
          {icon}
        </div>
        <h2 className="text-xl font-semibold text-white">{title}</h2>
      </div>
      <div className="flex flex-wrap gap-2">
        {onRefresh && (
          <Button
            variant="outline"
            className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            onClick={onRefresh}
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
        )}
        {actionLabel && onAction && (
          <Button
            className="bg-white text-black hover:bg-gray-200"
            onClick={onAction}
          >
            <Plus className="h-4 w-4" />
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

export function TabButtons({
  tabs,
  value,
  onChange,
}: {
  tabs: Array<{ id: string; label: string }>;
  value: string;
  onChange: (value: any) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <Button
          key={tab.id}
          variant={value === tab.id ? "default" : "outline"}
          className={
            value === tab.id
              ? "bg-white text-black hover:bg-gray-200"
              : "border-white/10 bg-white/5 text-white hover:bg-white/10"
          }
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </Button>
      ))}
    </div>
  );
}

export function ModuleToolbar({
  search,
  status,
  statuses,
  onSearch,
  onStatus,
  onExport,
}: {
  search: string;
  status: string;
  statuses: string[];
  onSearch: (value: string) => void;
  onStatus: (value: string) => void;
  onExport: () => void;
}) {
  return (
    <Card className="border-white/10 bg-[#1c1c1c]">
      <CardContent className="flex flex-col gap-3 p-3 md:flex-row md:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            className={`${inputClass} pl-9`}
            placeholder="Search"
            value={search}
            onChange={(event) => onSearch(event.target.value)}
          />
        </div>
        <select
          className={selectClass}
          value={status}
          onChange={(event) => onStatus(event.target.value)}
        >
          {statuses.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <Button
          variant="outline"
          className="border-white/10 bg-white/5 text-white hover:bg-white/10"
          onClick={onExport}
        >
          <FileDown className="h-4 w-4" />
          Export
        </Button>
      </CardContent>
    </Card>
  );
}

export function StatusBadge({ value }: { value?: string }) {
  const status = value || "UNKNOWN";
  const tone =
    status.includes("ACTIVE") ||
    status.includes("PUBLISHED") ||
    status.includes("SENT") ||
    status.includes("COMPLETED") ||
    status.includes("RESTORED") ||
    status.includes("APPROVED")
      ? "border-emerald-400/30 text-emerald-200"
      : status.includes("DRAFT") ||
        status.includes("PENDING") ||
        status.includes("SCHEDULED")
      ? "border-amber-400/30 text-amber-200"
      : "border-white/10 text-gray-300";
  return (
    <Badge variant="outline" className={tone}>
      {status}
    </Badge>
  );
}

export function LoadingState({ label }: { label: string }) {
  return <div className="p-6 text-center text-sm text-gray-400">{label}</div>;
}

export function EmptyState({ label }: { label: string }) {
  return <div className="p-6 text-center text-sm text-gray-500">{label}</div>;
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
    <div className="flex items-center justify-end gap-2">
      <Button
        variant="outline"
        className="border-white/10 bg-white/5 text-white hover:bg-white/10"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
      >
        Previous
      </Button>
      <span className="text-sm text-gray-400">
        {page} / {Math.max(totalPages, 1)}
      </span>
      <Button
        variant="outline"
        className="border-white/10 bg-white/5 text-white hover:bg-white/10"
        disabled={page >= totalPages}
        onClick={() => onPage(page + 1)}
      >
        Next
      </Button>
    </div>
  );
}

export function splitComma(value?: string | string[]) {
  if (Array.isArray(value)) return value;
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function setDraftField(
  setter: React.Dispatch<React.SetStateAction<Record<string, any>>>,
  key: string,
  value: any
) {
  setter((current) => ({ ...current, [key]: value }));
}

export function toDateTimeInput(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}
