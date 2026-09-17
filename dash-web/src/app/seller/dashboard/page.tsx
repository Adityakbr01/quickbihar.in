import { Suspense } from "react";
import { SellerDashboardClient } from "./SellerDashboardClient";

export default function SellerDashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#121212]" />}>
      <SellerDashboardClient />
    </Suspense>
  );
}
