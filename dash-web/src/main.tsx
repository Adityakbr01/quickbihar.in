import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
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
    </RouteErrorBoundary>
  </StrictMode>,
);
