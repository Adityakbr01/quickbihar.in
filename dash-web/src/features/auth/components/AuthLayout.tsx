import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";

interface AuthLayoutProps {
  children: ReactNode;
  /** Small footer line under the card. Defaults to the portal copyright. */
  note?: ReactNode;
  /** Wider container for multi-section forms (registration). */
  wide?: boolean;
}

/**
 * Shared shell for every auth screen: ambient theme-aware background,
 * brand header with theme toggle, centered content, footer note.
 * All colors come from src/index.css tokens so light/dark just works.
 */
export default function AuthLayout({ children, note, wide = false }: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-32 left-1/2 h-80 w-[50rem] max-w-none -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-32 h-72 w-72 rounded-full bg-tertiary/10 blur-3xl" />
        <div className="absolute -right-32 top-1/3 h-64 w-64 rounded-full bg-secondary/20 blur-3xl" />
      </div>

      {/* Brand header */}
      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5" aria-label="QuickBihar.in home">
          <img
            src="/logo.png"
            alt="QuickBihar.in logo"
            width={32}
            height={32}
            className="h-8 w-8 rounded-lg object-contain shadow-xs ring-1 ring-border"
          />
          <span className="font-display text-base font-bold tracking-tight text-foreground">
            QuickBihar<span className="text-primary">.in</span>
          </span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Centered content */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8">
        <div className={`w-full ${wide ? "max-w-2xl" : "max-w-sm"}`}>{children}</div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-4 pb-6 text-center text-xs text-muted-foreground">
        {note ?? (
          <p>&copy; {new Date().getFullYear()} QuickBihar.in · Partner Portal</p>
        )}
      </footer>
    </div>
  );
}
