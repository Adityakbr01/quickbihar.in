import { useEffect } from "react";
import SellerLoginForm from "@/features/auth/components/SellerLoginForm";

export default function SellerLoginPage() {
  useEffect(() => { document.title = "Seller Login | QuickBihar Dashboard"; }, []);
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#121212] p-4">

      <SellerLoginForm />
      <div className="absolute bottom-10 left-0 right-0 text-center text-sm text-gray-500">
        QuickBihar Fashion Seller Panel
      </div>
    </div>
  );
}
