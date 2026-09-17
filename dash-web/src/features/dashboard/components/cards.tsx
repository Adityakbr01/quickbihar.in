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
    <Card className="border-border bg-card" size="sm">
      <CardContent className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
        </div>
        <div className="rounded-lg bg-muted p-2 text-emerald-700 dark:text-emerald-300">{icon}</div>
      </CardContent>
    </Card>
  );
}

export function NetworkTile({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-muted p-3">
      <div className="text-xs font-medium uppercase text-muted-foreground">{title}</div>
      <div className="mt-2 text-2xl font-semibold text-foreground">{value}</div>
    </div>
  );
}

export function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-muted p-3">
      <div className="text-[11px] font-medium uppercase text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 break-words text-sm text-foreground">{value}</div>
    </div>
  );
}

export function MiniMoney({ label, value }: { label: string; value?: number }) {
  return (
    <div className="rounded-lg border border-border bg-muted px-2.5 py-2">
      <div className="text-[11px] uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium text-foreground">
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
    amber: "border-amber-400/20 bg-amber-400/10 text-amber-800 dark:text-amber-200",
    emerald: "border-emerald-400/20 bg-emerald-400/10 text-emerald-800 dark:text-emerald-200",
    cyan: "border-cyan-400/20 bg-cyan-400/10 text-cyan-800 dark:text-cyan-200",
    slate: "border-border bg-muted text-muted-foreground",
  }[tone];

  return (
    <Card className="border-border bg-card" size="sm">
      <CardContent>
        <div className="text-xs font-medium uppercase text-muted-foreground">
          {title}
        </div>
        <div className="mt-2 text-2xl font-semibold text-foreground">{value}</div>
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
    <div className="rounded-lg border border-border bg-muted p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="rounded-lg bg-muted p-2 text-emerald-700 dark:text-emerald-300">
            {managementIconByName[feature.name] || (
              <Settings className="h-4 w-4" />
            )}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-foreground">{feature.name}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">{feature.module}</div>
          </div>
        </div>
        <FeatureStatusBadge status={feature.status} />
      </div>
      <p className="mt-3 text-sm leading-5 text-muted-foreground">{feature.note}</p>
      {feature.route && (
        <div className="mt-3 text-xs text-muted-foreground">{feature.route}</div>
      )}
    </div>
  );
}
