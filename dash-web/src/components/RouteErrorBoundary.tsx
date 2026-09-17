import { Component, type ReactNode } from "react";
import { AlertTriangle, LogIn, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * App-wide error boundary (Vite replacement for Next.js `app/error.tsx` +
 * `app/global-error.tsx`). Turns an uncaught render error into a visible,
 * recoverable state instead of a blank page.
 */

const loginPathFor = (pathname: string): string => {
  if (pathname.startsWith("/seller")) return "/seller/login";
  if (pathname.startsWith("/delivery")) return "/delivery/login";
  if (pathname.startsWith("/admin")) return "/admin/login";
  return "/admin/login";
};

function ErrorFallback({
  error,
  onReset,
}: {
  error: Error;
  onReset: () => void;
}) {
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

          <div className="flex w-full flex-col gap-2 pt-2">
            <Button
              onClick={() => {
                onReset();
                window.location.reload();
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

interface State {
  error: Error | null;
}

export class RouteErrorBoundary extends Component<
  { children: ReactNode },
  State
> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    // eslint-disable-next-line no-console
    console.error("[RouteErrorBoundary]", error);
  }

  render() {
    if (this.state.error) {
      return (
        <ErrorFallback
          error={this.state.error}
          onReset={() => this.setState({ error: null })}
        />
      );
    }
    return this.props.children;
  }
}
