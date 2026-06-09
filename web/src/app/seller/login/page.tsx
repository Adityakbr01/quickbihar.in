"use client";

import SellerLoginForm from "@/features/auth/components/SellerLoginForm";

export default function SellerLoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#121212] p-4">
      <div className="absolute inset-x-0 top-0 h-40 border-b border-emerald-400/10 bg-emerald-400/5" />
      <SellerLoginForm />
      <div className="absolute bottom-10 left-0 right-0 text-center text-sm text-gray-500">
        QuickBihar Fashion Seller Panel
      </div>
    </div>
  );
}
