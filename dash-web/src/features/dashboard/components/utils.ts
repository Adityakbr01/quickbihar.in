import type {
  ManagedPerson,
  PartnerProfile,
  PartnerType,
  Payout,
  PayoutMethod,
  SellerSubmission,
  ManagementGroup,
} from "@/features/dashboard/api/adminManagement.api";
import {
  formatDate,
  formatAmount,
  optionalValue,
} from "@/features/dashboard/utils";

export {
  formatDate,
  formatAmount,
  optionalValue,
};

export const inputClass =
  "border-white/10 bg-white/5 text-white placeholder:text-gray-500";
export const selectClass =
  "h-8 rounded-lg border border-white/10 bg-[#181818] px-2 text-sm text-white outline-none";
export const textareaClass =
  "min-h-20 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-sm text-white outline-none placeholder:text-gray-500";

export function countBadgeClass(count: number, isActive?: boolean) {
  if (isActive) {
    return "border-emerald-500/30 bg-emerald-500/20 text-emerald-400 shadow-sm";
  }
  if (count >= 15) {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-200 shadow-emerald-500/10";
  }
  if (count <= 5) {
    return "border-red-400/30 bg-red-400/10 text-red-200 shadow-red-500/10";
  }
  return "border-amber-400/30 bg-amber-400/10 text-amber-200 shadow-amber-500/10";
}

export function formatSidebarCount(count: number) {
  return count > 99 ? "99+" : count;
}

export function submissionTitle(submission: SellerSubmission) {
  return (
    submission.title ||
    submission.name ||
    submission.code ||
    submission.requestedPrimaryCategory ||
    submission.category ||
    submission._id
  );
}

export function submissionStatus(submission: SellerSubmission) {
  return submission.approvalStatus || submission.status || "PENDING_REVIEW";
}

export function submissionSeller(submission: SellerSubmission) {
  if (typeof submission.sellerId === "object" && submission.sellerId) {
    return {
      name: submission.sellerId.fullName || "Seller",
      email: submission.sellerId.email || "",
    };
  }
  return {
    name: "Seller",
    email: typeof submission.sellerId === "string" ? submission.sellerId : "",
  };
}

export function submissionStore(submission: SellerSubmission) {
  if (typeof submission.storeId === "object" && submission.storeId)
    return submission.storeId.name || submission.storeId._id;
  return submission.storeId || "-";
}

export function getPartner(
  person: ManagedPerson,
): { type: PartnerType; profile: PartnerProfile } | null {
  if (person.sellerProfile)
    return { type: "SELLER", profile: person.sellerProfile };
  if (person.deliveryProfile)
    return { type: "DELIVERY", profile: person.deliveryProfile };
  return null;
}

export function numericValue(value: string) {
  if (value.trim() === "") return undefined;
  return Number(value);
}

export function payoutMethodLabel(method: PayoutMethod) {
  if (method.type === "BANK") {
    const account = method.bank?.accountNumber || "";
    return (
      [method.bank?.bankName, account ? `A/C ${account.slice(-4)}` : undefined]
        .filter(Boolean)
        .join(" - ") || "Bank account"
    );
  }
  if (method.type === "UPI") return method.upi?.upiId || "UPI";
  if (method.type === "PAYPAL") return method.paypal?.email || "PayPal";
  return method.stripeConnect?.accountId || "Stripe Connect";
}

export function payoutPartnerName(payout: Payout) {
  return typeof payout.partnerId === "object" && payout.partnerId
    ? payout.partnerId.fullName || "Partner"
    : "Partner";
}

export function payoutPartnerEmail(payout: Payout) {
  return typeof payout.partnerId === "object" && payout.partnerId
    ? payout.partnerId.email || ""
    : "";
}

export function payoutPartnerId(payout: Payout) {
  return typeof payout.partnerId === "object" && payout.partnerId
    ? payout.partnerId._id || ""
    : "";
}

export function getCatalogGroup(catalog: ManagementGroup[], id: string) {
  return catalog.find((group) => group.id === id);
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
