import type { Metadata } from "next";

/**
 * Admin surface is private (login + operations dashboard). Never indexed —
 * defense-in-depth alongside robots.ts disallow (plan §25).
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
