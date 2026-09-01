import {
  Package01Icon,
  FolderFavouriteIcon,
  Location01Icon,
  Notification01Icon,
  Logout01Icon,
  User03Icon,
  Shield01Icon,
  DashboardSquare01Icon,
} from "@hugeicons/core-free-icons";

export interface AccountSubItem {
  label: string;
  icon: any;
  onPressLabel: string;
}

export interface AccountOptionItem {
  label: string;
  icon: any;
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
        icon: Package01Icon,
        onPressLabel: "My Orders",
      },
      {
        label: "Wishlist",
        icon: FolderFavouriteIcon,
        onPressLabel: "Wishlist",
      },
    ],
  },
  {
    title: "Account & Settings",
    options: [
      {
        label: "Profile Info",
        icon: User03Icon,
        onPressLabel: "Profile Info",
      },
      {
        label: "Saved Addresses",
        icon: Location01Icon,
        onPressLabel: "Addresses",
      },
      {
        label: "Security & Password",
        icon: Shield01Icon,
        onPressLabel: "PasswordSetup",
      },
      {
        label: "Notifications",
        icon: Notification01Icon,
        onPressLabel: "Notifications",
      },
      {
        // Admin-only — visibility is gated in AccountMain.tsx by role.
        // Opens the web admin in the system browser (no JWT handoff).
        label: "Web Admin Dashboard",
        icon: DashboardSquare01Icon,
        onPressLabel: "WebAdminDashboard",
      },
    ],
  },
];

export const LOGOUT_OPTION: AccountOptionItem = {
  label: "Logout",
  icon: Logout01Icon,
  onPressLabel: "Logout",
  danger: true,
  showArrow: false,
};
