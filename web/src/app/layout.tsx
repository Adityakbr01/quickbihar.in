import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/components/providers/QueryProvider";
import SocketListenerProvider from "@/components/providers/SocketListenerProvider";
import { Toaster } from "@/components/ui/sonner";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "QuickBihar - Bihar's Fastest Growing E-Commerce Platform",
  description: "Shop online with QuickBihar.in — best prices, fastest delivery across Bihar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={spaceGrotesk.className}>
        <QueryProvider>
          <SocketListenerProvider>
            {children}
          </SocketListenerProvider>
          <Toaster position="top-center" richColors />
        </QueryProvider>
      </body>
    </html>
  );
}
