"use client";

import AdminLoginForm from "@/features/auth/components/AdminLoginForm";

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1c1c1c] p-4 relative overflow-hidden">
      {/* Modular Login Form */}
      <AdminLoginForm />

      {/* Footer */}
      <div className="absolute bottom-10 left-0 right-0 text-center text-gray-500 text-sm">
        &copy; 2024 QuickBihar Control Center. All rights reserved.
      </div>
    </div>
  );
}
