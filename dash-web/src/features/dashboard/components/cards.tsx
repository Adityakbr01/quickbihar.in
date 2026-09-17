import type { ReactNode } from "react";
import { Settings } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatAmount } from "@/features/dashboard/utils";
import { cn } from "@/lib/utils";
import { managementIconByName } from "./types";
import { FeatureStatusBadge } from "./badges";

export function Metric({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: ReactNode;
}) {
  return (
    <Card className="border-white/10 bg-[#1c1c1c]" size="sm">
      <CardContent className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
        </div>
        <div className="rounded-lg bg-white/5 p-2 text-emerald-300">{icon}</div>
      </CardContent>
    </Card>
  );
}

export function NetworkTile({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <div className="text-xs font-medium uppercase text-gray-500">{title}</div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}

export function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <div className="text-[11px] font-medium uppercase text-gray-500">
        {label}
      </div>
      <div className="mt-1 break-words text-sm text-white">{value}</div>
    </div>
  );
}

export function MiniMoney({ label, value }: { label: string; value?: number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 px-2.5 py-2">
      <div className="text-[11px] uppercase text-gray-500">{label}</div>
      <div className="mt-1 text-sm font-medium text-white">
        Rs. {formatAmount(value || 0)}
      </div>
    </div>
  );
}

export function PayoutSummaryCard({
  title,
  value,
  detail,
  tone,
}: {
  title: string;
  value: string | number;
  detail: string;
  tone: "amber" | "emerald" | "cyan" | "slate";
}) {
  const toneClass = {
    amber: "border-amber-400/20 bg-amber-400/10 text-amber-200",
    emerald: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
    cyan: "border-cyan-400/20 bg-cyan-400/10 text-cyan-200",
    slate: "border-white/10 bg-white/[0.03] text-gray-300",
  }[tone];

  return (
    <Card className="border-white/10 bg-[#1c1c1c]" size="sm">
      <CardContent>
        <div className="text-xs font-medium uppercase text-gray-500">
          {title}
        </div>
        <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
        <div
          className={cn(
            "mt-3 rounded-lg border px-2.5 py-1.5 text-xs",
            toneClass,
          )}
        >
          {detail}
        </div>
      </CardContent>
    </Card>
  );
}

export function ManagementFeatureCard({
  feature,
}: {
  feature: {
    name: string;
    module: string;
    status: "ACTIVE" | "PARTIAL" | "PLANNED";
    note: string;
    route?: string | null;
  };
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="rounded-lg bg-white/5 p-2 text-emerald-300">
            {managementIconByName[feature.name] || (
              <Settings className="h-4 w-4" />
            )}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-white">{feature.name}</div>
            <div className="mt-0.5 text-xs text-gray-500">{feature.module}</div>
          </div>
        </div>
        <FeatureStatusBadge status={feature.status} />
      </div>
      <p className="mt-3 text-sm leading-5 text-gray-400">{feature.note}</p>
      {feature.route && (
        <div className="mt-3 text-xs text-gray-500">{feature.route}</div>
      )}
    </div>
  );
}
