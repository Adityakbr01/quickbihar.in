import type { LucideIcon } from "lucide-react";
import {
  Box,
  Folder,
  CircleUser,
  MapPin,
  ShieldCheck,
  Bell,
  LayoutGrid,
  LogOut,
} from "lucide-react";

export interface AccountSubItem {
  label: string;
  icon: LucideIcon;
  onPressLabel: string;
}

export interface AccountOptionItem {
  label: string;
  icon: LucideIcon;
  onPressLabel?: string;
  subItems?: AccountSubItem[];
  danger?: boolean;
  showArrow?: boolean;
}

export interface AccountSection {
  title: string;
  options: AccountOptionItem[];
}

export const ACCOUNT_SECTIONS: AccountSection[] = [
  {
    title: "Orders & Activity",
    options: [
      {
        label: "My Orders",
        icon: Box,
        onPressLabel: "My Orders",
      },
      {
        label: "Wishlist",
        icon: Folder,
        onPressLabel: "Wishlist",
      },
    ],
  },
  {
    title: "Account & Settings",
    options: [
      {
        label: "Profile Info",
        icon: CircleUser,
        onPressLabel: "Profile Info",
      },
      {
        label: "Saved Addresses",
        icon: MapPin,
        onPressLabel: "Addresses",
      },
      {
        label: "Security & Password",
        icon: ShieldCheck,
        onPressLabel: "PasswordSetup",
      },
      {
        label: "Notifications",
        icon: Bell,
        onPressLabel: "Notifications",
      },
      {
        // Admin-only — visibility is gated in AccountMain.tsx by role.
        // Opens the web admin in the system browser (no JWT handoff).
        label: "Web Admin Dashboard",
        icon: LayoutGrid,
        onPressLabel: "WebAdminDashboard",
      },
    ],
  },
];

export const LOGOUT_OPTION: AccountOptionItem = {
  label: "Logout",
  icon: LogOut,
  onPressLabel: "Logout",
  danger: true,
  showArrow: false,
};
