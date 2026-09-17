import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import "./index.css";
import App from "./App";
import QueryProvider from "@/components/providers/QueryProvider";
import SocketListenerProvider from "@/components/providers/SocketListenerProvider";
import AuthProviders from "@/components/providers/AuthProviders";
import { Toaster } from "react-hot-toast";
import { ConfirmProvider } from "@/components/ui/confirm-dialog";
import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouteErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange storageKey="theme">
        <QueryProvider>
          <AuthProviders>
            <BrowserRouter>
              <ConfirmProvider>
                <SocketListenerProvider>
                  <App />
                </SocketListenerProvider>
              </ConfirmProvider>
            </BrowserRouter>
          </AuthProviders>
          <Toaster
            position="top-center"
            gutter={8}
            toastOptions={{
              duration: 4000,
              style: {
                background: "var(--color-popover)",
                color: "var(--color-popover-foreground)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-lg)",
                fontSize: "14px",
                maxWidth: "420px",
              },
              error: { duration: 5000 },
            }}
          />
        </QueryProvider>
      </ThemeProvider>
    </RouteErrorBoundary>
  </StrictMode>,
);
