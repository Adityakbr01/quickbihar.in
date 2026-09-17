import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ManagementStatus, PayoutStatus } from "@/features/dashboard/api/adminManagement.api";
import { cn } from "@/lib/utils";

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
      {label}
    </Badge>
  );
}

export function RoleBadge({ role }: { role: string }) {
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
  return (
    <Badge
      variant="outline"
      className={
        isAdmin
          ? "border-cyan-400/30 text-cyan-300"
          : "border-white/10 text-gray-300"
      }
    >
      {isAdmin && <ShieldCheck className="h-3 w-3" />}
      {role}
    </Badge>
  );
}

export function FeatureStatusBadge({ status }: { status: ManagementStatus }) {
  const label =
    status === "ACTIVE"
      ? "Active"
      : status === "PARTIAL"
        ? "Partial"
        : "Planned";
  return (
    <Badge variant="outline" className={statusClass(status)}>
      {label}
    </Badge>
  );
}

function statusClass(status: ManagementStatus) {
  if (status === "ACTIVE") return "border-emerald-400/30 text-emerald-300";
  if (status === "PARTIAL") return "border-amber-400/30 text-amber-300";
  return "border-sky-400/30 text-sky-300";
}

export function SubmissionStatusBadge({ status }: { status: string }) {
  const isApproved = status === "APPROVED";
  const isPending =
    status === "PENDING_REVIEW" || status === "PENDING" || status === "DRAFT";
  return (
    <Badge
      variant="outline"
      className={cn(
        isApproved && "border-emerald-400/30 text-emerald-300",
        isPending && "border-amber-400/30 text-amber-300",
        !isApproved && !isPending && "border-red-400/30 text-red-300",
      )}
    >
      {status}
    </Badge>
  );
}

export function PayoutStatusBadge({ status }: { status: PayoutStatus }) {
  const className = {
    PENDING: "border-amber-400/30 text-amber-300",
    PROCESSING: "border-cyan-400/30 text-cyan-300",
    PAID: "border-emerald-400/30 text-emerald-300",
    FAILED: "border-red-400/30 text-red-300",
  }[status];

  return (
    <Badge variant="outline" className={className}>
      {status}
    </Badge>
  );
}

export function PayoutPartnerBadge({ type }: { type: string }) {
  return (
    <Badge
      variant="outline"
      className={
        type === "DELIVERY"
          ? "border-cyan-400/30 text-cyan-300"
          : "border-purple-400/30 text-purple-300"
      }
    >
      {type}
    </Badge>
  );
}
