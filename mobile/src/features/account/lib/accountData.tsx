import {
  Package01Icon,
  DeliveryTruck01Icon,
  PackageReceive01Icon,
  FolderFavouriteIcon,
  ShoppingCartCheck01Icon,
  AiViewIcon,
  Location01Icon,
  CreditCardPosIcon,
  Notification01Icon,
  Settings01Icon,
  HelpCircleIcon,
  Logout01Icon,
  User03Icon,
  Shield01Icon,
  InformationCircleIcon,
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
    title: "Orders & Track",
    options: [
      {
        label: "Orders History",
        icon: Package01Icon,
        subItems: [
          {
            label: "My Orders",
            icon: Package01Icon,
            onPressLabel: "My Orders",
          },
          {
            label: "Returns",
            icon: PackageReceive01Icon,
            onPressLabel: "Returns",
          },
        ],
      },
    ],
  },
  {
    title: "My Shopping",
    options: [
      {
        label: "Wishlist",
        icon: FolderFavouriteIcon,
        onPressLabel: "Wishlist",
      },
      {
        label: "Saved Items",
        icon: ShoppingCartCheck01Icon,
        onPressLabel: "Saved Items",
      },
      {
        label: "Recently Viewed",
        icon: AiViewIcon,
        onPressLabel: "Recently Viewed",
      },
    ],
  },
  {
    title: "Settings & Privacy",
    options: [
      {
        label: "Personal Details",
        icon: User03Icon,
        subItems: [
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
            label: "Payment Methods",
            icon: CreditCardPosIcon,
            onPressLabel: "Payments",
          },
        ],
      },
      {
        label: "App Preferences",
        icon: Settings01Icon,
        subItems: [
          {
            label: "Notifications",
            icon: Notification01Icon,
            onPressLabel: "Notifications",
          },
          {
            label: "Security",
            icon: Shield01Icon,
            onPressLabel: "Security",
          },
          {
            label: "Privacy Policy",
            icon: InformationCircleIcon,
            onPressLabel: "Privacy",
          },
        ],
      },
      {
        label: "Help & Support",
        icon: HelpCircleIcon,
        onPressLabel: "Help",
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
