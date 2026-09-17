import { useEffect } from "react";
import DeliveryLoginForm from "@/features/auth/components/DeliveryLoginForm";

export default function DeliveryLoginPage() {
  useEffect(() => { document.title = "Delivery Login | QuickBihar Dashboard"; }, []);
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#101214] p-4">
      <DeliveryLoginForm />
      <div className="absolute bottom-10 left-0 right-0 text-center text-sm text-gray-500">
        QuickBihar Delivery Panel
      </div>
    </div>
  );
}
