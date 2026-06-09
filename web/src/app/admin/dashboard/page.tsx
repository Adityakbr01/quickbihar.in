"use client";

import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Ban,
  BarChart3,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  Database,
  FileText,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  MailPlus,
  Megaphone,
  Package,
  RefreshCcw,
  Ruler,
  Save,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Store,
  Tags,
  Truck,
  Users,
  WalletCards,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CategoryManagementPanel,
  CouponManagementPanel,
  OrderManagementPanel,
  ProductManagementPanel,
} from "@/features/dashboard/components/AdminCatalogModules";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuthStore } from "@/features/auth/store/authStore";
import {
  AdminRole,
  AppConfig,
  DashboardStats,
  Mall,
  ManagedPerson,
  ManagementGroup,
  ManagementStatus,
  PartnerProfile,
  PartnerType,
  Payout,
  PayoutMethod,
  PayoutStatus,
  SellerMallRequest,
} from "@/features/dashboard/api/adminManagement.api";
import {
  useAdminDashboard,
  useAppConfig,
  useAssignSellerMall,
  useCreateMall,
  useCreatePayout,
  useDeactivateMall,
  useManagementCatalog,
  useManagedPeople,
  useMallCreationRequests,
  useMallRequests,
  useMalls,
  usePayoutMethods,
  usePayouts,
  useReviewMallRequest,
  useReviewMallCreation,
  useReviewPayoutMethod,
  useSendInvite,
  useSetBlocked,
  useUpdateAppConfig,
  useUpdateMall,
  useUpdatePartnerStatus,
  useUpdatePayoutStatus,
} from "@/features/dashboard/hooks/useAdminManagement";
import { cn } from "@/lib/utils";

type AdminSection =
  | "overview"
  | "core-management"
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
  | "payouts"
  | "invites";
type RoleFilter = (typeof roleOptions)[number];
type StatusFilter = (typeof statusOptions)[number];

const roleOptions = ["ALL", "USER", "SELLER", "DELIVERY", "ADMIN", "SUPER_ADMIN"] as const;
const statusOptions = ["all", "active", "blocked", "verified", "unverified"] as const;
const inputClass = "border-white/10 bg-white/5 text-white placeholder:text-gray-500";
const selectClass = "h-8 rounded-lg border border-white/10 bg-[#181818] px-2 text-sm text-white outline-none";

const sectionLabels: Record<AdminSection, string> = {
  overview: "Overview",
  "core-management": "Core Management",
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
  payouts: "Payouts",
  invites: "Invites",
};

const navigationGroups: Array<{
  title: string;
  items: Array<{ id: AdminSection; label: string; icon: ReactNode }>;
}> = [
  {
    title: "Dashboard",
    items: [{ id: "overview", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> }],
  },
  {
    title: "Core Management",
    items: [
      { id: "core-management", label: "Core Directory", icon: <ShoppingBag className="h-4 w-4" /> },
      { id: "orders", label: "Orders", icon: <ClipboardList className="h-4 w-4" /> },
      { id: "products", label: "Products", icon: <Package className="h-4 w-4" /> },
      { id: "categories", label: "Categories", icon: <Tags className="h-4 w-4" /> },
      { id: "coupons", label: "Coupons", icon: <CircleDollarSign className="h-4 w-4" /> },
      { id: "people", label: "Users", icon: <Users className="h-4 w-4" /> },
      { id: "seller-mall", label: "Sellers & Malls", icon: <Building2 className="h-4 w-4" /> },
      { id: "payouts", label: "Payouts", icon: <WalletCards className="h-4 w-4" /> },
    ],
  },
  {
    title: "Store Configuration",
    items: [{ id: "store-configuration", label: "Store Settings", icon: <Settings className="h-4 w-4" /> }],
  },
  {
    title: "Content Management",
    items: [{ id: "content-management", label: "Content Center", icon: <FileText className="h-4 w-4" /> }],
  },
  {
    title: "Marketing & Promotions",
    items: [{ id: "marketing-promotions", label: "Marketing Center", icon: <Megaphone className="h-4 w-4" /> }],
  },
  {
    title: "Inventory & Logistics",
    items: [{ id: "inventory-logistics", label: "Inventory Center", icon: <Package className="h-4 w-4" /> }],
  },
  {
    title: "Reports & Analytics",
    items: [{ id: "reports-analytics", label: "Reports", icon: <BarChart3 className="h-4 w-4" /> }],
  },
  {
    title: "System Settings",
    items: [
      { id: "system-settings", label: "System Center", icon: <Database className="h-4 w-4" /> },
      { id: "invites", label: "Invites", icon: <MailPlus className="h-4 w-4" /> },
    ],
  },
];

