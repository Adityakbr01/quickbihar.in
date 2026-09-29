import { Clock } from "lucide-react";
import React from "react";
import type { Theme } from "@/src/theme/Provider/ThemeProvider";
import type { RiderOrder, RiderOrderStatus } from "../../api/delivery.api";
import { customerNameOf, cityOf, formatDate, historyStatusFilters, money } from "../../theme/riderTheme";
import type { RiderStyles } from "../../types/rider.types";
import { EmptyCard, ProofImages, SectionTitle, StatusPill } from "./RiderShared";
import { RiderDateField } from "./RiderDateField";
import { cn } from "@/src/lib/utils";

export function HistoryPanel({
  styles,
  theme,
  history,
  historyMeta,
  historyStatus,
  historyDateFrom,
  historyDateTo,
  busy,
  onStatusChange,
  onDateFromChange,
  onDateToChange,
  onLoadMore,
}: {
  styles: RiderStyles;
  theme: Theme;
  history: RiderOrder[];
  historyMeta: { page: number; totalPages: number; total: number };
  historyStatus: "ALL" | RiderOrderStatus;
  historyDateFrom: string;
  historyDateTo: string;
  busy: boolean;
  onStatusChange: (status: "ALL" | RiderOrderStatus) => void;
  onDateFromChange: (date: string) => void;
  onDateToChange: (date: string) => void;
  onLoadMore: () => void;
}) {
  void styles;
  return (
    <div className="flex flex-col gap-3.5">
      <SectionTitle styles={styles} title="Order History" meta={`${historyMeta.total} records`} />
      <div className="flex flex-row gap-2 overflow-x-auto pr-[18px]">
        {historyStatusFilters.map((item) => {
          const selected = historyStatus === item.value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onStatusChange(item.value)}
              className={cn("min-h-[36px] shrink-0 cursor-pointer rounded-full border px-3 py-2")}
              style={{
                backgroundColor: selected ? theme.primary : theme.secondaryBackground,
                borderColor: selected ? theme.primary : theme.border,
              }}
            >
              <span
                className="text-xs font-extrabold"
                style={{ color: selected ? "#fff" : theme.secondaryText }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex flex-row gap-2.5">
        <RiderDateField styles={styles} theme={theme} label="From" value={historyDateFrom} onChange={onDateFromChange} />
        <RiderDateField styles={styles} theme={theme} label="To" value={historyDateTo} onChange={onDateToChange} />
      </div>
      {history.length === 0 ? (
        <EmptyCard styles={styles} theme={theme} icon={Clock} label="No history found for this filter." />
      ) : (
        history.map((order) => (
          <div
            key={order._id}
            className="flex flex-col gap-2 rounded-2xl border p-3.5"
            style={{ backgroundColor: theme.secondaryBackground, borderColor: theme.border }}
          >
            <div className="flex flex-row items-center justify-between gap-2.5">
              <div className="min-w-0 flex-1">
                <span className="block text-[15px] font-extrabold" style={{ color: theme.text }}>
                  {order.orderId}
                </span>
                <span className="block text-[13px] leading-[18px]" style={{ color: theme.secondaryText }}>
                  {customerNameOf(order)} - {cityOf(order)}
                </span>
              </div>
              <StatusPill styles={styles} status={order.status} />
            </div>
            <div className="mt-1 flex flex-row flex-wrap gap-2">
              <span
                className="rounded-[10px] px-2 py-1 text-xs"
                style={{ color: theme.secondaryText, backgroundColor: theme.tertiaryBackground }}
              >
                {money(order.delivery?.payoutAmount || 0)} payout
              </span>
              <span
                className="rounded-[10px] px-2 py-1 text-xs"
                style={{ color: theme.secondaryText, backgroundColor: theme.tertiaryBackground }}
              >
                {formatDate(order.updatedAt)}
              </span>
            </div>
            <ProofImages styles={styles} pickupPhoto={order.delivery?.pickupPhoto} deliveryPhoto={order.delivery?.deliveryPhoto} />
          </div>
        ))
      )}
      {historyMeta.page < historyMeta.totalPages && (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={busy}
          className="flex min-h-[46px] w-full cursor-pointer items-center justify-center rounded-[14px] border disabled:cursor-not-allowed disabled:opacity-60"
          style={{ backgroundColor: theme.secondaryBackground, borderColor: theme.border }}
        >
          <span className="font-extrabold" style={{ color: theme.text }}>
            Load More
          </span>
        </button>
      )}
    </div>
  );
}
