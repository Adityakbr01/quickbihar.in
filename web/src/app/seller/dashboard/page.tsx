"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuthStore } from "@/features/auth/store/authStore";
import {
  sectionLabels,
  SellerSectionRenderer,
  SellerSidebar,
  type SellerSection,
} from "@/features/seller/components/SellerManagementModules";
import { useSellerSetupStatusV2 } from "@/features/seller/hooks/useSellerManagement";

export default function SellerDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const [hasHydrated, setHasHydrated] = useState(false);
  const [activeSection, setActiveSection] = useState<SellerSection>("dashboard");
  const setupQuery = useSellerSetupStatusV2();

  const roleName = typeof user?.role === "string" ? user.role : user?.role?.name;
  const isSellerUser = roleName === "SELLER";

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

  if (!hasHydrated || !isAuthenticated || !isSellerUser) {
    return <div className="min-h-screen bg-[#121212]" />;
  }

  return (
    <main className="dark h-screen overflow-hidden bg-background text-foreground">
      <div className="flex h-screen overflow-hidden flex-col lg:flex-row">
        <SellerSidebar activeSection={activeSection} onSectionChange={setActiveSection} />

        <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <header className="shrink-0 flex flex-col gap-3 border-b border-white/10 bg-[#121212] px-4 py-4 md:flex-row md:items-center md:justify-between lg:px-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">Seller Panel</h1>
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
            <div className="mx-auto w-full max-w-7xl px-4 py-5 lg:px-6">
              <SellerSectionRenderer activeSection={activeSection} setup={setupQuery.data} />
            </div>
          </ScrollArea>
        </section>
      </div>
    </main>
  );
}
