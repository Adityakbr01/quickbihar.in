import type { ReactNode } from "react";
import {
  BarChart3,
  Building2,
  CircleDollarSign,
  ClipboardList,
  Database,
  FileText,
  Image as ImageIcon,
  LayoutDashboard,
  MailPlus,
  Megaphone,
  Package,
  Ruler,
  Settings,
  ShieldCheck,
  Store,
  Tags,
  Truck,
  Users,
  WalletCards,
} from "lucide-react";

export type AdminSection =
  | "overview"
  | "orders"
  | "products"
  | "categories"
  | "coupons"
  | "store-configuration"
  | "content-management"
  | "marketing-promotions"
  | "inventory-logistics"
  | "reports-analytics"
  | "system-settings"
  | "people"
  | "seller-mall"
  | "seller-submissions"
  | "payouts"
  | "invites"
  | "policies"
  | "size-charts"
  | "banners";

export type RoleFilter = (typeof roleOptions)[number];
export type StatusFilter = (typeof statusOptions)[number];

export const roleOptions = [
  "ALL",
  "USER",
  "SELLER",
  "DELIVERY",
  "ADMIN",
  "SUPER_ADMIN",
] as const;

export const statusOptions = [
  "all",
  "active",
  "blocked",
  "verified",
  "unverified",
] as const;

export const inputClass =
  "border-white/10 bg-white/5 text-white placeholder:text-gray-500";
export const selectClass =
  "h-8 rounded-lg border border-white/10 bg-[#181818] px-2 text-sm text-white outline-none";
export const textareaClass =
  "min-h-20 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-sm text-white outline-none placeholder:text-gray-500";

export const sectionLabels: Record<AdminSection, string> = {
  overview: "Overview",
  orders: "Order Management",
  products: "Product Management",
  categories: "Category Management",
  coupons: "Coupon & Discount Management",
  "store-configuration": "Store Configuration",
  "content-management": "Content Management",
  "marketing-promotions": "Marketing & Promotions",
  "inventory-logistics": "Inventory & Logistics",
  "reports-analytics": "Reports & Analytics",
  "system-settings": "System Settings",
  people: "User Management",
  "seller-mall": "Seller & Mall Management",
  "seller-submissions": "Seller Review Queue",
  payouts: "Payouts",
  invites: "Invites",
  policies: "Global Policies",
  "size-charts": "Size Charts",
  banners: "Banners",
};

export const navigationGroups: Array<{
  title: string;
  items: Array<{ id: AdminSection; label: string; icon: ReactNode }>;
}> = [
  {
    title: "Analytics",
    items: [
      {
        id: "overview",
        label: "Overview",
        icon: <LayoutDashboard className="h-4 w-4" />,
      },
      {
        id: "reports-analytics",
        label: "Reports & Insights",
        icon: <BarChart3 className="h-4 w-4" />,
      },
    ],
  },
  {
    title: "Catalog & Sales",
    items: [
      {
        id: "orders",
        label: "Orders",
        icon: <ClipboardList className="h-4 w-4" />,
      },
      {
        id: "products",
        label: "Products",
        icon: <Package className="h-4 w-4" />,
      },
      {
        id: "categories",
        label: "Categories",
        icon: <Tags className="h-4 w-4" />,
      },
      {
        id: "inventory-logistics",
        label: "Inventory Center",
        icon: <Truck className="h-4 w-4" />,
      },
    ],
  },
  {
    title: "Marketing & CMS",
    items: [
      {
        id: "coupons",
        label: "Coupons & Discounts",
        icon: <CircleDollarSign className="h-4 w-4" />,
      },
      {
        id: "banners",
        label: "Banners Management",
        icon: <ImageIcon className="h-4 w-4" />,
      },
      {
        id: "marketing-promotions",
        label: "Marketing Campaigns",
        icon: <Megaphone className="h-4 w-4" />,
      },
      {
        id: "content-management",
        label: "Content Center",
        icon: <FileText className="h-4 w-4" />,
      },
    ],
  },
  {
    title: "Users & Malls",
    items: [
      {
        id: "people",
        label: "User Directory",
        icon: <Users className="h-4 w-4" />,
      },
      {
        id: "seller-mall",
        label: "Sellers & Malls",
        icon: <Building2 className="h-4 w-4" />,
      },
      {
        id: "seller-submissions",
        label: "Sellers Review Queue",
        icon: <ShieldCheck className="h-4 w-4" />,
      },
      {
        id: "payouts",
        label: "Payouts & Wallets",
        icon: <WalletCards className="h-4 w-4" />,
      },
    ],
  },
  {
    title: "Store Config & System",
    items: [
      {
        id: "store-configuration",
        label: "General Settings",
        icon: <Settings className="h-4 w-4" />,
      },
      {
        id: "policies",
        label: "Global Policies",
        icon: <FileText className="h-4 w-4" />,
      },
      {
        id: "size-charts",
        label: "Size Charts",
        icon: <Ruler className="h-4 w-4" />,
      },
      {
        id: "system-settings",
        label: "System Core",
        icon: <Database className="h-4 w-4" />,
      },
      {
        id: "invites",
        label: "Invites Console",
        icon: <MailPlus className="h-4 w-4" />,
      },
    ],
  },
];

export const managementIconByName: Record<string, ReactNode> = {
  "Order Management": <ClipboardList className="h-4 w-4" />,
  "Product Management": <Package className="h-4 w-4" />,
  "Category Management": <Tags className="h-4 w-4" />,
  "Coupon & Discount Management": <CircleDollarSign className="h-4 w-4" />,
  "Banner Management": <ImageIcon className="h-4 w-4" />,
  "Size Chart Management": <Ruler className="h-4 w-4" />,
  "User Management": <Users className="h-4 w-4" />,
  "Seller Management": <Store className="h-4 w-4" />,
  "Mall Management": <Building2 className="h-4 w-4" />,
};
