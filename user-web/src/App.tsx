import { useEffect } from "react";
import { useAuthStore } from "./features/common/auth/store/authStore";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter } from "react-router-dom";
import { QueryProvider } from "./provider/QueryProvider";
import { ThemeProvider } from "./theme/Provider/ThemeProvider";
import MainLayout from "./provider/MainLayout";
import RouteTracker from "./analytics/RouteTracker";
import { initGA4 } from "./analytics/googleAnalytics";

export default function App() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    initializeAuth().catch(console.warn);
  }, [initializeAuth]);

  // GA4 loads once for the whole SPA lifetime (initGA4 is idempotent, so
  // StrictMode double-effects cannot inject the tag twice).
  useEffect(() => {
    initGA4();
  }, []);

  return (
    <ErrorBoundary>
      <HelmetProvider>
        <BrowserRouter>
          <RouteTracker />
          <QueryProvider>
            <ThemeProvider>
              <MainLayout />
            </ThemeProvider>
          </QueryProvider>
        </BrowserRouter>
      </HelmetProvider>
    </ErrorBoundary>
  );
}
