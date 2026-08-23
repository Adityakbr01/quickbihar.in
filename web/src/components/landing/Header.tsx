"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  ChevronDown,
  Store,
  ShieldCheck,
  Bike,
  LayoutDashboard,
  Smartphone,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/features/auth/store/authStore";
import { getUserRoles } from "@/lib/rbac";
import { APP_LINKS, landingData } from "@/constants/links";

const iconMap: Record<string, typeof Store> = {
  Store,
  Bike,
  ShieldCheck,
};

const roleDashboard: Record<string, string> = {
  SUPER_ADMIN: "/admin/dashboard",
  ADMIN: "/admin/dashboard",
  SELLER: "/seller/dashboard",
  DELIVERY: "/delivery/dashboard",
  USER: "/",
};

function getRole(user: any) {
  const roles = getUserRoles(user);
  return roles[0] || "";
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [portalsOpen, setPortalsOpen] = useState(false);
  const { isAuthenticated, user } = useAuthStore();
  const loggedIn = isAuthenticated && user;
  const dashboardUrl = roleDashboard[getRole(user)] || "";
  const { navigation } = landingData;

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <ShoppingBag className="h-5 w-5" />
          </div>
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
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-3 sm:flex">
          {loggedIn ? (
            <Link href={dashboardUrl}>
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm font-medium">
                <LayoutDashboard className="mr-1.5 h-4 w-4" />
                Dashboard
              </Button>
            </Link>
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
                                  href={portal.loginHref}
                                  onClick={() => setPortalsOpen(false)}
                                  className="font-medium text-primary hover:underline"
                                >
                                  Login
                                </Link>
                                {portal.registerHref && (
                                  <>
                                    <span className="text-muted-foreground">•</span>
                                    <Link
                                      href={portal.registerHref}
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
                href={link.href}
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
                      href={portal.loginHref}
                      onClick={() => setMobileOpen(false)}
                      className="text-primary font-medium hover:underline"
                    >
                      Login →
                    </Link>
                    {portal.registerHref && (
                      <Link
                        href={portal.registerHref}
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
        </div>
      )}
    </header>
  );
}
