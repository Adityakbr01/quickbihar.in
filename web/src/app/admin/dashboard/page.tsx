"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuthStore } from "@/features/auth/store/authStore";
import {
  ContentManagementPanel,
  InventoryLogisticsPanel,
  MarketingPromotionsPanel,
  ReportsAnalyticsPanel,
  RiderDirectoryPanel,
  SellerDirectoryPanel,
  SystemSettingsPanel,
} from "@/features/dashboard/components/AdminFullModules";
import {
  OrderManagementPanel,
  ProductManagementPanel,
  CategoryManagementPanel,
  CouponManagementPanel,
} from "@/features/dashboard/components/AdminCatalogModules";
import { PolicyManagementPanel } from "@/features/dashboard/components/policies/PolicyManagementPanel";
import { SizeChartManagementPanel } from "@/features/dashboard/components/sizeCharts/SizeChartManagementPanel";
import { BannerManagementPanel } from "@/features/dashboard/components/banners/BannerManagementPanel";
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
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const [hasHydrated, setHasHydrated] = useState(false);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<
    "ALL" | "USER" | "SELLER" | "DELIVERY" | "ADMIN" | "SUPER_ADMIN"
  >("ALL");
  const [status, setStatus] = useState<
    "all" | "active" | "blocked" | "verified" | "unverified" | "deleted"
  >("all");

  const roleName =
    typeof user?.role === "string" ? user.role : user?.role?.name;
  const isAdminUser = ["ADMIN", "SUPER_ADMIN"].includes(roleName || "");
  const activeSection = adminSectionFromPathname(pathname);

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
  const payoutMethodsQuery = usePayoutMethods({
    status: "PENDING_VERIFICATION",
  });
  const mallsQuery = useMalls();
  const mallRequestsQuery = useMallRequests();
  const mallCreationRequestsQuery = useMallCreationRequests();
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
    router.push(adminSectionHref(section));
  };

  if (!hasHydrated || !isAuthenticated || !isAdminUser) {
    return <div className="min-h-screen bg-[#121212]" />;
  }

  return (
    <main className="dark h-screen overflow-hidden bg-background text-foreground">
      <div className="flex h-screen overflow-hidden flex-col lg:flex-row">
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
          }}
        />

        <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <header className="shrink-0 flex flex-col gap-3 border-b border-white/10 bg-[#121212] px-4 py-4 md:flex-row md:items-center md:justify-between lg:px-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">
                Admin Dashboard
              </h1>
              <p className="text-sm text-gray-400">
                {sectionLabels[activeSection]}
              </p>
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

          <ScrollArea className="min-h-0 flex-1 bg-[#121212]">
            <div className="mx-auto w-full max-w-7xl px-4 py-5 lg:px-6">
              {activeSection === "overview" && (
                <div className="animate-in-fade-slide">
                  <OverviewSection
                    stats={stats}
                    dailyRevenue={dashboardQuery.data?.dailyRevenue || []}
                    ordersByStatus={dashboardQuery.data?.ordersByStatus || []}
                    payouts={dashboardQuery.data?.recentPayouts || []}
                    malls={malls}
                    topMalls={dashboardQuery.data?.topMalls || []}
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
                    onBlock={(person) =>
                      setBlocked.mutate({
                        userId: person._id,
                        isBlocked: !person.isBlocked,
                      })
                    }
                    onPartnerStatus={(person, type, partnerStatus) =>
                      updatePartnerStatus.mutate({
                        userId: person._id,
                        type,
                        status: partnerStatus,
                      })
                    }
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
            </div>
          </ScrollArea>
        </section>
      </div>
    </main>
  );
}