const managementIconByName: Record<string, ReactNode> = {
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

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const [hasHydrated, setHasHydrated] = useState(false);
  const [activeSection, setActiveSection] = useState<AdminSection>("overview");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<RoleFilter>("ALL");
  const [status, setStatus] = useState<StatusFilter>("all");

  const roleName = typeof user?.role === "string" ? user.role : user?.role?.name;
  const isAdminUser = ["ADMIN", "SUPER_ADMIN"].includes(roleName || "");

  useEffect(() => {
    const persistApi = useAuthStore.persist;

    if (!persistApi) {
      queueMicrotask(() => setHasHydrated(true));
      return;
    }

    if (persistApi.hasHydrated()) {
      queueMicrotask(() => setHasHydrated(true));
      return;
    }

    return persistApi.onFinishHydration(() => setHasHydrated(true));
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated || !isAdminUser) {
      router.replace("/admin/login");
    }
  }, [hasHydrated, isAuthenticated, isAdminUser, router]);

  const peopleParams = useMemo(
    () => ({
      role: role === "ALL" ? undefined : role,
      status: status === "all" ? undefined : status,
      search: search || undefined,
    }),
    [role, search, status],
  );
  const allPeopleParams = useMemo(() => ({}), []);

  const dashboardQuery = useAdminDashboard();
  const catalogQuery = useManagementCatalog();
  const appConfigQuery = useAppConfig();
  const peopleQuery = useManagedPeople(peopleParams);
  const allPeopleQuery = useManagedPeople(allPeopleParams);
  const payoutsQuery = usePayouts();
  const payoutMethodsQuery = usePayoutMethods({ status: "PENDING_VERIFICATION" });
  const mallsQuery = useMalls();
  const mallRequestsQuery = useMallRequests();
  const mallCreationRequestsQuery = useMallCreationRequests();
  const setBlocked = useSetBlocked();
  const updatePartnerStatus = useUpdatePartnerStatus();

  const stats = dashboardQuery.data?.stats;
  const people = useMemo(() => peopleQuery.data || [], [peopleQuery.data]);
  const allPeople = useMemo(() => allPeopleQuery.data || [], [allPeopleQuery.data]);
  const malls = useMemo(() => mallsQuery.data || [], [mallsQuery.data]);
  const mallRequests = useMemo(() => mallRequestsQuery.data || [], [mallRequestsQuery.data]);
  const mallCreationRequests = useMemo(() => mallCreationRequestsQuery.data || [], [mallCreationRequestsQuery.data]);
  const managementCatalog = useMemo(() => catalogQuery.data || [], [catalogQuery.data]);
  const payouts = payoutsQuery.data || [];
  const payoutMethods = payoutMethodsQuery.data || [];

  const sellerPeople = useMemo(
    () => allPeople.filter((person) => Boolean(person.sellerProfile)),
    [allPeople],
  );
  const payoutPartners = useMemo(
    () => allPeople.filter((person) => Boolean(person.sellerProfile || person.deliveryProfile)),
    [allPeople],
  );

  const refreshAll = () => {
    dashboardQuery.refetch();
    peopleQuery.refetch();
    allPeopleQuery.refetch();
    payoutsQuery.refetch();
    payoutMethodsQuery.refetch();
    mallsQuery.refetch();
    mallRequestsQuery.refetch();
    mallCreationRequestsQuery.refetch();
    catalogQuery.refetch();
    appConfigQuery.refetch();
  };

  if (!hasHydrated || !isAuthenticated || !isAdminUser) {
    return <div className="min-h-screen bg-[#121212]" />;
  }

  return (
    <main className="dark min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <AdminSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          counts={{
            people: stats?.totalUsers || allPeople.length,
            sellers: stats?.sellers || sellerPeople.length,
            malls: stats?.malls || malls.length,
            payouts: (stats?.pendingPayouts || 0) + (stats?.pendingPayoutMethods || payoutMethods.length),
            mallRequests: (stats?.pendingMallRequests || 0) + (stats?.pendingMallCreations || mallCreationRequests.length),
          }}
        />

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex flex-col gap-3 border-b border-white/10 bg-[#121212] px-4 py-4 md:flex-row md:items-center md:justify-between lg:px-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">Admin Dashboard</h1>
              <p className="text-sm text-gray-400">{sectionLabels[activeSection]}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={refreshAll}
                className="border-white/10 bg-white/5 text-white hover:bg-white/10"
              >
                <RefreshCcw className="h-4 w-4" />
                Refresh
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  clearAuth();
                  router.replace("/admin/login");
                }}
                className="text-gray-300 hover:bg-white/10 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </div>
          </header>

          <ScrollArea className="h-[calc(100vh-81px)] bg-[#121212]">
            <div className="mx-auto w-full max-w-7xl px-4 py-5 lg:px-6">
              {activeSection === "overview" && (
                <OverviewSection
                  stats={stats}
                  payouts={dashboardQuery.data?.recentPayouts || []}
                  malls={malls}
                  topMalls={dashboardQuery.data?.topMalls || []}
                  catalog={managementCatalog}
                />
              )}

              {activeSection === "core-management" && (
                <ManagementGroupSection
                  group={getCatalogGroup(managementCatalog, "core-management")}
                  title="Core Management"
                  isLoading={catalogQuery.isLoading}
                  onOpenSection={setActiveSection}
                  quickLinks={[
                    { label: "Manage Orders", section: "orders" },
                    { label: "Manage Products", section: "products" },
                    { label: "Manage Categories", section: "categories" },
                    { label: "Manage Coupons", section: "coupons" },
                    { label: "Manage Users", section: "people" },
                    { label: "Manage Sellers & Malls", section: "seller-mall" },
                    { label: "Manage Payouts", section: "payouts" },
                  ]}
                />
              )}

              {activeSection === "store-configuration" && (
                <StoreConfigurationSection
                  group={getCatalogGroup(managementCatalog, "store-configuration")}
                  config={appConfigQuery.data}
                  isLoading={appConfigQuery.isLoading || catalogQuery.isLoading}
                />
              )}

              {activeSection === "orders" && <OrderManagementPanel />}

              {activeSection === "products" && <ProductManagementPanel sellers={sellerPeople} />}

              {activeSection === "categories" && <CategoryManagementPanel />}

              {activeSection === "coupons" && <CouponManagementPanel />}

              {activeSection === "content-management" && (
                <ManagementGroupSection
                  group={getCatalogGroup(managementCatalog, "content-management")}
                  title="Content Management"
                  isLoading={catalogQuery.isLoading}
                />
              )}

              {activeSection === "marketing-promotions" && (
                <ManagementGroupSection
                  group={getCatalogGroup(managementCatalog, "marketing-promotions")}
                  title="Marketing & Promotions"
                  isLoading={catalogQuery.isLoading}
                />
              )}

              {activeSection === "inventory-logistics" && (
                <ManagementGroupSection
                  group={getCatalogGroup(managementCatalog, "inventory-logistics")}
                  title="Inventory & Logistics"
                  isLoading={catalogQuery.isLoading}
                />
              )}

              {activeSection === "reports-analytics" && (
                <ManagementGroupSection
                  group={getCatalogGroup(managementCatalog, "reports-analytics")}
                  title="Reports & Analytics"
                  isLoading={catalogQuery.isLoading}
                />
              )}

              {activeSection === "system-settings" && (
                <ManagementGroupSection
                  group={getCatalogGroup(managementCatalog, "system-settings")}
                  title="System Settings"
                  isLoading={catalogQuery.isLoading}
                  onOpenSection={setActiveSection}
                  quickLinks={[
                    { label: "Invite Admin/User", section: "invites" },
                    { label: "Manage Users", section: "people" },
                  ]}
                />
              )}

              {activeSection === "people" && (
                <PeopleSection
                  people={people}
                  isLoading={peopleQuery.isLoading}
                  search={search}
                  role={role}
                  status={status}
                  onSearch={setSearch}
                  onRole={setRole}
                  onStatus={setStatus}
                  onBlock={(person) => setBlocked.mutate({ userId: person._id, isBlocked: !person.isBlocked })}
                  onPartnerStatus={(person, type, partnerStatus) =>
                    updatePartnerStatus.mutate({ userId: person._id, type, status: partnerStatus })
                  }
                />
              )}

              {activeSection === "seller-mall" && (
                <SellerMallSection
                  sellers={sellerPeople}
                  sellersLoading={allPeopleQuery.isLoading}
                  malls={malls}
                  mallsLoading={mallsQuery.isLoading}
                  mallRequests={mallRequests}
                  mallRequestsLoading={mallRequestsQuery.isLoading}
                  mallCreationRequests={mallCreationRequests}
                  mallCreationRequestsLoading={mallCreationRequestsQuery.isLoading}
                  topMalls={dashboardQuery.data?.topMalls || []}
                />
              )}

              {activeSection === "payouts" && (
                <PayoutsSection
                  partners={payoutPartners}
                  payouts={payouts}
                  payoutMethods={payoutMethods}
                  payoutsLoading={payoutsQuery.isLoading}
                  payoutMethodsLoading={payoutMethodsQuery.isLoading}
                />
              )}

              {activeSection === "invites" && <InvitePanel />}
            </div>
          </ScrollArea>
        </section>
      </div>
    </main>
  );
}

