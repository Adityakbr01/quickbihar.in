import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import AuthScreen from "../auth.screen";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

// Mock Google Identity Services global
beforeEach(() => {
  (window as any).google = {
    accounts: {
      id: {
        initialize: vi.fn(),
        renderButton: vi.fn(),
        prompt: vi.fn(),
      },
    },
  };
});

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        {ui}
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("AuthScreen - Minimalist 1-Tap Google Screen", () => {
  it("renders the 4 essential elements: logo, title, app name, and Google login", () => {
    renderWithProviders(<AuthScreen />);

    // 1. Logo
    const logoImg = screen.getByAltText(/QuickBihar logo/i);
    expect(logoImg).toBeDefined();

    // 2. App Name & Eyebrow
    expect(screen.getByText(/Bihar's Own Marketplace/i)).toBeDefined();

    // 3. Title
    expect(screen.getByRole("heading", { level: 1 })).toBeDefined();
    expect(screen.getByText(/Welcome to QuickBihar/i)).toBeDefined();

    // 4. Google Login button
    const googleBtn = screen.getByRole("button", { name: /Continue with Google/i });
    expect(googleBtn).toBeDefined();
  });

  it("does not render email, password, or extra form inputs", () => {
    renderWithProviders(<AuthScreen />);

    expect(screen.queryByPlaceholderText(/name@example.com/i)).toBeNull();
    expect(screen.queryByPlaceholderText(/••••••••/i)).toBeNull();
    expect(screen.queryByRole("textbox")).toBeNull();
  });
});
