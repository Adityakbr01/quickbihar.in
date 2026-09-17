import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { ChevronRight, LogOut, Menu, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useAuthHydrated } from "@/features/auth/hooks/useAuthHydrated";
import { logoutRequest } from "@/features/auth/api/auth.api";
import { isAdmin } from "@/lib/rbac";
// Heavy section panels load on demand (one chunk per section) so the
// initial dashboard bundle stays small and first paint is fast. Each panel
// mounts only when its section opens (see the render switch below).
const ContentManagementPanel = lazy(() =>
  import("@/features/dashboard/components/content/ContentManagementPanel").then((m) => ({
    default: m.ContentManagementPanel,
  })),
);
const InventoryLogisticsPanel = lazy(() =>
  import("@/features/dashboard/components/inventory/InventoryLogisticsPanel").then((m) => ({
    default: m.InventoryLogisticsPanel,
  })),
);
const MarketingPromotionsPanel = lazy(() =>
  import("@/features/dashboard/components/marketing/MarketingPromotionsPanel").then((m) => ({
    default: m.MarketingPromotionsPanel,
  })),
);
const ReportsAnalyticsPanel = lazy(() =>
  import("@/features/dashboard/components/reports/ReportsAnalyticsPanel").then((m) => ({
    default: m.ReportsAnalyticsPanel,
  })),
);
const RiderDirectoryPanel = lazy(() =>
  import("@/features/dashboard/components/partners/PartnerDirectoryPanel").then((m) => ({
    default: m.RiderDirectoryPanel,
  })),
);
const SellerDirectoryPanel = lazy(() =>
  import("@/features/dashboard/components/partners/PartnerDirectoryPanel").then((m) => ({
    default: m.SellerDirectoryPanel,
  })),
);
const SystemSettingsPanel = lazy(() =>
  import("@/features/dashboard/components/system/SystemSettingsPanel").then((m) => ({
    default: m.SystemSettingsPanel,
  })),
);
const OrderManagementPanel = lazy(() =>
  import("@/features/dashboard/components/orders/OrderManagementPanel").then((m) => ({
    default: m.OrderManagementPanel,
  })),
);
const ProductManagementPanel = lazy(() =>
  import("@/features/dashboard/components/products/ProductManagementPanel").then((m) => ({
    default: m.ProductManagementPanel,
  })),
);
const CategoryManagementPanel = lazy(() =>
  import("@/features/dashboard/components/categories/CategoryManagementPanel").then((m) => ({
    default: m.CategoryManagementPanel,
  })),
);
const CouponManagementPanel = lazy(() =>
  import("@/features/dashboard/components/coupons/CouponManagementPanel").then((m) => ({
    default: m.CouponManagementPanel,
  })),
);
const PolicyManagementPanel = lazy(() =>
  import("@/features/dashboard/components/policies/PolicyManagementPanel").then((m) => ({
    default: m.PolicyManagementPanel,
  })),
);
const SizeChartManagementPanel = lazy(() =>
  import("@/features/dashboard/components/sizeCharts/SizeChartManagementPanel").then((m) => ({
    default: m.SizeChartManagementPanel,
  })),
);
const BannerManagementPanel = lazy(() =>
  import("@/features/dashboard/components/banners/BannerManagementPanel").then((m) => ({
    default: m.BannerManagementPanel,
  })),
);
const NotificationManagementPanel = lazy(() =>
  import("@/features/dashboard/components/notifications/NotificationManagementPanel").then((m) => ({
    default: m.NotificationManagementPanel,
  })),
);

function SectionLoading() {
  return (
    <div className="grid gap-4" aria-label="Loading section">
      <div className="h-24 animate-pulse rounded-xl border border-border bg-muted" />
      <div className="h-64 animate-pulse rounded-xl border border-border bg-muted" />
      <div className="h-40 animate-pulse rounded-xl border border-border bg-muted" />
    </div>
  );
}
import {
  useAdminDashboard,
  useAppConfig,
  useManagementCatalog,
  useManagedPeople,
  useMallCreationRequests,
  useMallRequests,
  useMalls,
  usePayoutMethods,
  usePayouts,
  useSetBlocked,
  useUpdatePartnerStatus,
} from "@/features/dashboard/hooks/useAdminManagement";

