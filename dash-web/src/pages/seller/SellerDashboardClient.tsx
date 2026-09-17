import { useMemo } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { LogOut, RefreshCcw, Clock, AlertTriangle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useAuthHydrated } from "@/features/auth/hooks/useAuthHydrated";
import { logoutRequest } from "@/features/auth/api/auth.api";
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

import { isSeller } from "@/lib/rbac";

export function SellerDashboardClient() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const hasHydrated = useAuthHydrated();
  const setupQuery = useSellerSetupStatusV2();

  const isApprovedOnboarding =
    Boolean(setupQuery.data?.seller) ||
    Boolean((setupQuery.data as any)?.setup?.sellerApproved) ||
    (setupQuery.data as any)?.seller?.status === "APPROVED" ||
    (setupQuery.data as any)?.onboardingStatus === "APPROVED";

  const isPendingApplication =
    !setupQuery.isLoading &&
    !isApprovedOnboarding &&
    Boolean(
      (setupQuery.data as any)?.needsApproval ||
      (setupQuery.data as any)?.onboardingStatus === "PENDING"
    );

  const isRejectedApplication =
    !setupQuery.isLoading &&
    !isApprovedOnboarding &&
    (setupQuery.data as any)?.onboardingStatus === "REJECTED";

  const isSellerUser =
    isSeller(user) ||
    Boolean(setupQuery.data?.seller) ||
    isApprovedOnboarding ||
    setupQuery.isLoading;

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

  // persist hydration is tracked via useAuthHydrated() above.
  // Auth gating is intentionally NOT done via a client-side navigate.replace
  // here. See web/src/app/delivery/dashboard/page.tsx for the full rationale
  // (proxy.ts + axios 403 interceptor are the single owner of redirects). The
  // wrong-role case is handled inline below by showing the PENDING / REJECTED
  // onboarding UI — no redirect needed.

  const changeSection = (section: SellerSection, intent: SellerSectionIntent = {}) => {
    navigate(sellerSectionHref(section, intent));
  };

  if (!hasHydrated || !isAuthenticated) {
    return <div className="min-h-screen bg-background" />;
  }

  // Handle pending or unapproved seller onboarding applications
  if (!isSellerUser || isPendingApplication || isRejectedApplication) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl bg-muted border border-border p-6 text-center space-y-5 shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-400">
            {isRejectedApplication ? (
              <AlertTriangle className="h-8 w-8 text-amber-400" />
            ) : (
              <Clock className="h-8 w-8 animate-pulse text-emerald-400" />
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {isRejectedApplication
                ? "Application Needs Attention"
                : isPendingApplication
                  ? "Application Under Review"
                  : "Seller Onboarding Status"}
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              {(setupQuery.data as any)?.message ||
                "Your seller registration and documents have been received. Admin approval is required before dashboard access is unlocked."}
            </p>
          </div>

          <div className="flex flex-col gap-2.5 pt-2">
            <Button
              onClick={() => setupQuery.refetch()}
              disabled={setupQuery.isFetching}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-5 transition-all"
            >
              <RefreshCcw className={`h-4 w-4 mr-2 ${setupQuery.isFetching ? "animate-spin" : ""}`} />
              Check Approval Status
            </Button>

            {isRejectedApplication && (
              <Button
                variant="outline"
                onClick={() => navigate("/seller/register")}
                className="border-border bg-muted text-foreground hover:bg-muted py-5"
              >
                <FileText className="h-4 w-4 mr-2" />
                Update Application
              </Button>
            )}

            <Button
              variant="ghost"
              onClick={async () => {
                await logoutRequest();
                clearAuth();
                navigate("/seller/login", { replace: true });
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen h-screen overflow-hidden bg-background text-foreground">
      <div className="flex min-h-screen h-screen overflow-hidden flex-col lg:flex-row">
        <SellerSidebar activeSection={activeSection} onSectionChange={(section) => changeSection(section)} />

        <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex shrink-0 flex-col gap-3 border-b border-border bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between lg:px-6 lg:py-4">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">Seller Panel</h1>
              <p className="text-sm text-muted-foreground">{sectionLabels[activeSection]}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ThemeToggle />
              <Button
                variant="outline"
                onClick={() => setupQuery.refetch()}
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
                  navigate("/seller/login", { replace: true });
                }}
                className="text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </div>
          </header>

          <ScrollArea className="min-h-0 flex-1 bg-background">
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
