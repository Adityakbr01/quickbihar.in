"use client";

import { ReactNode } from "react";
import {
  Bell,
  Building2,
  ClipboardList,
  Image as ImageIcon,
  LayoutDashboard,
  Package,
  ReceiptText,
  Ruler,
  ShoppingBag,
  Store,
  Tags,
  TicketPercent,
  Users,
  WalletCards,
  Warehouse,
} from "lucide-react";
import type { SellerSetupStatus } from "@/features/seller/api/sellerPanel.api";
import { cn } from "@/lib/utils";

// Import split panels
import { SellerDashboardPanel } from "./SellerDashboardPanel";
import { SellerStoreSetupPanel } from "./SellerStoreSetupPanel";
import { SellerProductsPanel } from "./SellerProductsPanel";
import { SellerCategoriesPanel } from "./SellerCategoriesPanel";
import { SellerInventoryPanel } from "./SellerInventoryPanel";
import { SellerOrdersPanel } from "./SellerOrdersPanel";
import { SellerCouponsPanel } from "./SellerCouponsPanel";
import { SellerCustomersPanel } from "./SellerCustomersPanel";
import { SellerBannersPanel } from "./SellerBannersPanel";
import { SellerSizeChartsPanel } from "./SellerSizeChartsPanel";
import { SellerPayoutsPanel } from "./SellerPayoutsPanel";
import { SellerReportsPanel } from "./SellerReportsPanel";
import { SellerNotificationsPanel } from "./SellerNotificationsPanel";
import { SellerMallPanel } from "./SellerMallPanel";

export const sellerNavigation = [
  {
    title: "Workspace",
    items: [
      { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
      { id: "products", label: "Products", icon: <Package className="h-4 w-4" /> },
      { id: "categories", label: "Categories", icon: <Tags className="h-4 w-4" /> },
      { id: "inventory", label: "Inventory", icon: <Warehouse className="h-4 w-4" /> },
      { id: "orders", label: "Orders", icon: <ClipboardList className="h-4 w-4" /> },
    ],
  },
  {
    title: "Growth",
    items: [
      { id: "coupons", label: "Coupons", icon: <TicketPercent className="h-4 w-4" /> },
      { id: "customers", label: "Customers", icon: <Users className="h-4 w-4" /> },
      { id: "banner", label: "Banner", icon: <ImageIcon className="h-4 w-4" /> },
      { id: "reports", label: "Reports", icon: <ReceiptText className="h-4 w-4" /> },
      { id: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
    ],
  },
  {
    title: "Setup",
    items: [
      { id: "store", label: "Store", icon: <Store className="h-4 w-4" /> },
      { id: "mall", label: "Mall", icon: <Building2 className="h-4 w-4" /> },
      { id: "size-chart", label: "Size Chart", icon: <Ruler className="h-4 w-4" /> },
      { id: "payouts", label: "Payout & Earnings", icon: <WalletCards className="h-4 w-4" /> },
    ],
  },
] as const;

export type SellerSection = (typeof sellerNavigation)[number]["items"][number]["id"];

export const sectionLabels: Record<SellerSection, string> = {
  dashboard: "Dashboard",
  products: "Products",
  categories: "Categories",
  inventory: "Inventory",
  orders: "Orders",
  coupons: "Coupons",
  customers: "Customers",
  store: "Store",
  mall: "Mall",
  banner: "Banner",
  "size-chart": "Size Chart",
  payouts: "Payout & Earnings",
  reports: "Reports",
  notifications: "Notifications",
};

export function SellerSidebar({
  activeSection,
  onSectionChange,
}: {
  activeSection: SellerSection;
  onSectionChange: (section: SellerSection) => void;
}) {
  return (
    <aside className="shrink-0 border-b border-white/10 bg-[#101010] lg:h-screen lg:w-72 lg:overflow-hidden lg:border-b-0 lg:border-r">
      <div className="flex h-full flex-col">
        <div className="border-b border-white/10 px-5 py-5">
          <div className="flex items-center gap-2 text-white">
            <ShoppingBag className="h-5 w-5 text-emerald-300" />
            <span className="text-lg font-semibold">Fashion Seller</span>
          </div>
          <p className="mt-1 text-xs text-gray-500">QuickBihar Clothing</p>
        </div>

        <nav className="grid gap-5 p-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
          {sellerNavigation.map((group) => (
            <div key={group.title}>
              <div className="mb-2 px-2 text-xs font-medium uppercase text-gray-500">{group.title}</div>
              <div className="grid gap-1">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSectionChange(item.id)}
                    className={cn(
                      "flex min-h-10 items-center gap-2 rounded-lg px-3 text-left text-sm text-gray-300 transition hover:bg-white/5 hover:text-white",
                      activeSection === item.id && "bg-emerald-400/10 text-emerald-200 ring-1 ring-emerald-400/20",
                    )}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}

export function SellerSectionRenderer({
  activeSection,
  setup,
}: {
  activeSection: SellerSection;
  setup?: SellerSetupStatus;
}) {
  if (activeSection === "dashboard") return <SellerDashboardPanel />;
  if (activeSection === "store") return <SellerStoreSetupPanel />;
  if (activeSection === "products") return <SellerProductsPanel />;
  if (activeSection === "categories") return <SellerCategoriesPanel />;
  if (activeSection === "inventory") return <SellerInventoryPanel />;
  if (activeSection === "orders") return <SellerOrdersPanel />;
  if (activeSection === "coupons") return <SellerCouponsPanel />;
  if (activeSection === "customers") return <SellerCustomersPanel />;
  if (activeSection === "banner") return <SellerBannersPanel />;
  if (activeSection === "size-chart") return <SellerSizeChartsPanel />;
  if (activeSection === "payouts") return <SellerPayoutsPanel setup={setup} />;
  if (activeSection === "reports") return <SellerReportsPanel />;
  if (activeSection === "notifications") return <SellerNotificationsPanel />;
  return <SellerMallPanel setup={setup} />;
}
