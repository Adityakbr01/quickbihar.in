"use client";

import DeliveryLoginForm from "@/features/auth/components/DeliveryLoginForm";

export default function DeliveryLoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#101214] p-4">
      <div className="absolute inset-x-0 top-0 h-40 border-b border-cyan-400/10 bg-cyan-400/5" />
      <DeliveryLoginForm />
      <div className="absolute bottom-10 left-0 right-0 text-center text-sm text-gray-500">
        QuickBihar Delivery Panel
      </div>
    </div>
  );
}