import { AdminSidebar } from "@/features/dashboard/components/AdminSidebar";
import { MobileNavDrawer } from "@/components/MobileNavDrawer";
import { OverviewSection } from "@/features/dashboard/components/OverviewSection";
import { StoreConfigurationSection } from "@/features/dashboard/components/StoreConfigurationSection";
import { PeopleSection } from "@/features/dashboard/components/PeopleSection";
import { SellerSubmissionsSection } from "@/features/dashboard/components/SellerSubmissionsSection";
import { SellerMallSection } from "@/features/dashboard/components/SellerMallSection";
import { PayoutsSection } from "@/features/dashboard/components/PayoutsSection";
import { InvitePanel } from "@/features/dashboard/components/InvitePanel";
import { getCatalogGroup } from "@/features/dashboard/components/utils";
import type { AdminSection } from "@/features/dashboard/components/types";
import {
  adminSectionFromPathname,
  adminSectionHref,
  sectionLabels,
} from "@/features/dashboard/components/types";

export default function AdminDashboardPage() {
  useEffect(() => { document.title = "Admin Dashboard | QuickBihar Dashboard"; }, []);
  const confirm = useConfirm();

  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const hasHydrated = useAuthHydrated();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<
    "ALL" | "USER" | "SELLER" | "DELIVERY" | "ADMIN" | "SUPER_ADMIN"
  >("ALL");
  const [status, setStatus] = useState<
    "all" | "active" | "blocked" | "verified" | "unverified" | "deleted"
  >("all");

  const isAdminUser = isAdmin(user);
  const activeSection = adminSectionFromPathname(pathname);
  const [navOpen, setNavOpen] = useState(false);

  // persist hydration is tracked via useAuthHydrated() above.

  // Auth gating is intentionally NOT done via a client-side navigate.replace
  // here. See web/src/app/delivery/dashboard/page.tsx for the full rationale
  // (proxy.ts + axios 403 interceptor are the single owner of redirects).

  const peopleParams = useMemo(
    () => ({
      role: role === "ALL" ? undefined : role,
      status: status === "all" ? undefined : status,
      search: search || undefined,
    }),
    [role, search, status],
  );
  const allPeopleParams = useMemo(() => ({}), []);

  // Lazy section data: only the overview/counts queries run on entry.
  // Each section's queries fire the first time its section opens (and stay
  // cached after), instead of all 10 firing together on every dashboard load.
  const needsPeopleDirectory = activeSection === "people";
  const needsPeopleLists = ["people", "products", "seller-mall", "payouts"].includes(activeSection);
  const needsStoreConfig = activeSection === "store-configuration";
  const needsMalls = activeSection === "overview" || activeSection === "seller-mall";

  const dashboardQuery = useAdminDashboard();
  const catalogQuery = useManagementCatalog({ enabled: needsStoreConfig });
  const appConfigQuery = useAppConfig({ enabled: needsStoreConfig });
  const peopleQuery = useManagedPeople(peopleParams, { enabled: needsPeopleDirectory });
  const allPeopleQuery = useManagedPeople(allPeopleParams, { enabled: needsPeopleLists });
  const payoutsQuery = usePayouts({ enabled: activeSection === "payouts" });
  const payoutMethodsQuery = usePayoutMethods({
    status: "PENDING_VERIFICATION",
  });
  const mallsQuery = useMalls({ enabled: needsMalls });
  const mallRequestsQuery = useMallRequests({ enabled: activeSection === "seller-mall" });
  const mallCreationRequestsQuery = useMallCreationRequests({ enabled: activeSection === "seller-mall" });
  const setBlocked = useSetBlocked();
  const updatePartnerStatus = useUpdatePartnerStatus();

  const stats = dashboardQuery.data?.stats;
  const people = useMemo(() => peopleQuery.data || [], [peopleQuery.data]);
  const allPeople = useMemo(
    () => allPeopleQuery.data || [],
    [allPeopleQuery.data],
  );
  const malls = useMemo(() => mallsQuery.data || [], [mallsQuery.data]);
  const mallRequests = useMemo(
    () => mallRequestsQuery.data || [],
    [mallRequestsQuery.data],
  );
  const mallCreationRequests = useMemo(
    () => mallCreationRequestsQuery.data || [],
    [mallCreationRequestsQuery.data],
  );
  const managementCatalog = useMemo(
    () => catalogQuery.data || [],
    [catalogQuery.data],
  );
  const payouts = payoutsQuery.data || [];
  const payoutMethods = payoutMethodsQuery.data || [];

  const sellerPeople = useMemo(
    () => allPeople.filter((person) => Boolean(person.sellerProfile)),
    [allPeople],
  );
  const riderPeople = useMemo(
    () => allPeople.filter((person) => Boolean(person.deliveryProfile)),
    [allPeople],
  );
  const payoutPartners = useMemo(
    () =>
      allPeople.filter((person) =>
        Boolean(person.sellerProfile || person.deliveryProfile),
      ),
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

  const changeSection = (section: AdminSection) => {
    navigate(adminSectionHref(section));
  };

  if (!hasHydrated || !isAuthenticated || !isAdminUser) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <main className="h-screen overflow-hidden bg-background text-foreground">
      <div className="flex h-screen overflow-hidden flex-col lg:flex-row">
        <div className="hidden lg:contents">
          <AdminSidebar
            activeSection={activeSection}
            onSectionChange={changeSection}
            counts={{
            people: stats?.totalUsers || allPeople.length,
            sellers: stats?.sellers || sellerPeople.length,
            riders: stats?.deliveryBoys || riderPeople.length,
            malls: stats?.malls || malls.length,
            payouts:
              (stats?.pendingPayouts || 0) +
              (stats?.pendingPayoutMethods || payoutMethods.length),
            mallRequests:
              (stats?.pendingMallRequests || 0) +
              (stats?.pendingMallCreations || mallCreationRequests.length),
            pendingReviews:
              (stats?.pendingPartners || 0) +
              (stats?.pendingReviews || 0),
          }}
          />
        </div>

        <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <header className="shrink-0 flex flex-col gap-3 border-b border-border bg-background px-4 py-4 md:flex-row md:items-center md:justify-between lg:px-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Admin Dashboard
              </h1>
              <nav aria-label="Breadcrumb" className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                {activeSection === "overview" ? (
                  <span>{sectionLabels.overview}</span>
                ) : (
                  <>
                    <Link to={adminSectionHref("overview")} className="transition-colors hover:text-foreground">
                      Overview
                    </Link>
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="text-foreground">{sectionLabels[activeSection]}</span>
                  </>
                )}
              </nav>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="lg:hidden"
                onClick={() => setNavOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="h-4 w-4" />
              </Button>
              <ThemeToggle />
              <Button
                variant="outline"
                onClick={refreshAll}
                className="border-border bg-muted text-foreground hover:bg-muted"
              >
                <RefreshCcw className="h-4 w-4" />
                Refresh
              </Button>
              <Button
                variant="ghost"
                onClick={async () => {
                  await logoutRequest();
                  clearAuth();
                  navigate("/admin/login", { replace: true });
                }}
                className="text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </div>
          </header>

          <ScrollArea className="min-h-0 flex-1 bg-background">
            <div className="mx-auto w-full max-w-7xl px-4 py-5 lg:px-6">
              <Suspense fallback={<SectionLoading />}>
              {activeSection === "overview" && (
                <div className="animate-in-fade-slide">
                  <OverviewSection
                    stats={stats}
                    dailyRevenue={dashboardQuery.data?.dailyRevenue || []}
                    ordersByStatus={dashboardQuery.data?.ordersByStatus || []}
                    payouts={dashboardQuery.data?.recentPayouts || []}
                    malls={malls}
                    topMalls={dashboardQuery.data?.topMalls || []}
                    onNavigate={changeSection}
                  />
                </div>
              )}

              {activeSection === "store-configuration" && (
                <div className="animate-in-fade-slide">
                  <StoreConfigurationSection
                    group={getCatalogGroup(
                      managementCatalog,
                      "store-configuration",
                    )}
                    config={appConfigQuery.data}
                    isLoading={
                      appConfigQuery.isLoading || catalogQuery.isLoading
                    }
                  />
                </div>
              )}

              {activeSection === "orders" && (
                <div className="animate-in-fade-slide">
                  <OrderManagementPanel />
                </div>
              )}

              {activeSection === "products" && (
                <div className="animate-in-fade-slide">
                  <ProductManagementPanel sellers={sellerPeople} />
                </div>
              )}

              {activeSection === "categories" && (
                <div className="animate-in-fade-slide">
                  <CategoryManagementPanel />
                </div>
              )}

              {activeSection === "coupons" && (
                <div className="animate-in-fade-slide">
                  <CouponManagementPanel />
                </div>
              )}

              {activeSection === "content-management" && (
                <div className="animate-in-fade-slide">
                  <ContentManagementPanel />
                </div>
              )}

              {activeSection === "marketing-promotions" && (
                <div className="animate-in-fade-slide">
                  <MarketingPromotionsPanel />
                </div>
              )}

              {activeSection === "inventory-logistics" && (
                <div className="animate-in-fade-slide">
                  <InventoryLogisticsPanel />
                </div>
              )}

              {activeSection === "reports-analytics" && (
                <div className="animate-in-fade-slide">
                  <ReportsAnalyticsPanel />
                </div>
              )}

              {activeSection === "system-settings" && (
                <div className="animate-in-fade-slide">
                  <SystemSettingsPanel />
                </div>
              )}

              {activeSection === "people" && (
                <div className="animate-in-fade-slide">
                  <PeopleSection
                    people={people}
                    isLoading={peopleQuery.isLoading}
                    search={search}
                    role={role}
                    status={status}
                    onSearch={setSearch}
                    onRole={setRole}
                    onStatus={setStatus}
                    onBlock={async (person) => {
                      const blocking = !person.isBlocked;
                      const ok = await confirm({
                        title: blocking ? `Ban ${person.email}?` : `Unban ${person.email}?`,
                        description: blocking
                          ? "They lose access immediately across app and dashboards."
                          : "Their access is restored.",
                        confirmLabel: blocking ? "Ban User" : "Unban User",
                      });
                      if (ok)
                        setBlocked.mutate({
                          userId: person._id,
                          isBlocked: blocking,
                        });
                    }}
                    onPartnerStatus={async (person, type, partnerStatus) => {
                      const ok = await confirm({
                        title: `${partnerStatus === "APPROVED" ? "Approve" : "Reject"} ${type} access for ${person.email}?`,
                        description: "The partner is notified of this decision.",
                        confirmLabel: partnerStatus === "APPROVED" ? "Approve" : "Reject",
                        tone: partnerStatus === "APPROVED" ? "primary" : "destructive",
                      });
                      if (ok)
                        updatePartnerStatus.mutate({
                          userId: person._id,
                          type,
                          status: partnerStatus,
                        });
                    }}
                  />
                </div>
              )}

              {activeSection === "seller-directory" && (
                <div className="animate-in-fade-slide">
                  <SellerDirectoryPanel />
                </div>
              )}

              {activeSection === "rider-directory" && (
                <div className="animate-in-fade-slide">
                  <RiderDirectoryPanel />
                </div>
              )}

              {activeSection === "seller-mall" && (
                <div className="animate-in-fade-slide">
                  <SellerMallSection
                    sellers={sellerPeople}
                    sellersLoading={allPeopleQuery.isLoading}
                    malls={malls}
                    mallsLoading={mallsQuery.isLoading}
                    mallRequests={mallRequests}
                    mallRequestsLoading={mallRequestsQuery.isLoading}
                    mallCreationRequests={mallCreationRequests}
                    mallCreationRequestsLoading={
                      mallCreationRequestsQuery.isLoading
                    }
                    topMalls={dashboardQuery.data?.topMalls || []}
                  />
                </div>
              )}

              {activeSection === "seller-submissions" && (
                <div className="animate-in-fade-slide">
                  <SellerSubmissionsSection />
                </div>
              )}

              {activeSection === "payouts" && (
                <div className="animate-in-fade-slide">
                  <PayoutsSection
                    partners={payoutPartners}
                    payouts={payouts}
                    payoutMethods={payoutMethods}
                    payoutsLoading={payoutsQuery.isLoading}
                    payoutMethodsLoading={payoutMethodsQuery.isLoading}
                  />
                </div>
              )}

              {activeSection === "invites" && (
                <div className="animate-in-fade-slide">
                  <InvitePanel />
                </div>
              )}

              {activeSection === "policies" && (
                <div className="animate-in-fade-slide">
                  <PolicyManagementPanel />
                </div>
              )}

              {activeSection === "size-charts" && (
                <div className="animate-in-fade-slide">
                  <SizeChartManagementPanel />
                </div>
              )}

              {activeSection === "banners" && (
                <div className="animate-in-fade-slide">
                  <BannerManagementPanel />
                </div>
              )}

              {activeSection === "notifications" && (
                <div className="animate-in-fade-slide">
                  <NotificationManagementPanel />
                </div>
              )}
              </Suspense>
            </div>
          </ScrollArea>
        </section>

        <MobileNavDrawer
          open={navOpen}
          onClose={() => setNavOpen(false)}
          label="Admin menu"
        >
          <AdminSidebar
            forceVertical
            activeSection={activeSection}
            onSectionChange={(section) => {
              setNavOpen(false);
              changeSection(section);
            }}
            counts={{
              people: stats?.totalUsers || allPeople.length,
              sellers: stats?.sellers || sellerPeople.length,
              riders: stats?.deliveryBoys || riderPeople.length,
              malls: stats?.malls || malls.length,
              payouts:
                (stats?.pendingPayouts || 0) +
                (stats?.pendingPayoutMethods || payoutMethods.length),
              mallRequests:
                (stats?.pendingMallRequests || 0) +
                (stats?.pendingMallCreations || mallCreationRequests.length),
              pendingReviews:
                (stats?.pendingPartners || 0) +
                (stats?.pendingReviews || 0),
            }}
          />
        </MobileNavDrawer>
      </div>
    </main>
  );
}
