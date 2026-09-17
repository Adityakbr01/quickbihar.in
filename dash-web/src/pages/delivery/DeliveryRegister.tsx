import { useEffect } from "react";
import PartnerRegisterForm from "@/features/auth/components/PartnerRegisterForm";

export default function DeliveryRegisterPage() {
  useEffect(() => { document.title = "Delivery Registration | QuickBihar Dashboard"; }, []);
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#101214] p-4">
      <PartnerRegisterForm mode="RIDER" />
      <div className="absolute bottom-10 left-0 right-0 text-center text-sm text-gray-500">
        QuickBihar Delivery Onboarding
      </div>
    </div>
  );
}

