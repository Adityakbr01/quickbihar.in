import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import "./index.css";
import App from "./App";
import QueryProvider from "@/components/providers/QueryProvider";
import SocketListenerProvider from "@/components/providers/SocketListenerProvider";
import AuthProviders from "@/components/providers/AuthProviders";
import { Toaster } from "@/components/ui/sonner";
import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouteErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange storageKey="theme">
        <QueryProvider>
          <AuthProviders>
            <BrowserRouter>
              <SocketListenerProvider>
                <App />
              </SocketListenerProvider>
            </BrowserRouter>
          </AuthProviders>
          <Toaster position="top-center" richColors />
        </QueryProvider>
      </ThemeProvider>
    </RouteErrorBoundary>
  </StrictMode>,
);
