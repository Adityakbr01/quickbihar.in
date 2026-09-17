import { useEffect } from "react";
import SellerLoginForm from "@/features/auth/components/SellerLoginForm";
import AuthLayout from "@/features/auth/components/AuthLayout";

export default function SellerLoginPage() {
  useEffect(() => { document.title = "Seller Login | QuickBihar Dashboard"; }, []);
  return (
    <AuthLayout note="QuickBihar Fashion Seller Panel" portal="seller">
      <SellerLoginForm />
    </AuthLayout>
  );
}
