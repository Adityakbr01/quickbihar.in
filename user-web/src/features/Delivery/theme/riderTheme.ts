import { Ionicons } from "@expo/vector-icons";
import type {
  RiderOffer,
  RiderOrder,
  RiderOrderStatus,
  RiderPayoutMethod,
  RiderProfile,
} from "../api/delivery.api";
import type { HistoryStatusFilter, ProfileForm, ProofState, RiderTab } from "../types/rider.types";

export const activeStatuses = [
  "RIDER_ASSIGNED",
  "RIDER_ARRIVING",
  "RIDER_REACHED_STORE",
  "PICKED_UP",
  "IN_TRANSIT",
  "NEAR_CUSTOMER",
];

export const historyStatusFilters: HistoryStatusFilter[] = [
  { label: "All", value: "ALL" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
  { label: "Rider Cancelled", value: "RIDER_CANCELLED" },
  { label: "Failed", value: "DELIVERY_FAILED" },
];

export const riderTabs: Array<{ id: RiderTab; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { id: "overview", label: "Overview", icon: "grid-outline" },
  { id: "jobs", label: "Jobs", icon: "briefcase-outline" },
  { id: "history", label: "History", icon: "time-outline" },
  { id: "earnings", label: "Earnings", icon: "wallet-outline" },
  { id: "profile", label: "Profile", icon: "person-outline" },
];

export const emptyProof: ProofState = {
  pickupOtp: "",
  pickupPhoto: "",
  deliveryOtp: "",
  deliveryPhoto: "",
};

export const emptyProfileForm: ProfileForm = {
  phone: "",
  vehicleType: "",
  vehicleNumber: "",
  licenseNumber: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  accountNumber: "",
  ifsc: "",
  bankName: "",
  pan: "",
  upi: "",
  aadhar: "",
};

export const money = (amount?: number) =>
  `Rs. ${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount || 0)}`;

export const label = (value?: string) => (value || "-").replace(/_/g, " ");

export const dateToInputValue = (date: Date) => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

export const isoToday = () => dateToInputValue(new Date());

export const isoDateDaysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return dateToInputValue(date);
};

export const dateInputToDate = (value?: string) => {
  const fallback = new Date();
  if (!value) return fallback;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return fallback;
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? fallback : date;
};

export const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export const errorMessage = (error: any, fallback: string) =>
  error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback;

export const storeNameOf = (offer: any) =>
  offer?.metadata?.storeName || offer?.storeName || offer?.subOrder?.storeId?.name || "Pickup store";

export const normalizedOffer = (offer: any): RiderOffer => ({
  ...offer,
  _id: offer?._id || offer?.offerId,
  offerId: offer?.offerId,
  subOrderId: offer?.subOrderId,
  status: offer?.status || "OPEN",
  stage: Number(offer?.stage || 1),
  radiusKm: Number(offer?.radiusKm || 0),
  payoutAmount: Number(offer?.payoutAmount || 0),
  distanceKm: offer?.distanceKm,
  riderDistanceToStoreKm: offer?.riderDistanceToStoreKm,
  expiresAt: offer?.expiresAt || new Date().toISOString(),
  metadata: {
    ...(offer?.metadata || {}),
    storeName: storeNameOf(offer),
    storeAddress: offer?.metadata?.storeAddress || offer?.storeAddress,
  },
});

export const subOrderIdOf = (order: any) => order?.subOrderId || order?.orderId || order?._id;

export const customerNameOf = (order: RiderOrder | any) =>
  order?.shippingAddress?.fullName || order?.parentOrderId?.shippingAddress?.fullName || "Customer";

export const cityOf = (order: RiderOrder | any) =>
  order?.shippingAddress?.city || order?.parentOrderId?.shippingAddress?.city || "-";

export const payoutMethodName = (method?: RiderPayoutMethod) => {
  if (!method) return "Payout method";
  if (method.type === "UPI") return method.upi?.upiId || method.displayName || method.label || "UPI";
  const account = method.bank?.accountNumber ? `A/C ${method.bank.accountNumber.slice(-4)}` : undefined;
  return [method.bank?.bankName, account].filter(Boolean).join(" - ") || method.displayName || method.label || "Bank";
};

