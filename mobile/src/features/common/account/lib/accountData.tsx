import type { AppIconName } from "@/src/components/common/AppIcon";

export interface AccountSubItem {
  label: string;
  icon: AppIconName;
  onPressLabel: string;
}

export interface AccountOptionItem {
  label: string;
  icon: AppIconName;
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
        icon: "cube-outline",
        onPressLabel: "My Orders",
      },
      {
        label: "Wishlist",
        icon: "folder-outline",
        onPressLabel: "Wishlist",
      },
    ],
  },
  {
    title: "Account & Settings",
    options: [
      {
        label: "Profile Info",
        icon: "person-circle-outline",
        onPressLabel: "Profile Info",
      },
      {
        label: "Saved Addresses",
        icon: "location-outline",
        onPressLabel: "Addresses",
      },
      {
        label: "Security & Password",
        icon: "shield-checkmark-outline",
        onPressLabel: "PasswordSetup",
      },
      {
        label: "Notifications",
        icon: "notifications-outline",
        onPressLabel: "Notifications",
      },
      {
        // Admin-only — visibility is gated in AccountMain.tsx by role.
        // Opens the web admin in the system browser (no JWT handoff).
        label: "Web Admin Dashboard",
        icon: "grid-outline",
        onPressLabel: "WebAdminDashboard",
      },
    ],
  },
];

export const LOGOUT_OPTION: AccountOptionItem = {
  label: "Logout",
  icon: "log-out-outline",
  onPressLabel: "Logout",
  danger: true,
  showArrow: false,
};
