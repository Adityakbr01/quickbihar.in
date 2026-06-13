"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ChevronDown, Store, ShieldCheck, Bike, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/features/auth/store/authStore";

const navLinks = [
  { label: "Home", href: "#" },
  { label: "Features", href: "#features" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

const loginOptions = [
  { label: "Admin Login", href: "/admin/login", icon: ShieldCheck },
  { label: "Seller Login", href: "/seller/login", icon: Store },
  { label: "Delivery Login", href: "/delivery/login", icon: Bike },
];

const roleDashboard: Record<string, string> = {
  ADMIN: "/admin/dashboard",
  SUPER_ADMIN: "/admin/dashboard",
  SELLER: "/seller/dashboard",
  DELIVERY: "/delivery/dashboard",
};

function getRole(user: any): string {
  if (!user?.role) return "";
  if (typeof user.role === "string") return user.role;
  return user.role.name || "";
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const { isAuthenticated, user } = useAuthStore();
  const loggedIn = isAuthenticated && user;
  const dashboardUrl = roleDashboard[getRole(user)] || "";

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#0a0a0a]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-white">
          <span className="text-cyan-400">Quick</span>Bihar
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm text-gray-400 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {loggedIn ? (
            <Link href={dashboardUrl}>
              <Button size="sm" className="bg-cyan-500 text-black hover:bg-cyan-400">
                <LayoutDashboard className="mr-1.5 h-4 w-4" />
                Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                  onClick={() => setLoginOpen(!loginOpen)}
                >
                  Login
                  <ChevronDown className="ml-1 h-3.5 w-3.5" />
                </Button>
                {loginOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setLoginOpen(false)} />
                    <div className="absolute right-0 top-full z-20 mt-1 w-48 overflow-hidden rounded-lg border border-white/10 bg-[#1c1c1c] shadow-xl">
                      {loginOptions.map((opt) => {
                        const Icon = opt.icon;
                        return (
                          <Link
                            key={opt.label}
                            href={opt.href}
                            onClick={() => setLoginOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
                          >
                            <Icon className="h-4 w-4 text-gray-500" />
                            {opt.label}
                          </Link>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
              <Link href="/seller/register">
                <Button size="sm" className="bg-cyan-500 text-black hover:bg-cyan-400">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>

        <button
          className="flex md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-6 w-6 text-white" /> : <Menu className="h-6 w-6 text-white" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-white/10 bg-[#0a0a0a] md:hidden">
          <div className="space-y-1 px-4 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
            <hr className="border-white/10" />
            {loggedIn ? (
              <div className="pt-2">
                <Link href={dashboardUrl} onClick={() => setMobileOpen(false)}>
                  <Button size="sm" className="w-full bg-cyan-500 text-black hover:bg-cyan-400">
                    <LayoutDashboard className="mr-1.5 h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="space-y-1 pt-2">
                  {loginOptions.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <Link
                        key={opt.label}
                        href={opt.href}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
                      >
                        <Icon className="h-4 w-4 text-gray-500" />
                        {opt.label}
                      </Link>
                    );
                  })}
                </div>
                <div className="pt-3">
                  <Link href="/seller/register" onClick={() => setMobileOpen(false)}>
                    <Button size="sm" className="w-full bg-cyan-500 text-black hover:bg-cyan-400">
                      Get Started
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
