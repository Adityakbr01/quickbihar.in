import { Suspense, useEffect } from "react"
import { SellerDashboardClient } from "./SellerDashboardClient";

export default function SellerDashboardPage() {
  useEffect(() => { document.title = "Seller Dashboard | QuickBihar Dashboard"; }, []);
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#121212]" />}>
      <SellerDashboardClient />
    </Suspense>
  );
}
