"use client";

/**
 * App-wide error boundary (Next.js 16 app router).
 *
 * Without this, any uncaught render error (a 403, a thrown promise in a
 * server component, a React Query hook returning malformed data, etc.)
 * leaves the user staring at a fully blank page. This boundary turns that
 * into a visible, recoverable state.
 *
 * It runs at the route segment level — every segment under `app/` inherits
 * it unless it defines its own `error.tsx` (none of our dashboards do, so
 * this is the catch-all for admin / seller / delivery / auth / public).
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, RefreshCcw, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

const loginPathFor = (pathname: string): string => {
  if (pathname.startsWith("/seller")) return "/seller/login";
  if (pathname.startsWith("/delivery")) return "/delivery/login";
  if (pathname.startsWith("/admin")) return "/admin/login";
  return "/admin/login";
};

export default function GlobalErrorPage({ error, reset }: ErrorPageProps) {
  const router = useRouter();

  useEffect(() => {
    // Log to the browser console so the developer network tab shows the
    // stack trace; the digest is also forwarded to the server-side error log
    // by Next.js.
    // eslint-disable-next-line no-console
    console.error("[GlobalErrorPage]", error);
  }, [error]);

  const handleBackToLogin = () => {
    if (typeof window === "undefined") return;
    window.location.assign(loginPathFor(window.location.pathname));
  };

  return (
    <main className="dark min-h-screen w-full bg-[#0e0e0e] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#181818] p-8 shadow-2xl">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 border border-red-500/30">
            <AlertTriangle className="h-7 w-7 text-red-400" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              Something went wrong
            </h1>
            <p className="text-sm text-gray-400">
              {error?.message
                ? error.message
                : "We hit an unexpected error loading this page. Your session may have ended."}
            </p>
          </div>

          {error?.digest && (
            <p className="text-[10px] font-mono text-gray-500 break-all">
              ref: {error.digest}
            </p>
          )}

          <div className="flex w-full flex-col gap-2 pt-2">
            <Button
              onClick={() => {
                reset();
                router.refresh();
              }}
              className="w-full bg-white text-black hover:bg-gray-200"
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Try again
            </Button>
            <Button
              onClick={handleBackToLogin}
              variant="ghost"
              className="w-full text-gray-300 hover:bg-white/10 hover:text-white"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Back to sign in
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
