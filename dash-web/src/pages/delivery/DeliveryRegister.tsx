import { useEffect } from "react";
import PartnerRegisterForm from "@/features/auth/components/PartnerRegisterForm";
import AuthLayout from "@/features/auth/components/AuthLayout";

export default function DeliveryRegisterPage() {
  useEffect(() => { document.title = "Delivery Registration | QuickBihar Dashboard"; }, []);
  return (
    <AuthLayout wide note="QuickBihar Delivery Onboarding">
      <PartnerRegisterForm mode="RIDER" />
    </AuthLayout>
  );
}