export const profileToForm = (profile?: RiderProfile | null): ProfileForm => ({
  phone: profile?.phone || "",
  vehicleType: profile?.vehicleType || "",
  vehicleNumber: profile?.vehicleNumber || "",
  licenseNumber: profile?.licenseNumber || "",
  address: profile?.address?.address || "",
  city: profile?.address?.city || "",
  state: profile?.address?.state || "",
  pincode: profile?.address?.pincode || "",
  accountNumber: profile?.bankDetails?.accountNumber || "",
  ifsc: profile?.bankDetails?.ifsc || "",
  bankName: profile?.bankDetails?.bankName || "",
  pan: profile?.bankDetails?.pan || "",
  upi: profile?.bankDetails?.upi || "",
  aadhar: profile?.bankDetails?.aadhar || "",
});

const cleanText = (value?: string) => String(value || "").trim();

export const missingProfileFieldsFromForm = (form: ProfileForm) => {
  const missing: string[] = [];
  if (!cleanText(form.phone)) missing.push("Phone");
  if (!cleanText(form.vehicleType)) missing.push("Vehicle type");
  if (!cleanText(form.vehicleNumber)) missing.push("Vehicle number");
  if (!cleanText(form.licenseNumber)) missing.push("License number");
  if (!cleanText(form.address)) missing.push("Address");
  if (!cleanText(form.city)) missing.push("City");
  if (!cleanText(form.state)) missing.push("State");
  if (!cleanText(form.pincode)) missing.push("Pincode");
  if (!cleanText(form.pan)) missing.push("PAN");
  if (!cleanText(form.aadhar)) missing.push("Aadhar");

  const hasUpi = !!cleanText(form.upi);
  const hasBank = !!cleanText(form.accountNumber) && !!cleanText(form.ifsc) && !!cleanText(form.bankName);
  if (!hasUpi && !hasBank) missing.push("UPI or bank account");
  return missing;
};

export const isRiderApproved = (profile?: RiderProfile | null) =>
  profile?.status === "APPROVED" && !!profile?.isVerified;

export const riderCanAcceptOffers = (profile: RiderProfile | null, form: ProfileForm) =>
  isRiderApproved(profile) && missingProfileFieldsFromForm(form).length === 0;

export const riderOfferBlockReason = (profile: RiderProfile | null, form: ProfileForm) => {
  const missing = missingProfileFieldsFromForm(form);
  if (missing.length) return `First complete your profile. Missing: ${missing.join(", ")}.`;
  if (!isRiderApproved(profile)) return "Your rider profile is pending admin approval.";
  return "Your rider profile is not ready to accept offers.";
};

export const approvalSensitiveProfileChanged = (profile: RiderProfile | null, form: ProfileForm) => {
  if (!profile) return missingProfileFieldsFromForm(form).length > 0;
  const current = profileToForm(profile);
  const comparable = (value: string, uppercase = false) => {
    const next = cleanText(value);
    return uppercase ? next.toUpperCase() : next;
  };
  return [
    comparable(current.phone) !== comparable(form.phone),
    comparable(current.vehicleType) !== comparable(form.vehicleType),
    comparable(current.vehicleNumber, true) !== comparable(form.vehicleNumber, true),
    comparable(current.licenseNumber, true) !== comparable(form.licenseNumber, true),
    comparable(current.address) !== comparable(form.address),
    comparable(current.city) !== comparable(form.city),
    comparable(current.state) !== comparable(form.state),
    comparable(current.pincode) !== comparable(form.pincode),
    comparable(current.accountNumber) !== comparable(form.accountNumber),
    comparable(current.ifsc, true) !== comparable(form.ifsc, true),
    comparable(current.bankName) !== comparable(form.bankName),
    comparable(current.pan, true) !== comparable(form.pan, true),
    comparable(current.upi).toLowerCase() !== comparable(form.upi).toLowerCase(),
    comparable(current.aadhar) !== comparable(form.aadhar),
  ].some(Boolean);
};

export function statusTone(status?: string): "green" | "red" | "amber" | "blue" | "mutedTone" {
  if (!status) return "mutedTone";
  if (["DELIVERED", "COMPLETED", "PAID", "VERIFIED", "DELIVERY_CONFIRMED"].includes(status)) return "green";
  if (["CANCELLED", "REJECTED", "FAILED", "RIDER_CANCELLED", "DELIVERY_FAILED"].includes(status)) return "red";
  if (["PENDING", "PROCESSING", "PENDING_VERIFICATION"].includes(status)) return "amber";
  return "blue";
}

export type RiderHistoryStatus = "ALL" | RiderOrderStatus;
