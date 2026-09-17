import { useEffect } from "react";
import DeliveryLoginForm from "@/features/auth/components/DeliveryLoginForm";
import AuthLayout from "@/features/auth/components/AuthLayout";

export default function DeliveryLoginPage() {
  useEffect(() => { document.title = "Delivery Login | QuickBihar Dashboard"; }, []);
  return (
    <AuthLayout note="QuickBihar Delivery Panel">
      <DeliveryLoginForm />
    </AuthLayout>
  );
}
