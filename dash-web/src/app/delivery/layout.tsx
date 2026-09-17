import type { Metadata } from "next";

/**
 * Delivery surface is private (login/register + rider dashboard). Never indexed —
 * defense-in-depth alongside robots.ts disallow (plan §25).
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function DeliveryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
