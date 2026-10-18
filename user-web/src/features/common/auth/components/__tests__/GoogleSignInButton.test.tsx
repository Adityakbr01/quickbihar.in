import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import GoogleSignInButton, { _resetGsiSingletonForTesting } from "../GoogleSignInButton";

describe("GoogleSignInButton Lifecycle & Idempotency", () => {
  let mockInitialize: ReturnType<typeof vi.fn>;
  let mockRenderButton: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    _resetGsiSingletonForTesting();
    mockInitialize = vi.fn();
    mockRenderButton = vi.fn();

    (window as any).google = {
      accounts: {
        id: {
          initialize: mockInitialize,
          renderButton: mockRenderButton,
          prompt: vi.fn(),
        },
      },
    };
  });

  it("initializes GIS exactly once on mount", () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();

    render(<GoogleSignInButton onSuccess={onSuccess} onError={onError} />);

    expect(mockInitialize).toHaveBeenCalledTimes(1);
    expect(mockInitialize).toHaveBeenCalledWith(
      expect.objectContaining({
        client_id: expect.any(String),
        cancel_on_tap_outside: true,
      })
    );
  });

  it("does not re-call google.accounts.id.initialize on repeated component re-renders", () => {
    let count = 0;
    const { rerender } = render(
      <GoogleSignInButton
        onSuccess={() => { count++; }}
        onError={() => {}}
      />
    );

    expect(mockInitialize).toHaveBeenCalledTimes(1);

    // Re-render multiple times with new inline arrow functions (common React pattern)
    rerender(
      <GoogleSignInButton
        onSuccess={() => { count++; }}
        onError={() => {}}
      />
    );

    rerender(
      <GoogleSignInButton
        onSuccess={() => { count++; }}
        onError={() => {}}
        mode="link"
      />
    );

    // Crucial: initialize must NEVER have been called again!
    expect(mockInitialize).toHaveBeenCalledTimes(1);
  });

  it("forwards credential to the latest onSuccess callback without re-initializing", () => {
    const firstCallback = vi.fn();
    const secondCallback = vi.fn();

    const { rerender } = render(
      <GoogleSignInButton onSuccess={firstCallback} onError={vi.fn()} />
    );

    expect(mockInitialize).toHaveBeenCalledTimes(1);
    const registeredCallback = mockInitialize.mock.calls[0][0].callback;

    // Now update props with secondCallback
    rerender(
      <GoogleSignInButton onSuccess={secondCallback} onError={vi.fn()} />
    );

    // Simulate Google completing OAuth popup
    act(() => {
      registeredCallback({ credential: "mock_google_id_token_xyz" });
    });

    expect(firstCallback).not.toHaveBeenCalled();
    expect(secondCallback).toHaveBeenCalledTimes(1);
    expect(secondCallback).toHaveBeenCalledWith("mock_google_id_token_xyz");
  });
});
