"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LogOut, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuthStore } from "@/features/auth/store/authStore";
import {
  sectionLabels,
  sellerSectionFromPathname,
  sellerSectionHref,
  SellerSectionRenderer,
  SellerSidebar,
  type SellerSection,
  type SellerSectionIntent,
} from "@/features/seller/components/SellerManagementModules";
import { useSellerSetupStatusV2 } from "@/features/seller/hooks/useSellerManagement";

export function SellerDashboardClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const [hasHydrated, setHasHydrated] = useState(false);
  const setupQuery = useSellerSetupStatusV2();

  const roleName = typeof user?.role === "string" ? user.role : user?.role?.name;
  const isSellerUser = roleName === "SELLER";
  const activeSection = sellerSectionFromPathname(pathname);
  const sectionIntent = useMemo<SellerSectionIntent>(() => {
    const intent: SellerSectionIntent = {};
    const status = searchParams.get("status");
    const approvalStatus = searchParams.get("approvalStatus");

    if (status === "ALL" || status === "low" || status === "out") {
      intent.inventoryStatus = status;
    }

    if (
      approvalStatus === "DRAFT" ||
      approvalStatus === "PENDING_REVIEW" ||
      approvalStatus === "APPROVED" ||
      approvalStatus === "REJECTED" ||
      approvalStatus === "ALL"
    ) {
      intent.productApprovalStatus = approvalStatus;
    }

    return intent;
  }, [searchParams]);

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
    if (!isAuthenticated || !isSellerUser) {
      router.replace("/seller/login");
    }
  }, [hasHydrated, isAuthenticated, isSellerUser, router]);

  const changeSection = (section: SellerSection, intent: SellerSectionIntent = {}) => {
    router.push(sellerSectionHref(section, intent));
  };

  if (!hasHydrated || !isAuthenticated || !isSellerUser) {
    return <div className="min-h-screen bg-[#121212]" />;
  }

  return (
    <main className="dark h-dvh overflow-hidden bg-background text-foreground">
      <div className="flex h-dvh overflow-hidden flex-col lg:flex-row">
        <SellerSidebar activeSection={activeSection} onSectionChange={(section) => changeSection(section)} />

        <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex shrink-0 flex-col gap-3 border-b border-white/10 bg-[#121212] px-4 py-3 sm:flex-row sm:items-center sm:justify-between lg:px-6 lg:py-4">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">Seller Panel</h1>
              <p className="text-sm text-gray-400">{sectionLabels[activeSection]}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setupQuery.refetch()}
                className="border-white/10 bg-white/5 text-white hover:bg-white/10"
              >
                <RefreshCcw className="h-4 w-4" />
                Refresh
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  clearAuth();
                  router.replace("/seller/login");
                }}
                className="text-gray-300 hover:bg-white/10 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </div>
          </header>

          <ScrollArea className="min-h-0 flex-1 bg-[#121212]">
            <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-4 lg:px-6 lg:py-5">
              <SellerSectionRenderer
                activeSection={activeSection}
                setup={setupQuery.data}
                intent={sectionIntent}
                onSectionChange={changeSection}
              />
            </div>
          </ScrollArea>
        </section>
      </div>
    </main>
  );
}
