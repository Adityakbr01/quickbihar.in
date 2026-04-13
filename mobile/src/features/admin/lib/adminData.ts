import {
  Package01Icon,
  User03Icon, AddInvoiceIcon,
  Shield01Icon,
  DashboardCircleSettingsIcon
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
    title: "Product Stats",
    description: "Manage and view product performance",
    icon: Package01Icon,
    color: "#6366F1",
    route: "/admin/products",
  },
  {
    title: "User Management",
    description: "Control user roles and permissions",
    icon: User03Icon,
    color: "#10B981",
    route: "/admin/users",
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
    title: "Security & Logs",
    description: "Monitor system health and security",
    icon: Shield01Icon,
    color: "#EF4444",
    route: "/admin/security",
  },

];