function AdminSidebar({
  activeSection,
  counts,
  onSectionChange,
}: {
  activeSection: AdminSection;
  counts: { people: number; sellers: number; malls: number; payouts: number; mallRequests: number };
  onSectionChange: (section: AdminSection) => void;
}) {
  const countBySection: Partial<Record<AdminSection, number>> = {
    people: counts.people,
    "seller-mall": counts.sellers + counts.malls + counts.mallRequests,
    payouts: counts.payouts,
  };

  return (
    <aside className="border-b border-white/10 bg-[#181818] lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:border-b-0 lg:border-r">
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-sm font-bold text-black">QB</div>
        <div>
          <div className="text-sm font-semibold text-white">QuickBihar</div>
          <div className="text-xs text-gray-500">Fashion Admin</div>
        </div>
      </div>
      <nav className="flex gap-2 overflow-x-auto px-3 py-3 lg:flex-col lg:overflow-visible">
        {navigationGroups.map((group) => (
          <div key={group.title} className="flex shrink-0 gap-2 lg:flex-col">
            <div className="hidden px-2 pt-2 text-[11px] font-semibold uppercase tracking-normal text-gray-500 lg:block">
              {group.title}
            </div>
            {group.items.map((section) => (
              <Button
                key={section.id}
                variant="ghost"
                onClick={() => onSectionChange(section.id)}
                className={cn(
                  "h-10 justify-start gap-2 text-gray-300 hover:bg-white/10 hover:text-white",
                  activeSection === section.id && "bg-white text-black hover:bg-white hover:text-black",
                )}
              >
                {section.icon}
                <span>{section.label}</span>
                {countBySection[section.id] !== undefined && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "ml-auto border-white/10 text-gray-400",
                      activeSection === section.id && "border-black/10 text-black",
                    )}
                  >
                    {countBySection[section.id]}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}

function OverviewSection({
  stats,
  payouts,
  malls,
  topMalls,
  catalog,
}: {
  stats?: DashboardStats;
  payouts: Payout[];
  malls: Mall[];
  topMalls: Mall[];
  catalog: ManagementGroup[];
}) {
  return (
    <div className="grid gap-4">
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Metric title="Users" value={stats?.totalUsers || 0} icon={<Users className="h-4 w-4" />} />
        <Metric title="Sellers" value={stats?.sellers || 0} icon={<Store className="h-4 w-4" />} />
        <Metric title="Malls" value={stats?.malls || malls.length} icon={<Building2 className="h-4 w-4" />} />
        <Metric title="Delivery" value={stats?.deliveryBoys || 0} icon={<Truck className="h-4 w-4" />} />
        <Metric title="Pending Partners" value={stats?.pendingPartners || 0} icon={<ShieldCheck className="h-4 w-4" />} />
        <Metric title="Mall Requests" value={stats?.pendingMallRequests || 0} icon={<Building2 className="h-4 w-4" />} />
        <Metric title="Pending Payouts" value={stats?.pendingPayouts || 0} icon={<CircleDollarSign className="h-4 w-4" />} />
        <Metric title="Paid" value={`Rs. ${formatAmount(stats?.totalPaid || 0)}`} icon={<WalletCards className="h-4 w-4" />} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <Card className="border-white/10 bg-[#1c1c1c]">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-base text-white">Mall Network</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-4">
            <NetworkTile title="Active Malls" value={stats?.activeMalls || malls.filter((mall) => mall.isActive).length} />
            <NetworkTile title="Total Malls" value={stats?.malls || malls.length} />
            <NetworkTile title="Seller Links" value={stats?.mallLinkedSellers || 0} />
            <NetworkTile title="Shown In App" value={topMalls.length} />
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[#1c1c1c]">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-base text-white">Recent Payouts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {payouts.length ? payouts.map((payout) => (
              <div key={payout._id} className="flex items-center justify-between border-b border-white/10 pb-3 last:border-0 last:pb-0">
                <div>
                  <div className="text-sm font-medium text-white">{payout.partnerId?.fullName || "Partner"}</div>
                  <div className="text-xs text-gray-500">{payout.partnerType}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-white">Rs. {formatAmount(payout.amount)}</div>
                  <StatusBadge active={payout.status === "PAID"} label={payout.status} />
                </div>
              </div>
            )) : <div className="py-6 text-sm text-gray-400">No payouts recorded.</div>}
          </CardContent>
        </Card>
      </section>

      <ManagementCoverage catalog={catalog} />
    </div>
  );
}

function ManagementCoverage({ catalog }: { catalog: ManagementGroup[] }) {
  if (!catalog.length) return null;

  return (
    <Card className="border-white/10 bg-[#1c1c1c]">
      <CardHeader className="border-b border-white/10">
        <CardTitle className="text-base text-white">Management Coverage</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {catalog.map((group) => (
          <div key={group.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <div className="text-sm font-medium text-white">{group.title}</div>
            <div className="mt-3 flex flex-wrap gap-1">
              <StatusCount label="Active" value={group.summary.active} status="ACTIVE" />
              <StatusCount label="Partial" value={group.summary.partial} status="PARTIAL" />
              <StatusCount label="Planned" value={group.summary.planned} status="PLANNED" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ManagementGroupSection({
  group,
  title,
  isLoading,
  onOpenSection,
  quickLinks = [],
}: {
  group?: ManagementGroup;
  title: string;
  isLoading: boolean;
  onOpenSection?: (section: AdminSection) => void;
  quickLinks?: Array<{ label: string; section: AdminSection }>;
}) {
  if (isLoading) {
    return <div className="py-10 text-sm text-gray-400">Loading management modules...</div>;
  }

  if (!group) {
    return <div className="py-10 text-sm text-gray-400">No management data found for {title}.</div>;
  }

  return (
    <div className="grid gap-4">
      <Card className="border-white/10 bg-[#1c1c1c]">
        <CardHeader className="gap-3 border-b border-white/10 md:flex-row md:items-center md:justify-between">
          <CardTitle className="text-base text-white">{group.title}</CardTitle>
          <div className="flex flex-wrap gap-1">
            <StatusCount label="Active" value={group.summary.active} status="ACTIVE" />
            <StatusCount label="Partial" value={group.summary.partial} status="PARTIAL" />
            <StatusCount label="Planned" value={group.summary.planned} status="PLANNED" />
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {group.features.map((feature) => (
            <ManagementFeatureCard key={feature.name} feature={feature} />
          ))}
        </CardContent>
      </Card>

      {quickLinks.length > 0 && onOpenSection && (
        <Card className="border-white/10 bg-[#1c1c1c]">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-base text-white">Live Operations</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {quickLinks.map((link) => (
              <Button
                key={link.section}
                variant="outline"
                className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                onClick={() => onOpenSection(link.section)}
              >
                {link.label}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ManagementFeatureCard({ feature }: { feature: ManagementGroup["features"][number] }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="rounded-lg bg-white/5 p-2 text-emerald-300">
            {managementIconByName[feature.name] || <Settings className="h-4 w-4" />}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-white">{feature.name}</div>
            <div className="mt-0.5 text-xs text-gray-500">{feature.module}</div>
          </div>
        </div>
        <FeatureStatusBadge status={feature.status} />
      </div>
      <p className="mt-3 text-sm leading-5 text-gray-400">{feature.note}</p>
      {feature.route && <div className="mt-3 text-xs text-gray-500">{feature.route}</div>}
    </div>
  );
}

function StoreConfigurationSection({
  group,
  config,
  isLoading,
}: {
  group?: ManagementGroup;
  config?: AppConfig;
  isLoading: boolean;
}) {
  if (isLoading) {
    return <div className="py-10 text-sm text-gray-400">Loading store configuration...</div>;
  }

  return (
    <div className="grid gap-4">
      {group && (
        <ManagementGroupSection group={group} title="Store Configuration" isLoading={false} />
      )}
      <StoreConfigurationForm key={JSON.stringify(config || {})} initialConfig={config || {}} />
    </div>
  );
}

function StoreConfigurationForm({ initialConfig }: { initialConfig: AppConfig }) {
  const updateAppConfig = useUpdateAppConfig();
  const [storeName, setStoreName] = useState(initialConfig.store?.storeName || "");
  const [appTitle, setAppTitle] = useState(initialConfig.store?.appTitle || "");
  const [metaTitle, setMetaTitle] = useState(initialConfig.seo?.metaTitle || "");
  const [metaDescription, setMetaDescription] = useState(initialConfig.seo?.metaDescription || "");
  const [keywords, setKeywords] = useState((initialConfig.seo?.keywords || []).join(", "));
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(String(initialConfig.shipping?.freeShippingThreshold ?? ""));
  const [shippingFee, setShippingFee] = useState(String(initialConfig.shipping?.shippingFee ?? ""));
  const [taxEnabled, setTaxEnabled] = useState(Boolean(initialConfig.tax?.enabled));
  const [taxRate, setTaxRate] = useState(String(initialConfig.tax?.rate ?? ""));
  const [taxInclusive, setTaxInclusive] = useState(initialConfig.tax?.inclusive ?? true);
  const [currencyCode, setCurrencyCode] = useState(initialConfig.currency?.code || "INR");
  const [currencySymbol, setCurrencySymbol] = useState(initialConfig.currency?.symbol || "Rs.");
  const [defaultRadiusKm, setDefaultRadiusKm] = useState(String(initialConfig.delivery?.defaultRadiusKm ?? ""));
  const [minOrderAmount, setMinOrderAmount] = useState(String(initialConfig.delivery?.minOrderAmount ?? ""));
  const [estimatedMinutes, setEstimatedMinutes] = useState(String(initialConfig.delivery?.estimatedMinutes ?? ""));
  const [returnPolicy, setReturnPolicy] = useState(initialConfig.policies?.returnPolicy || "");
  const [termsAndConditions, setTermsAndConditions] = useState(initialConfig.policies?.termsAndConditions || "");
  const [privacyPolicy, setPrivacyPolicy] = useState(initialConfig.policies?.privacyPolicy || "");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    updateAppConfig.mutate({
      store: {
        storeName: optionalValue(storeName),
        appTitle: optionalValue(appTitle),
      },
      seo: {
        metaTitle: optionalValue(metaTitle),
        metaDescription: optionalValue(metaDescription),
        keywords: keywords.split(",").map((item) => item.trim()).filter(Boolean),
      },
      shipping: {
        freeShippingThreshold: numericValue(freeShippingThreshold),
        shippingFee: numericValue(shippingFee),
      },
      tax: {
        enabled: taxEnabled,
        rate: numericValue(taxRate),
        inclusive: taxInclusive,
      },
      currency: {
        code: currencyCode.trim().toUpperCase(),
        symbol: currencySymbol.trim(),
      },
      delivery: {
        defaultRadiusKm: numericValue(defaultRadiusKm),
        minOrderAmount: numericValue(minOrderAmount),
        estimatedMinutes: numericValue(estimatedMinutes),
      },
      policies: {
        returnPolicy,
        termsAndConditions,
        privacyPolicy,
      },
    });
  };

  return (
    <Card className="border-white/10 bg-[#1c1c1c]">
      <CardHeader className="border-b border-white/10">
        <CardTitle className="text-base text-white">Editable Store Configuration</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-5">
          <div className="grid gap-3 md:grid-cols-2">
            <Input value={storeName} onChange={(event) => setStoreName(event.target.value)} placeholder="Store Name" className={inputClass} />
            <Input value={appTitle} onChange={(event) => setAppTitle(event.target.value)} placeholder="App Title" className={inputClass} />
            <Input value={metaTitle} onChange={(event) => setMetaTitle(event.target.value)} placeholder="Meta Title" className={inputClass} />
            <Input value={keywords} onChange={(event) => setKeywords(event.target.value)} placeholder="Meta Keywords" className={inputClass} />
            <Input value={freeShippingThreshold} onChange={(event) => setFreeShippingThreshold(event.target.value)} placeholder="Free Shipping Threshold" type="number" min="0" className={inputClass} />
            <Input value={shippingFee} onChange={(event) => setShippingFee(event.target.value)} placeholder="Shipping Fee" type="number" min="0" className={inputClass} />
            <Input value={currencyCode} onChange={(event) => setCurrencyCode(event.target.value)} placeholder="Currency Code" maxLength={3} className={inputClass} />
            <Input value={currencySymbol} onChange={(event) => setCurrencySymbol(event.target.value)} placeholder="Currency Symbol" className={inputClass} />
            <Input value={defaultRadiusKm} onChange={(event) => setDefaultRadiusKm(event.target.value)} placeholder="Delivery Radius Km" type="number" min="0" className={inputClass} />
            <Input value={minOrderAmount} onChange={(event) => setMinOrderAmount(event.target.value)} placeholder="Minimum Order Amount" type="number" min="0" className={inputClass} />
            <Input value={estimatedMinutes} onChange={(event) => setEstimatedMinutes(event.target.value)} placeholder="Estimated Delivery Minutes" type="number" min="1" className={inputClass} />
            <Input value={taxRate} onChange={(event) => setTaxRate(event.target.value)} placeholder="Tax Rate %" type="number" min="0" max="100" className={inputClass} />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-gray-300">
              <input type="checkbox" checked={taxEnabled} onChange={(event) => setTaxEnabled(event.target.checked)} />
              Tax enabled
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-gray-300">
              <input type="checkbox" checked={taxInclusive} onChange={(event) => setTaxInclusive(event.target.checked)} />
              Tax inclusive pricing
            </label>
          </div>

          <textarea value={metaDescription} onChange={(event) => setMetaDescription(event.target.value)} placeholder="Meta Description" className="min-h-20 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-sm text-white outline-none placeholder:text-gray-500" />
          <textarea value={returnPolicy} onChange={(event) => setReturnPolicy(event.target.value)} placeholder="Return & Refund Policy" className="min-h-24 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-sm text-white outline-none placeholder:text-gray-500" />
          <textarea value={termsAndConditions} onChange={(event) => setTermsAndConditions(event.target.value)} placeholder="Terms & Conditions" className="min-h-24 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-sm text-white outline-none placeholder:text-gray-500" />
          <textarea value={privacyPolicy} onChange={(event) => setPrivacyPolicy(event.target.value)} placeholder="Privacy Policy" className="min-h-24 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-sm text-white outline-none placeholder:text-gray-500" />

          <div>
            <Button type="submit" disabled={updateAppConfig.isPending}>
              <Save className="h-4 w-4" />
              Save Configuration
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function PeopleSection({
  people,
  isLoading,
  search,
  role,
  status,
  onSearch,
  onRole,
  onStatus,
  onBlock,
  onPartnerStatus,
}: {
  people: ManagedPerson[];
  isLoading: boolean;
  search: string;
  role: RoleFilter;
  status: StatusFilter;
  onSearch: (value: string) => void;
  onRole: (value: RoleFilter) => void;
  onStatus: (value: StatusFilter) => void;
  onBlock: (person: ManagedPerson) => void;
  onPartnerStatus: (person: ManagedPerson, type: PartnerType, status: "APPROVED" | "REJECTED") => void;
}) {
  return (
    <Card className="border-white/10 bg-[#1c1c1c]">
      <CardHeader className="gap-4 border-b border-white/10 md:flex-row md:items-center md:justify-between">
        <CardTitle className="text-base text-white">People</CardTitle>
        <div className="grid gap-2 md:grid-cols-[240px_140px_140px]">
          <Input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search people"
            className={inputClass}
          />
          <select value={role} onChange={(event) => onRole(event.target.value as RoleFilter)} className={selectClass}>
            {roleOptions.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <select value={status} onChange={(event) => onStatus(event.target.value as StatusFilter)} className={selectClass}>
            {statusOptions.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        <PeopleTable
          people={people}
          isLoading={isLoading}
          onBlock={onBlock}
          onPartnerStatus={onPartnerStatus}
        />
      </CardContent>
    </Card>
  );
}

function SellerMallSection({
  sellers,
  sellersLoading,
  malls,
  mallsLoading,
  mallRequests,
  mallRequestsLoading,
  mallCreationRequests,
  mallCreationRequestsLoading,
  topMalls,
}: {
  sellers: ManagedPerson[];
  sellersLoading: boolean;
  malls: Mall[];
  mallsLoading: boolean;
  mallRequests: SellerMallRequest[];
  mallRequestsLoading: boolean;
  mallCreationRequests: Mall[];
  mallCreationRequestsLoading: boolean;
  topMalls: Mall[];
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
      <MallCreatePanel />
      <MallRequestsPanel requests={mallRequests} isLoading={mallRequestsLoading} />
      <MallCreationRequestsPanel requests={mallCreationRequests} isLoading={mallCreationRequestsLoading} />
      <TopMallsPanel malls={topMalls} />
      <MallDirectory malls={malls} isLoading={mallsLoading} />
      <SellerMallAssignments sellers={sellers} malls={malls} isLoading={sellersLoading} />
    </div>
  );
}

function PayoutsSection({
  partners,
  payouts,
  payoutMethods,
  payoutsLoading,
  payoutMethodsLoading,
}: {
  partners: ManagedPerson[];
  payouts: Payout[];
  payoutMethods: PayoutMethod[];
  payoutsLoading: boolean;
  payoutMethodsLoading: boolean;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
      <PayoutPanel partners={partners} />
      <PayoutMethodReviewPanel methods={payoutMethods} isLoading={payoutMethodsLoading} />
      <Card className="border-white/10 bg-[#1c1c1c]">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="text-base text-white">Payout History</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <PayoutTable payouts={payouts} isLoading={payoutsLoading} />
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ title, value, icon }: { title: string; value: string | number; icon: ReactNode }) {
  return (
    <Card className="border-white/10 bg-[#1c1c1c]" size="sm">
      <CardContent className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
        </div>
        <div className="rounded-lg bg-white/5 p-2 text-emerald-300">{icon}</div>
      </CardContent>
    </Card>
  );
}

function NetworkTile({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <div className="text-xs font-medium uppercase text-gray-500">{title}</div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}

function PeopleTable({
  people,
  isLoading,
  onBlock,
  onPartnerStatus,
}: {
  people: ManagedPerson[];
  isLoading: boolean;
  onBlock: (person: ManagedPerson) => void;
  onPartnerStatus: (person: ManagedPerson, type: PartnerType, status: "APPROVED" | "REJECTED") => void;
}) {
  if (isLoading) {
    return <div className="px-4 py-10 text-sm text-gray-400">Loading people...</div>;
  }

  if (!people.length) {
    return <div className="px-4 py-10 text-sm text-gray-400">No people found.</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-white/10 hover:bg-transparent">
          <TableHead className="px-4 text-gray-400">Name</TableHead>
          <TableHead className="text-gray-400">Role</TableHead>
          <TableHead className="text-gray-400">Partner</TableHead>
          <TableHead className="text-gray-400">Mall</TableHead>
          <TableHead className="text-gray-400">Status</TableHead>
          <TableHead className="text-right text-gray-400">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {people.map((person) => {
          const partner = getPartner(person);
          return (
            <TableRow key={person._id} className="border-white/10 hover:bg-white/[0.03]">
              <TableCell className="px-4">
                <div className="font-medium text-white">{person.fullName}</div>
                <div className="text-xs text-gray-500">{person.email}</div>
              </TableCell>
              <TableCell><RoleBadge role={person.role} /></TableCell>
              <TableCell>
                {partner ? (
                  <div className="space-y-1">
                    <Badge variant="outline" className="border-white/10 text-gray-300">{partner.type}</Badge>
                    <div className="text-xs text-gray-500">{partner.profile.businessName || partner.profile.vehicleNumber || "Profile"}</div>
                  </div>
                ) : (
                  <span className="text-xs text-gray-500">-</span>
                )}
              </TableCell>
              <TableCell>
                {person.sellerProfile?.mallName ? (
                  <div className="space-y-1">
                    <div className="text-sm text-white">{person.sellerProfile.mallName}</div>
                    <div className="text-xs text-gray-500">
                      {[person.sellerProfile.mallUnit, person.sellerProfile.mallFloor].filter(Boolean).join(" / ") || "Assigned"}
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-gray-500">-</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  <StatusBadge active={!person.isBlocked} label={person.isBlocked ? "Blocked" : "Active"} />
                  {partner && <StatusBadge active={partner.profile.status === "APPROVED"} label={partner.profile.status} />}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  {partner && partner.profile.status !== "APPROVED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                      onClick={() => onPartnerStatus(person, partner.type, "APPROVED")}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Approve
                    </Button>
                  )}
                  {partner && partner.profile.status !== "REJECTED" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-gray-300 hover:bg-white/10 hover:text-white"
                      onClick={() => onPartnerStatus(person, partner.type, "REJECTED")}
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Reject
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant={person.isBlocked ? "outline" : "destructive"}
                    className={person.isBlocked ? "border-white/10 bg-white/5 text-white hover:bg-white/10" : ""}
                    onClick={() => onBlock(person)}
                  >
                    <Ban className="h-3.5 w-3.5" />
                    {person.isBlocked ? "Unban" : "Ban"}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function MallRequestsPanel({ requests, isLoading }: { requests: SellerMallRequest[]; isLoading: boolean }) {
  const reviewMallRequest = useReviewMallRequest();

  return (
    <Card className="border-white/10 bg-[#1c1c1c]">
      <CardHeader className="border-b border-white/10">
        <CardTitle className="flex items-center gap-2 text-base text-white">
          <CheckCircle2 className="h-4 w-4 text-emerald-300" />
          Mall Requests
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        {isLoading && <div className="px-4 py-10 text-sm text-gray-400">Loading mall requests...</div>}
        {!isLoading && !requests.length && <div className="px-4 py-10 text-sm text-gray-400">No pending mall requests.</div>}
        {!isLoading && Boolean(requests.length) && (
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="px-4 text-gray-400">Seller</TableHead>
                <TableHead className="text-gray-400">Requested Mall</TableHead>
                <TableHead className="text-gray-400">Unit</TableHead>
                <TableHead className="text-right text-gray-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((item) => (
                <TableRow key={item._id} className="border-white/10 hover:bg-white/[0.03]">
                  <TableCell className="px-4">
                    <div className="font-medium text-white">{item.businessName || item.fullName || "Seller"}</div>
                    <div className="text-xs text-gray-500">{item.email}</div>
                    {item.request.message && <div className="mt-1 max-w-52 text-xs text-gray-400">{item.request.message}</div>}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-white">{item.request.mallName || "Mall"}</div>
                    <div className="text-xs text-gray-500">{formatDate(item.request.requestedAt)}</div>
                  </TableCell>
                  <TableCell className="text-gray-300">
                    {[item.request.mallUnit, item.request.mallFloor].filter(Boolean).join(" / ") || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                        onClick={() => reviewMallRequest.mutate({ sellerId: item.sellerId, status: "APPROVED" })}
                        disabled={reviewMallRequest.isPending}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => reviewMallRequest.mutate({ sellerId: item.sellerId, status: "REJECTED" })}
                        disabled={reviewMallRequest.isPending}
                      >
                        Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function MallCreationRequestsPanel({ requests, isLoading }: { requests: Mall[]; isLoading: boolean }) {
  const reviewMallCreation = useReviewMallCreation();

  return (
    <Card className="border-white/10 bg-[#1c1c1c]">
      <CardHeader className="border-b border-white/10">
        <CardTitle className="flex items-center gap-2 text-base text-white">
          <Building2 className="h-4 w-4 text-emerald-300" />
          New Mall Requests
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        {isLoading && <div className="px-4 py-10 text-sm text-gray-400">Loading new mall requests...</div>}
        {!isLoading && !requests.length && <div className="px-4 py-10 text-sm text-gray-400">No pending mall creation requests.</div>}
        {!isLoading && Boolean(requests.length) && (
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="px-4 text-gray-400">Mall</TableHead>
                <TableHead className="text-gray-400">Seller</TableHead>
                <TableHead className="text-gray-400">Unit</TableHead>
                <TableHead className="text-right text-gray-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((mall) => (
                <TableRow key={mall._id} className="border-white/10 hover:bg-white/[0.03]">
                  <TableCell className="px-4">
                    <div className="font-medium text-white">{mall.name}</div>
                    <div className="text-xs text-gray-500">{mall.address?.city || "Fashion mall"}</div>
                    {mall.request?.message && <div className="mt-1 max-w-52 text-xs text-gray-400">{mall.request.message}</div>}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-white">{mall.requestedBy?.fullName || "Seller"}</div>
                    <div className="text-xs text-gray-500">{mall.requestedBy?.email}</div>
                  </TableCell>
                  <TableCell className="text-gray-300">
                    {[mall.request?.mallUnit, mall.request?.mallFloor].filter(Boolean).join(" / ") || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                        onClick={() => reviewMallCreation.mutate({ mallId: mall._id, status: "APPROVED" })}
                        disabled={reviewMallCreation.isPending}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => reviewMallCreation.mutate({ mallId: mall._id, status: "REJECTED" })}
                        disabled={reviewMallCreation.isPending}
                      >
                        Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function TopMallsPanel({ malls }: { malls: Mall[] }) {
  return (
    <Card className="border-white/10 bg-[#1c1c1c]">
      <CardHeader className="border-b border-white/10">
        <CardTitle className="flex items-center gap-2 text-base text-white">
          <Building2 className="h-4 w-4 text-emerald-300" />
          Top 10 In App
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!malls.length && <div className="py-6 text-sm text-gray-400">No malls are marked for app display.</div>}
        {malls.map((mall, index) => (
          <div key={mall._id} className="flex items-center justify-between border-b border-white/10 pb-3 last:border-0 last:pb-0">
            <div>
              <div className="text-sm font-medium text-white">{index + 1}. {mall.name}</div>
              <div className="text-xs text-gray-500">{mall.address?.city || "Fashion mall"}</div>
            </div>
            <Badge variant="outline" className="border-white/10 text-gray-300">
              {mall.sellerCount || 0} sellers
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function MallCreatePanel() {
  const createMall = useCreateMall();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [line1, setLine1] = useState("");
  const [pincode, setPincode] = useState("");
  const [managerName, setManagerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [totalStores, setTotalStores] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    createMall.mutate(
      {
        name,
        address: {
          line1: optionalValue(line1),
          city: optionalValue(city),
          state: optionalValue(state),
          pincode: optionalValue(pincode),
        },
        contact: {
          managerName: optionalValue(managerName),
          phone: optionalValue(phone),
          email: optionalValue(email),
        },
        totalStores: totalStores ? Number(totalStores) : undefined,
      },
      {
        onSuccess: () => {
          setName("");
          setCity("");
          setState("");
          setLine1("");
          setPincode("");
          setManagerName("");
          setPhone("");
          setEmail("");
          setTotalStores("");
        },
      },
    );
  };

  return (
    <Card className="border-white/10 bg-[#1c1c1c]">
      <CardHeader className="border-b border-white/10">
        <CardTitle className="flex items-center gap-2 text-base text-white">
          <Building2 className="h-4 w-4 text-emerald-300" />
          Add Mall
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-3">
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Mall name" required className={inputClass} />
          <Input value={line1} onChange={(event) => setLine1(event.target.value)} placeholder="Address" className={inputClass} />
          <div className="grid grid-cols-2 gap-2">
            <Input value={city} onChange={(event) => setCity(event.target.value)} placeholder="City" className={inputClass} />
            <Input value={state} onChange={(event) => setState(event.target.value)} placeholder="State" className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input value={pincode} onChange={(event) => setPincode(event.target.value)} placeholder="Pincode" className={inputClass} />
            <Input value={totalStores} onChange={(event) => setTotalStores(event.target.value)} placeholder="Stores" type="number" min="0" className={inputClass} />
          </div>
          <Input value={managerName} onChange={(event) => setManagerName(event.target.value)} placeholder="Manager" className={inputClass} />
          <div className="grid grid-cols-2 gap-2">
            <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Phone" className={inputClass} />
            <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" type="email" className={inputClass} />
          </div>
          <Button type="submit" disabled={createMall.isPending}>
            <Building2 className="h-4 w-4" />
            Create Mall
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function MallDirectory({ malls, isLoading }: { malls: Mall[]; isLoading: boolean }) {
  return (
    <Card className="border-white/10 bg-[#1c1c1c]">
      <CardHeader className="border-b border-white/10">
        <CardTitle className="text-base text-white">Mall Directory</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        {isLoading && <div className="px-4 py-10 text-sm text-gray-400">Loading malls...</div>}
        {!isLoading && !malls.length && <div className="px-4 py-10 text-sm text-gray-400">No malls found.</div>}
        {!isLoading && Boolean(malls.length) && (
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="px-4 text-gray-400">Mall</TableHead>
                <TableHead className="text-gray-400">City</TableHead>
                <TableHead className="text-gray-400">Stores</TableHead>
                <TableHead className="text-gray-400">Sellers</TableHead>
                <TableHead className="text-gray-400">App Top</TableHead>
                <TableHead className="text-gray-400">Rank</TableHead>
                <TableHead className="text-gray-400">Rating</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-right text-gray-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {malls.map((mall) => (
                <MallRow
                  key={`${mall._id}-${mall.name}-${mall.address?.city || ""}-${mall.totalStores || 0}-${mall.isActive}-${mall.isFeatured}-${mall.featuredRank || ""}-${mall.rating || ""}`}
                  mall={mall}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function MallRow({ mall }: { mall: Mall }) {
  const updateMall = useUpdateMall();
  const deactivateMall = useDeactivateMall();
  const [name, setName] = useState(mall.name);
  const [city, setCity] = useState(mall.address?.city || "");
  const [totalStores, setTotalStores] = useState(String(mall.totalStores || ""));
  const [isFeatured, setIsFeatured] = useState(Boolean(mall.isFeatured));
  const [featuredRank, setFeaturedRank] = useState(String(mall.featuredRank || ""));
  const [rating, setRating] = useState(String(mall.rating || 4.5));

  const save = () => {
    updateMall.mutate({
      mallId: mall._id,
      updates: {
        name,
        address: { ...mall.address, city: optionalValue(city) },
        totalStores: totalStores ? Number(totalStores) : 0,
        isFeatured,
        featuredRank: isFeatured && featuredRank ? Number(featuredRank) : undefined,
        rating: rating ? Number(rating) : undefined,
      },
    });
  };

  return (
    <TableRow className="border-white/10 hover:bg-white/[0.03]">
      <TableCell className="px-4">
        <Input value={name} onChange={(event) => setName(event.target.value)} className={cn(inputClass, "h-8 min-w-44")} />
        <div className="mt-1 text-xs text-gray-500">{mall.slug}</div>
      </TableCell>
      <TableCell>
        <Input value={city} onChange={(event) => setCity(event.target.value)} className={cn(inputClass, "h-8 min-w-28")} />
      </TableCell>
      <TableCell>
        <Input
          value={totalStores}
          onChange={(event) => setTotalStores(event.target.value)}
          type="number"
          min="0"
          className={cn(inputClass, "h-8 w-20")}
        />
      </TableCell>
      <TableCell className="text-white">{mall.sellerCount || 0}</TableCell>
      <TableCell>
        <label className="inline-flex items-center gap-2 text-xs text-gray-300">
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(event) => setIsFeatured(event.target.checked)}
            className="h-4 w-4 rounded border-white/10 bg-white/5"
          />
          Show
        </label>
      </TableCell>
      <TableCell>
        <Input
          value={featuredRank}
          onChange={(event) => setFeaturedRank(event.target.value)}
          type="number"
          min="1"
          max="10"
          placeholder="1-10"
          className={cn(inputClass, "h-8 w-20")}
        />
      </TableCell>
      <TableCell>
        <Input
          value={rating}
          onChange={(event) => setRating(event.target.value)}
          type="number"
          min="0"
          max="5"
          step="0.1"
          className={cn(inputClass, "h-8 w-20")}
        />
      </TableCell>
      <TableCell><StatusBadge active={mall.isActive} label={mall.isActive ? "Active" : "Inactive"} /></TableCell>
      <TableCell>
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            onClick={save}
            disabled={updateMall.isPending}
          >
            <Save className="h-3.5 w-3.5" />
            Save
          </Button>
          {mall.isActive ? (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => deactivateMall.mutate(mall._id)}
              disabled={deactivateMall.isPending}
            >
              Deactivate
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="border-white/10 bg-white/5 text-white hover:bg-white/10"
              onClick={() => updateMall.mutate({ mallId: mall._id, updates: { isActive: true } })}
              disabled={updateMall.isPending}
            >
              Activate
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

function SellerMallAssignments({
  sellers,
  malls,
  isLoading,
}: {
  sellers: ManagedPerson[];
  malls: Mall[];
  isLoading: boolean;
}) {
  return (
    <Card className="border-white/10 bg-[#1c1c1c] xl:col-span-2">
      <CardHeader className="border-b border-white/10">
        <CardTitle className="flex items-center gap-2 text-base text-white">
          <Store className="h-4 w-4 text-emerald-300" />
          Seller Mall Assignment
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        {isLoading && <div className="px-4 py-10 text-sm text-gray-400">Loading sellers...</div>}
        {!isLoading && !sellers.length && <div className="px-4 py-10 text-sm text-gray-400">No seller profiles found.</div>}
        {!isLoading && Boolean(sellers.length) && (
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="px-4 text-gray-400">Seller</TableHead>
                <TableHead className="text-gray-400">Business</TableHead>
                <TableHead className="text-gray-400">Mall</TableHead>
                <TableHead className="text-gray-400">Unit</TableHead>
                <TableHead className="text-gray-400">Floor</TableHead>
                <TableHead className="text-right text-gray-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sellers.map((seller) => (
                <SellerMallRow
                  key={`${seller._id}-${seller.sellerProfile?.mallId || ""}-${seller.sellerProfile?.mallUnit || ""}-${seller.sellerProfile?.mallFloor || ""}`}
                  seller={seller}
                  malls={malls}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function SellerMallRow({ seller, malls }: { seller: ManagedPerson; malls: Mall[] }) {
  const assignSellerMall = useAssignSellerMall();
  const [mallId, setMallId] = useState(seller.sellerProfile?.mallId || "");
  const [mallUnit, setMallUnit] = useState(seller.sellerProfile?.mallUnit || "");
  const [mallFloor, setMallFloor] = useState(seller.sellerProfile?.mallFloor || "");

  const save = () => {
    assignSellerMall.mutate({
      sellerId: seller._id,
      mallId: mallId || null,
      mallUnit: mallUnit.trim(),
      mallFloor: mallFloor.trim(),
    });
  };

  return (
    <TableRow className="border-white/10 hover:bg-white/[0.03]">
      <TableCell className="px-4">
        <div className="font-medium text-white">{seller.fullName}</div>
        <div className="text-xs text-gray-500">{seller.email}</div>
      </TableCell>
      <TableCell>
        <div className="text-sm text-white">{seller.sellerProfile?.businessName || "Seller"}</div>
        <div className="text-xs text-gray-500">{seller.sellerProfile?.sellerType || "CLOTHING"}</div>
      </TableCell>
      <TableCell>
        <select value={mallId} onChange={(event) => setMallId(event.target.value)} className={cn(selectClass, "min-w-48")}>
          <option value="">No mall</option>
          {malls.map((mall) => (
            <option key={mall._id} value={mall._id}>
              {mall.name}{mall.isActive ? "" : " (Inactive)"}
            </option>
          ))}
        </select>
      </TableCell>
      <TableCell>
        <Input value={mallUnit} onChange={(event) => setMallUnit(event.target.value)} placeholder="Unit" className={cn(inputClass, "h-8 w-24")} />
      </TableCell>
      <TableCell>
        <Input value={mallFloor} onChange={(event) => setMallFloor(event.target.value)} placeholder="Floor" className={cn(inputClass, "h-8 w-24")} />
      </TableCell>
      <TableCell>
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="outline"
            className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            onClick={save}
            disabled={assignSellerMall.isPending}
          >
            <Save className="h-3.5 w-3.5" />
            Save
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function InvitePanel() {
  const sendInvite = useSendInvite();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<AdminRole>("SELLER");
  const [message, setMessage] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    sendInvite.mutate(
      { email, fullName: optionalValue(fullName), role, message: optionalValue(message) },
      {
        onSuccess: () => {
          setEmail("");
          setFullName("");
          setMessage("");
        },
      },
    );
  };

  return (
    <Card className="max-w-xl border-white/10 bg-[#1c1c1c]">
      <CardHeader className="border-b border-white/10">
        <CardTitle className="flex items-center gap-2 text-base text-white">
          <MailPlus className="h-4 w-4 text-emerald-300" />
          Invite
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-3">
          <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" type="email" required className={inputClass} />
          <Input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Name" className={inputClass} />
          <select value={role} onChange={(event) => setRole(event.target.value as AdminRole)} className={selectClass}>
            <option value="SELLER">SELLER</option>
            <option value="DELIVERY">DELIVERY</option>
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Message"
            className="min-h-24 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-sm text-white outline-none placeholder:text-gray-500"
          />
          <Button type="submit" disabled={sendInvite.isPending}>
            <MailPlus className="h-4 w-4" />
            Send Invite
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function PayoutPanel({ partners }: { partners: ManagedPerson[] }) {
  const createPayout = useCreatePayout();
  const [partner, setPartner] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<PayoutStatus>("PENDING");
  const [referenceId, setReferenceId] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const [partnerId, partnerType] = partner.split("|") as [string, PartnerType];
    if (!partnerId || !partnerType) return;

    createPayout.mutate(
      {
        partnerId,
        partnerType,
        amount: Number(amount),
        status,
        referenceId: optionalValue(referenceId),
      },
      {
        onSuccess: () => {
          setAmount("");
          setReferenceId("");
        },
      },
    );
  };

  return (
    <Card className="border-white/10 bg-[#1c1c1c]">
      <CardHeader className="border-b border-white/10">
        <CardTitle className="flex items-center gap-2 text-base text-white">
          <WalletCards className="h-4 w-4 text-emerald-300" />
          Record Payout
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-3">
          <select value={partner} onChange={(event) => setPartner(event.target.value)} required className={selectClass}>
            <option value="">Partner</option>
            {partners.map((person) => {
              const type: PartnerType = person.sellerProfile ? "SELLER" : "DELIVERY";
              return <option key={person._id} value={`${person._id}|${type}`}>{person.fullName} - {type}</option>;
            })}
          </select>
          <Input value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Amount" type="number" min="1" required className={inputClass} />
          <select value={status} onChange={(event) => setStatus(event.target.value as PayoutStatus)} className={selectClass}>
            <option value="PENDING">PENDING</option>
            <option value="PROCESSING">PROCESSING</option>
            <option value="PAID">PAID</option>
            <option value="FAILED">FAILED</option>
          </select>
          <Input value={referenceId} onChange={(event) => setReferenceId(event.target.value)} placeholder="Reference" className={inputClass} />
          <Button type="submit" disabled={createPayout.isPending || !partners.length}>
            <WalletCards className="h-4 w-4" />
            Record Payout
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function PayoutMethodReviewPanel({ methods, isLoading }: { methods: PayoutMethod[]; isLoading: boolean }) {
  const reviewPayoutMethod = useReviewPayoutMethod();

  return (
    <Card className="border-white/10 bg-[#1c1c1c]">
      <CardHeader className="border-b border-white/10">
        <CardTitle className="flex items-center gap-2 text-base text-white">
          <ShieldCheck className="h-4 w-4 text-emerald-300" />
          Verify Payout Methods
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        {isLoading && <div className="px-4 py-8 text-sm text-gray-400">Loading payout methods...</div>}
        {!isLoading && !methods.length && <div className="px-4 py-8 text-sm text-gray-400">No pending payout methods.</div>}
        {!isLoading && Boolean(methods.length) && (
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="px-4 text-gray-400">Seller</TableHead>
                <TableHead className="text-gray-400">Method</TableHead>
                <TableHead className="text-right text-gray-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {methods.map((method) => (
                <TableRow key={method._id} className="border-white/10 hover:bg-white/[0.03]">
                  <TableCell className="px-4">
                    <div className="font-medium text-white">{method.businessName || method.sellerName || "Seller"}</div>
                    <div className="text-xs text-gray-500">{method.sellerEmail}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-white">{method.type}</div>
                    <div className="text-xs text-gray-500">{payoutMethodLabel(method)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                        onClick={() => reviewPayoutMethod.mutate({ sellerId: method.sellerId, methodId: method._id, status: "VERIFIED" })}
                        disabled={reviewPayoutMethod.isPending}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Verify
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => reviewPayoutMethod.mutate({ sellerId: method.sellerId, methodId: method._id, status: "REJECTED" })}
                        disabled={reviewPayoutMethod.isPending}
                      >
                        Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function PayoutTable({ payouts, isLoading }: { payouts: Payout[]; isLoading: boolean }) {
  const updatePayoutStatus = useUpdatePayoutStatus();

  if (isLoading) return <div className="px-4 py-8 text-sm text-gray-400">Loading payouts...</div>;
  if (!payouts.length) return <div className="px-4 py-8 text-sm text-gray-400">No payouts recorded.</div>;

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-white/10 hover:bg-transparent">
          <TableHead className="px-4 text-gray-400">Partner</TableHead>
          <TableHead className="text-gray-400">Type</TableHead>
          <TableHead className="text-gray-400">Amount</TableHead>
          <TableHead className="text-gray-400">Status</TableHead>
          <TableHead className="text-gray-400">Reference</TableHead>
          <TableHead className="text-gray-400">Method</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payouts.map((payout) => (
          <TableRow key={payout._id} className="border-white/10 hover:bg-white/[0.03]">
            <TableCell className="px-4">
              <div className="font-medium text-white">{payout.partnerId?.fullName || "Partner"}</div>
              <div className="text-xs text-gray-500">{payout.partnerId?.email}</div>
            </TableCell>
            <TableCell><Badge variant="outline" className="border-white/10 text-gray-300">{payout.partnerType}</Badge></TableCell>
            <TableCell className="text-white">Rs. {formatAmount(payout.amount)}</TableCell>
            <TableCell>
              <select
                value={payout.status}
                onChange={(event) =>
                  updatePayoutStatus.mutate({ payoutId: payout._id, status: event.target.value as PayoutStatus })
                }
                disabled={updatePayoutStatus.isPending}
                className={cn(selectClass, "w-32")}
              >
                <option value="PENDING">PENDING</option>
                <option value="PROCESSING">PROCESSING</option>
                <option value="PAID">PAID</option>
                <option value="FAILED">FAILED</option>
              </select>
            </TableCell>
            <TableCell className="text-gray-400">{payout.referenceId || "-"}</TableCell>
            <TableCell className="text-gray-400">{payout.method || "-"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function StatusCount({ label, value, status }: { label: string; value: number; status: ManagementStatus }) {
  return (
    <Badge variant="outline" className={statusClass(status)}>
      {label}: {value}
    </Badge>
  );
}

function FeatureStatusBadge({ status }: { status: ManagementStatus }) {
  const label = status === "ACTIVE" ? "Active" : status === "PARTIAL" ? "Partial" : "Planned";
  return (
    <Badge variant="outline" className={statusClass(status)}>
      {label}
    </Badge>
  );
}

function statusClass(status: ManagementStatus) {
  if (status === "ACTIVE") return "border-emerald-400/30 text-emerald-300";
  if (status === "PARTIAL") return "border-amber-400/30 text-amber-300";
  return "border-sky-400/30 text-sky-300";
}

function RoleBadge({ role }: { role: string }) {
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
  return (
    <Badge variant="outline" className={isAdmin ? "border-cyan-400/30 text-cyan-300" : "border-white/10 text-gray-300"}>
      {isAdmin && <ShieldCheck className="h-3 w-3" />}
      {role}
    </Badge>
  );
}

function StatusBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <Badge variant="outline" className={active ? "border-emerald-400/30 text-emerald-300" : "border-red-400/30 text-red-300"}>
      {label}
    </Badge>
  );
}

function getPartner(person: ManagedPerson): { type: PartnerType; profile: PartnerProfile } | null {
  if (person.sellerProfile) return { type: "SELLER", profile: person.sellerProfile };
  if (person.deliveryProfile) return { type: "DELIVERY", profile: person.deliveryProfile };
  return null;
}

function optionalValue(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function numericValue(value: string) {
  if (value.trim() === "") return undefined;
  return Number(value);
}

function payoutMethodLabel(method: PayoutMethod) {
  if (method.type === "BANK") {
    const account = method.bank?.accountNumber || "";
    return [method.bank?.bankName, account ? `A/C ${account.slice(-4)}` : undefined].filter(Boolean).join(" - ") || "Bank account";
  }

  if (method.type === "UPI") return method.upi?.upiId || "UPI";
  if (method.type === "PAYPAL") return method.paypal?.email || "PayPal";
  return method.stripeConnect?.accountId || "Stripe Connect";
}

function getCatalogGroup(catalog: ManagementGroup[], id: string) {
  return catalog.find((group) => group.id === id);
}

function formatDate(value?: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount);
}
