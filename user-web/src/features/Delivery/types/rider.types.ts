import type { RiderOrderStatus } from "../api/delivery.api";

export type RiderTab = "overview" | "jobs" | "history" | "earnings" | "profile";

export type RiderDialog = {
  title: string;
  message?: string;
  buttons: AlertButtonLike[];
};

export type AlertButtonLike = {
  text: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
};

export type ShowDialog = (title: string, message?: string, buttons?: AlertButtonLike[]) => void;

export type ProofState = {
  pickupOtp: string;
  pickupPhoto: string;
  deliveryOtp: string;
  deliveryPhoto: string;
};

export type ProfileForm = {
  phone: string;
  vehicleType: string;
  vehicleNumber: string;
  licenseNumber: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  accountNumber: string;
  ifsc: string;
  bankName: string;
  pan: string;
  upi: string;
  aadhar: string;
};

export type HistoryStatusFilter = {
  label: string;
  value: "ALL" | RiderOrderStatus;
};

export type RiderStyles = any;
