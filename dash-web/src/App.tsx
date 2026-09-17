import { Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { GuestRoute, NoIndex, ProtectedRoute, ScrollToTop } from "@/lib/routeGuards";
import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";

import Home from "@/pages/Home";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import ReturnPolicy from "@/pages/ReturnPolicy";
import TermsOfService from "@/pages/TermsOfService";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import LinkGoogle from "@/pages/auth/LinkGoogle";
import ResetPassword from "@/pages/auth/ResetPassword";
import SetPassword from "@/pages/auth/SetPassword";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import SellerLogin from "@/pages/seller/SellerLogin";
import SellerRegister from "@/pages/seller/SellerRegister";
import SellerDashboard from "@/pages/seller/SellerDashboard";
import DeliveryLogin from "@/pages/delivery/DeliveryLogin";
import DeliveryRegister from "@/pages/delivery/DeliveryRegister";
import DeliveryDashboard from "@/pages/delivery/DeliveryDashboard";

const DashboardFallback = <div className="min-h-screen bg-[#121212]" />;

function NotFound() {
  return (
    <main className="dark min-h-screen w-full bg-[#0e0e0e] text-white flex items-center justify-center p-6">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold">Page not found</h1>
        <p className="text-sm text-gray-400">
          The page you are looking for does not exist.
        </p>
        <a href="/" className="text-sm text-emerald-300 hover:text-emerald-200">
          Go home →
        </a>
      </div>
    </main>
  );
}

/**
 * React Router replacement for the Next.js App Router file tree.
 * Section-style dashboard URLs (`/admin/dashboard/Orders`,
 * `/seller/dashboard/Products`) keep working via the `:section` param —
 * the dashboard components resolve the section from the pathname, so both
 * `/admin/dashboard` and `/admin/dashboard/:section` render the same page.
 */
export default function App() {
  return (
    <RouteErrorBoundary>
      <ScrollToTop />
      <Routes>
        {/* Public landing + legal pages */}
        <Route path="/" element={<Home />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/return-policy" element={<ReturnPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />

        {/* Auth helpers (never indexed) */}
        <Route
          path="/auth/forgot-password"
          element={
            <NoIndex>
              <ForgotPassword />
            </NoIndex>
          }
        />
        <Route
          path="/auth/link-google"
          element={
            <NoIndex>
              <LinkGoogle />
            </NoIndex>
          }
        />
        <Route
          path="/auth/reset-password"
          element={
            <NoIndex>
              <ResetPassword />
            </NoIndex>
          }
        />
        <Route
          path="/auth/set-password"
          element={
            <NoIndex>
              <SetPassword />
            </NoIndex>
          }
        />

        {/* Admin portal */}
        <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
        <Route
          path="/admin/login"
          element={
            <NoIndex>
              <GuestRoute dashboardTo="/admin/dashboard">
                <AdminLogin />
              </GuestRoute>
            </NoIndex>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <NoIndex>
              <ProtectedRoute loginTo="/admin/login">
                <Suspense fallback={DashboardFallback}>
                  <AdminDashboard />
                </Suspense>
              </ProtectedRoute>
            </NoIndex>
          }
        />
        <Route
          path="/admin/dashboard/:section"
          element={
            <NoIndex>
              <ProtectedRoute loginTo="/admin/login">
                <Suspense fallback={DashboardFallback}>
                  <AdminDashboard />
                </Suspense>
              </ProtectedRoute>
            </NoIndex>
          }
        />

        {/* Seller portal */}
        <Route path="/seller" element={<Navigate to="/seller/login" replace />} />
        <Route
          path="/seller/login"
          element={
            <NoIndex>
              <GuestRoute dashboardTo="/seller/dashboard">
                <SellerLogin />
              </GuestRoute>
            </NoIndex>
          }
        />
        <Route
          path="/seller/register"
          element={
            <NoIndex>
              <SellerRegister />
            </NoIndex>
          }
        />
        <Route
          path="/seller/dashboard"
          element={
            <NoIndex>
              <ProtectedRoute loginTo="/seller/login">
                <Suspense fallback={DashboardFallback}>
                  <SellerDashboard />
                </Suspense>
              </ProtectedRoute>
            </NoIndex>
          }
        />
        <Route
          path="/seller/dashboard/:section"
          element={
            <NoIndex>
              <ProtectedRoute loginTo="/seller/login">
                <Suspense fallback={DashboardFallback}>
                  <SellerDashboard />
                </Suspense>
              </ProtectedRoute>
            </NoIndex>
          }
        />

        {/* Delivery portal */}
        <Route
          path="/delivery"
          element={<Navigate to="/delivery/login" replace />}
        />
        <Route
          path="/delivery/login"
          element={
            <NoIndex>
              <GuestRoute dashboardTo="/delivery/dashboard">
                <DeliveryLogin />
              </GuestRoute>
            </NoIndex>
          }
        />
        <Route
          path="/delivery/register"
          element={
            <NoIndex>
              <DeliveryRegister />
            </NoIndex>
          }
        />
        <Route
          path="/delivery/dashboard"
          element={
            <NoIndex>
              <ProtectedRoute loginTo="/delivery/login">
                <Suspense fallback={DashboardFallback}>
                  <DeliveryDashboard />
                </Suspense>
              </ProtectedRoute>
            </NoIndex>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </RouteErrorBoundary>
  );
}
