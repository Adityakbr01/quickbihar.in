import {
  Package01Icon,
  User03Icon, AddInvoiceIcon,
  Shield01Icon,
  DashboardCircleSettingsIcon,
  Coupon02Icon
} from "@hugeicons/core-free-icons";

export interface AdminCardItem {
  title: string;
  description: string;
  icon: any;
  color: string;
  route?: string;
}

export const ADMIN_CARDS: AdminCardItem[] = [
  {
    title: "Coupons CRUD",
    description: "Manage promo codes and special offers",
    icon: Coupon02Icon,
    color: "#F97316",
    route: "/admin/coupons",
  },
  {
    title: "Products CRUD",
    description: "Manage inventory, variants and images",
    icon: Package01Icon,
    color: "#6366F1",
    route: "/admin/products",
  },

  {
    title: "Categories CRUD",
    description: "Manage and organize product categories",
    icon: DashboardCircleSettingsIcon,
    color: "#8B5CF6",
    route: "/admin/categories",
  },
  {
    title: "Banners CRUD",
    description: "Manage promotional home banners",
    icon: DashboardCircleSettingsIcon,
    color: "#F59E0B",
    route: "/admin/banners",
  },
  {
    title: "Size Charts CRUD",
    description: "Manage product measurements & sizes",
    icon: AddInvoiceIcon,
    color: "#EC4899",
    route: "/admin/size-charts",
  },
  {
    title: "User Management",
    description: "Control user roles and permissions",
    icon: User03Icon,
    color: "#10B981",
    route: "/admin/users",
  },
  {
    title: "Security & Logs",
    description: "Monitor system health and security",
    icon: Shield01Icon,
    color: "#EF4444",
    route: "/admin/security",
  },

];
