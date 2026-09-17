import { useEffect } from "react";
import AdminLoginForm from "@/features/auth/components/AdminLoginForm";
import AuthLayout from "@/features/auth/components/AuthLayout";

export default function AdminLoginPage() {
  useEffect(() => { document.title = "Admin Login | QuickBihar Dashboard"; }, []);
  return (
    <AuthLayout note="QuickBihar Control Center · Restricted access" portal="admin">
      <AdminLoginForm />
    </AuthLayout>
  );
}
