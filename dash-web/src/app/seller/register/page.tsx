"use client";

import PartnerRegisterForm from "@/features/auth/components/PartnerRegisterForm";

export default function SellerRegisterPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#121212] p-4">

      <PartnerRegisterForm mode="SELLER" />
      <div className="absolute bottom-10 left-0 right-0 text-center text-sm text-gray-500">
        QuickBihar Seller Onboarding
      </div>
    </div>
  );
}

