import type { Metadata } from "next";

/**
 * Seller surface is private (login/register + store dashboard). Never indexed —
 * defense-in-depth alongside robots.ts disallow (plan §25).
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
