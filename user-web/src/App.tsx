import { useEffect } from "react";
import { useAuthStore } from "./features/common/auth/store/authStore";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter } from "react-router-dom";
import { QueryProvider } from "./provider/QueryProvider";
import { ThemeProvider } from "./theme/Provider/ThemeProvider";
import MainLayout from "./provider/MainLayout";

export default function App() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    initializeAuth().catch(console.warn);
  }, [initializeAuth]);

  return (
    <ErrorBoundary>
      <HelmetProvider>
        <BrowserRouter>
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
