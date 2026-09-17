import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Link, useNavigate } from "react-router-dom";

import { toast } from "sonner";
import {
  Menu,
  X,
  ChevronDown,
  Store,
  ShieldCheck,
  Bike,
  LayoutDashboard,
  Smartphone,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/features/auth/store/authStore";
import type { AuthUser } from "@/features/auth/schemas/auth.schema";
import { getUserRoles, hasRole } from "@/lib/rbac";
import { logoutRequest } from "@/features/auth/api/auth.api";
import { APP_LINKS, landingData } from "@/constants/links";

const iconMap: Record<string, typeof Store> = {
  Store,
  Bike,
  ShieldCheck,
};

// Maps a partner role to its dashboard URL. USER is intentionally NOT
// listed — customers have no web dashboard, so showing them a "Dashboard"
// button that links to "/" (a no-op refresh) is worse than not showing
// the button at all. They use the mobile app instead.
const roleDashboard: Record<string, string> = {
  SUPER_ADMIN: "/admin/dashboard",
  ADMIN: "/admin/dashboard",
  SELLER: "/seller/dashboard",
  DELIVERY: "/delivery/dashboard",
};

function getDashboardUrl(user: AuthUser | null | undefined): string | null {
  if (!user) return null;
  // Prefer the most privileged dashboard the user has access to.
  if (hasRole(user, "ADMIN", "SUPER_ADMIN")) return roleDashboard.ADMIN;
  if (hasRole(user, "SELLER")) return roleDashboard.SELLER;
  if (hasRole(user, "DELIVERY")) return roleDashboard.DELIVERY;
  return null;
}

function getPrimaryRole(user: AuthUser | null | undefined): string {
  return getUserRoles(user)[0] || "";
}

/**
 * Subscribes to the zustand+persist hydration lifecycle so the header
 * doesn't flash the signed-out UI for an already-signed-in user on
 * first render. Uses `useSyncExternalStore` to avoid the React 19 lint
 * against calling `setState` synchronously inside `useEffect`.
 */
function useHasHydrated(): boolean {
  return useSyncExternalStore(
    (cb) => useAuthStore.persist.onFinishHydration(cb),
    () => useAuthStore.persist.hasHydrated(),
    () => false,
  );
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [portalsOpen, setPortalsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const hasHydrated = useHasHydrated();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { isAuthenticated, user, clearAuth } = useAuthStore();

  // Close the user menu on outside click.
  useEffect(() => {
    if (!userMenuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [userMenuOpen]);

  const loggedIn = hasHydrated && isAuthenticated && Boolean(user);
  const dashboardUrl = getDashboardUrl(user);
  const primaryRole = getPrimaryRole(user);
  const { navigation } = landingData;

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    try {
      await logoutRequest();
    } catch {
      // Even if the server call fails, clear the local state so the UI
      // immediately reflects the signed-out state.
    }
    clearAuth();
    toast.success("Signed out.");
    navigate("/", { replace: true });
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt="QuickBihar.in logo"
            width={36}
            height={36}
            className="h-9 w-9 rounded-lg object-contain shadow-sm"
          />
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-foreground">
              QuickBihar<span className="text-primary">.in</span>
            </span>
            <span className="text-[10px] font-medium text-muted-foreground -mt-0.5">
              Fashion & Fast Delivery
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          {navigation.navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-3 sm:flex">
          {loggedIn ? (
            dashboardUrl ? (
              /* Partner (admin / seller / delivery) — has a real dashboard */
              <Link to={dashboardUrl}>
                <Button
                  size="sm"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm font-medium"
                >
                  <LayoutDashboard className="mr-1.5 h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
            ) : (
              /* Customer (USER only) — no web dashboard. Show account menu
                 with the user's name + sign out so they can clear the
                 persistent auth state if they want. */
              <div className="relative" ref={userMenuRef}>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-border bg-card text-card-foreground hover:bg-muted"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <UserIcon className="mr-1.5 h-4 w-4" />
                  <span className="max-w-30 truncate">
                    {user?.fullName || "Account"}
                  </span>
                  <ChevronDown className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
                </Button>

                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full z-20 mt-2 w-64 overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg">
                      <div className="border-b border-border px-4 py-3">
                        <div className="text-sm font-semibold text-foreground truncate">
                          {user?.fullName || "Customer"}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {user?.email}
                        </div>
                        <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
                          {primaryRole || "USER"}
                        </div>
                      </div>
                      <div className="p-1">
                        <button
                          type="button"
                          onClick={handleSignOut}
                          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                        >
                          <LogOut className="h-4 w-4 text-muted-foreground" />
                          Sign out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )
          ) : (
            <>
              {/* Partner Dropdown */}
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-border bg-card text-card-foreground hover:bg-muted"
                  onClick={() => setPortalsOpen(!portalsOpen)}
                >
                  <span>{navigation.partnerButtonText}</span>
                  <ChevronDown className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
                </Button>

                {portalsOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setPortalsOpen(false)} />
                    <div className="absolute right-0 top-full z-20 mt-2 w-72 overflow-hidden rounded-lg border border-border bg-popover p-2 text-popover-foreground shadow-lg">
                      <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground border-b border-border">
                        {navigation.partnerMenuTitle}
                      </div>
                      <div className="mt-1 space-y-1">
                        {navigation.portalOptions.map((portal) => {
                          const Icon = iconMap[portal.icon] || Store;
                          return (
                            <div
                              key={portal.title}
                              className="rounded-md p-2 hover:bg-muted transition-colors"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="flex h-7 w-7 items-center justify-center rounded bg-primary/10 text-primary">
                                  <Icon className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-semibold text-foreground">
                                    {portal.title}
                                  </div>
                                  <div className="text-[11px] text-muted-foreground truncate">
                                    {portal.description}
                                  </div>
                                </div>
                              </div>
                              <div className="mt-2 flex items-center gap-2 pl-9.5 text-xs">
                                <Link
                                  to={portal.loginHref}
                                  onClick={() => setPortalsOpen(false)}
                                  className="font-medium text-primary hover:underline"
                                >
                                  Login
                                </Link>
                                {portal.registerHref && (
                                  <>
                                    <span className="text-muted-foreground">•</span>
                                    <Link
                                      to={portal.registerHref}
                                      onClick={() => setPortalsOpen(false)}
                                      className="font-medium text-foreground hover:underline"
                                    >
                                      Register
                                    </Link>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Play Store CTA */}
              <a
                href={APP_LINKS.PLAY_STORE}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
              >
                <Smartphone className="h-4 w-4" />
                <span>Get on Google Play</span>
              </a>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          className="flex sm:hidden p-2 text-muted-foreground hover:text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="border-t border-border bg-background sm:hidden px-4 py-4 space-y-3">
          {loggedIn ? (
            <>
              {/* Account block — same data as the desktop user menu, but
                  rendered inline so it's reachable on small screens. */}
              <div className="rounded-md border border-border bg-card p-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <UserIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-card-foreground">
                      {user?.fullName || "Customer"}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {user?.email}
                    </div>
                  </div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                    {primaryRole || "USER"}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2">
                  {dashboardUrl && (
                    <Link
                      to={dashboardUrl}
                      onClick={() => setMobileOpen(false)}
                      className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-sm"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Open Dashboard
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      handleSignOut();
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </div>

              <a
                href={APP_LINKS.PLAY_STORE}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 w-full rounded-md bg-primary/10 py-2.5 text-xs font-semibold text-primary shadow-sm"
              >
                <Smartphone className="h-4 w-4" />
                Download QuickBihar App
              </a>
            </>
          ) : (
            <>
              <a
                href={APP_LINKS.PLAY_STORE}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 w-full rounded-md bg-primary py-2.5 text-xs font-semibold text-primary-foreground shadow-sm"
              >
                <Smartphone className="h-4 w-4" />
                Download QuickBihar App
              </a>

              <div className="space-y-1">
                {navigation.navLinks.map((link) => (
                  <Link
                    key={link.label}
                    to={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="border-t border-border pt-3">
                <div className="px-3 pb-1.5 text-xs font-semibold text-muted-foreground">
                  Partner Portals
                </div>
                <div className="space-y-2">
                  {navigation.portalOptions.map((portal) => (
                    <div key={portal.title} className="rounded-md bg-card p-2.5 border border-border">
                      <div className="text-xs font-semibold text-card-foreground">{portal.title}</div>
                      <div className="mt-1.5 flex gap-3 text-xs">
                        <Link
                          to={portal.loginHref}
                          onClick={() => setMobileOpen(false)}
                          className="text-primary font-medium hover:underline"
                        >
                          Login →
                        </Link>
                        {portal.registerHref && (
                          <Link
                            to={portal.registerHref}
                            onClick={() => setMobileOpen(false)}
                            className="text-foreground font-medium hover:underline"
                          >
                            Register →
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </header>
  );
}
