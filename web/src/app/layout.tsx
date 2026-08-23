import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/components/providers/QueryProvider";
import SocketListenerProvider from "@/components/providers/SocketListenerProvider";
import { Toaster } from "@/components/ui/sonner";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "QuickBihar.in | Bihar's #1 Fashion & Instant Delivery App",
  description: "Shop trending fashion from local stores with 30-min delivery across Bihar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${spaceGrotesk.variable} font-sans antialiased`}>
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
