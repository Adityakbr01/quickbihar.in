import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/components/providers/QueryProvider";
import SocketListenerProvider from "@/components/providers/SocketListenerProvider";
import AuthProviders from "@/components/providers/AuthProviders";
import { Toaster } from "@/components/ui/sonner";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://dashboard.quickbihar.in"),
  title: {
    default: "QuickBihar Partner Dashboard | Admin, Seller & Delivery Portals",
    template: "%s | QuickBihar Dashboard",
  },
  description:
    "Partner portal for QuickBihar — manage orders, inventory, deliveries, and catalog across Bihar.",
  alternates: {
    canonical: "https://dashboard.quickbihar.in",
  },
  openGraph: {
    title: "QuickBihar Partner Dashboard",
    description: "Manage stores, inventory, and instant deliveries across Bihar.",
    url: "https://dashboard.quickbihar.in",
    siteName: "QuickBihar Dashboard",
    locale: "en_IN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        suppressHydrationWarning
        className={`${spaceGrotesk.variable} font-sans antialiased`}
      >
        <QueryProvider>
          <AuthProviders>
            <SocketListenerProvider>{children}</SocketListenerProvider>
          </AuthProviders>
          <Toaster position="top-center" richColors />
        </QueryProvider>
      </body>
    </html>
  );
}
