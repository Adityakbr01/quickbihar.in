import type { Metadata } from "next";

/**
 * Auth helper pages (password reset/set, Google linking) are thin utilities,
 * not landing pages. Never indexed (plan §25).
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
