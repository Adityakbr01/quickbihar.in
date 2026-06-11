import type { AdminCategory, AdminOrder } from "../api/catalogManagement.api";
import type {
  DeliveryPartner,
  DeliveryStatus,
} from "@/features/delivery/api/delivery.api";
import * as XLSX from "xlsx";

export const inputClass =
  "w-full border-white/10 bg-white/5 text-white placeholder:text-gray-500";
export const selectClass =
  "h-9 w-full rounded-lg border border-white/10 bg-[#181818] px-2 text-sm text-white outline-none";
export const textareaClass =
  "min-h-20 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-sm text-white outline-none placeholder:text-gray-500";

export type ExportCell = string | number | boolean | null | undefined;
export type ExportRow = ExportCell[];

export function downloadCsv(filename: string, rows: ExportRow[]) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function downloadXlsx(
  filename: string,
  sheets: Record<string, ExportRow[]>,
) {
  const workbook = XLSX.utils.book_new();
  Object.entries(sheets).forEach(([name, rows]) => {
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, sheet, name.slice(0, 31) || "Sheet");
  });
  XLSX.writeFile(workbook, filename);
}

export function formatDate(value?: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function dateInputValue(value?: string) {
  if (!value) return "";
  try {
    return new Date(value).toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

export function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(
    amount || 0,
  );
}

export function numericOrUndefined(value: string) {
  if (value.trim() === "") return undefined;
  const num = Number(value);
  return Number.isNaN(num) ? undefined : num;
}

export function optionalValue(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function splitCsv(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function isExpired(value: string) {
  return new Date(value).getTime() < Date.now();
}

export function parentIdValue(parent?: AdminCategory["parentId"]) {
  if (!parent) return "";
  if (typeof parent === "string") return parent;
  return parent._id;
}

export function parentTitle(parent?: AdminCategory["parentId"]) {
  if (!parent) return "-";
  if (typeof parent === "string") return parent;
  return parent.title;
}

export function deliveryPartnerOf(
  order?: AdminOrder | null,
): DeliveryPartner | null {
  if (!order) return null;
  if (order.deliveryPartner) return order.deliveryPartner;
  if (
    typeof order.delivery?.partnerUserId === "object" &&
    order.delivery.partnerUserId
  ) {
    return order.delivery.partnerUserId;
  }
  return null;
}

export function deliveryStatusLabel(status: DeliveryStatus) {
  return status.replace(/_/g, " ");
}

export function entityId(value: string) {
  const match = value?.match(/\/([^\/]+)$/);
  return match ? match[1] : value;
}

export function formatDateTime(value?: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
