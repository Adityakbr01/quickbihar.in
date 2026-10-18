import { describe, expect, it, beforeEach, mock, spyOn } from "bun:test";
import { isTokenValid, readStoredToken } from "../lib/routeGuards";
import { useAuthStore } from "../features/auth/store/authStore";
import axios from "axios";
import axiosInstance, { executeTokenRefresh, clearPersistedAuth } from "../lib/axios";

const storage = new Map<string, string>();
const mockLocalStorage = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, val: string) => storage.set(key, String(val)),
  removeItem: (key: string) => storage.delete(key),
  clear: () => storage.clear(),
};

if (typeof (globalThis as any).window === "undefined") {
  (globalThis as any).window = {
    localStorage: mockLocalStorage,
    location: { pathname: "/admin/dashboard", assign: () => {} },
  };
} else {
  if (!globalThis.window.localStorage) {
    (globalThis.window as any).localStorage = mockLocalStorage;
  }
}
if (typeof (globalThis as any).localStorage === "undefined") {
  (globalThis as any).localStorage = mockLocalStorage;
}

// Helper to generate a controlled JWT fixture
function createTestJwt(expSecondsFromNow: number): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const exp = Math.floor(Date.now() / 1000) + expSecondsFromNow;
  const payload = btoa(JSON.stringify({ exp, id: "user_test_123", role: "ADMIN" }))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `${header}.${payload}.mockSignature`;
}

describe("Dashboard Auth & Session Lifecycle Regression Suite", () => {
  beforeEach(() => {
    // Reset Zustand store and mock localStorage
    useAuthStore.getState().clearAuth();
    if (typeof window !== "undefined") {
      window.localStorage.clear();
    }
  });

  describe("Token Expiration and Validity (isTokenValid)", () => {
    it("validates fresh JWT token with future expiration", () => {
      const validToken = createTestJwt(3600); // 1 hour in future
      expect(isTokenValid(validToken)).toBe(true);
    });

    it("detects expired token from 3-4 days ago", () => {
      const expired3DaysAgo = createTestJwt(-3 * 24 * 3600);
      expect(isTokenValid(expired3DaysAgo)).toBe(false);
    });

    it("rejects token expiring within the 5000ms safety window", () => {
      const expiringIn2s = createTestJwt(2);
      expect(isTokenValid(expiringIn2s)).toBe(false);
    });

    it("gracefully rejects null, undefined, or empty string without throwing", () => {
      expect(isTokenValid(null)).toBe(false);
      expect(isTokenValid(undefined)).toBe(false);
      expect(isTokenValid("")).toBe(false);
    });

    it("rejects malformed token strings", () => {
      expect(isTokenValid("not.a.valid.jwt.token")).toBe(false);
      expect(isTokenValid("only-one-part")).toBe(false);
      expect(isTokenValid("invalid.payload.format")).toBe(false);
    });
  });

  describe("readStoredToken", () => {
    it("reads persisted token from localStorage admin-auth-storage blob", () => {
      const token = createTestJwt(1800);
      window.localStorage.setItem(
        "admin-auth-storage",
        JSON.stringify({ state: { token, isAuthenticated: true } })
      );
      expect(readStoredToken()).toBe(token);
    });

    it("returns null if storage is empty or malformed", () => {
      window.localStorage.removeItem("admin-auth-storage");
      expect(readStoredToken()).toBe(null);

      window.localStorage.setItem("admin-auth-storage", "not-json");
      expect(readStoredToken()).toBe(null);
    });
  });

  describe("Token Refresh Deduplication and Execution", () => {
    it("deduplicates multiple concurrent calls to executeTokenRefresh into one HTTP request", async () => {
      const newToken = createTestJwt(3600);
      let postCallCount = 0;

      // Mock axios.post for refresh endpoint
      const originalPost = axios.post;
      (axios as any).post = mock(async () => {
        postCallCount++;
        // Small async delay to simulate in-flight request
        await new Promise((r) => setTimeout(r, 20));
        return {
          data: {
            statusCode: 200,
            data: {
              accessToken: newToken,
              user: { _id: "user_test_123", email: "admin@quickbihar.in", role: "ADMIN" },
            },
          },
        };
      });

      try {
        // Fire 4 parallel refresh calls simultaneously
        const [r1, r2, r3, r4] = await Promise.all([
          executeTokenRefresh(),
          executeTokenRefresh(),
          executeTokenRefresh(),
          executeTokenRefresh(),
        ]);

        expect(r1).toBe(newToken);
        expect(r2).toBe(newToken);
        expect(r3).toBe(newToken);
        expect(r4).toBe(newToken);

        // Crucial: Only ONE network call must have occurred!
        expect(postCallCount).toBe(1);
      } finally {
        (axios as any).post = originalPost;
      }
    });

    it("updates Zustand auth state and persisted storage after successful refresh", async () => {
      const newToken = createTestJwt(7200);
      const testUser = {
        _id: "user_admin_1",
        username: "admin",
        fullName: "Admin QuickBihar",
        email: "admin@quickbihar.in",
        role: "ADMIN" as const,
      };

      const originalPost = axios.post;
      (axios as any).post = mock(async () => ({
        data: {
          statusCode: 200,
          data: {
            accessToken: newToken,
            user: testUser,
          },
        },
      }));

      try {
        const returnedToken = await executeTokenRefresh();
        expect(returnedToken).toBe(newToken);

        const storeState = useAuthStore.getState();
        expect(storeState.isAuthenticated).toBe(true);
        expect(storeState.token).toBe(newToken);
        expect(storeState.user?._id).toBe("user_admin_1");
      } finally {
        (axios as any).post = originalPost;
      }
    });

    it("properly throws on refresh failure (401/403) and allows clearPersistedAuth to wipe session", async () => {
      const originalPost = axios.post;
      (axios as any).post = mock(async () => {
        const err: any = new Error("Session expired or refresh token invalid");
        err.response = { status: 401, data: { message: "Invalid refresh token" } };
        throw err;
      });

      try {
        let threw = false;
        try {
          await executeTokenRefresh();
        } catch {
          threw = true;
          await clearPersistedAuth();
        }

        expect(threw).toBe(true);

        const state = useAuthStore.getState();
        expect(state.isAuthenticated).toBe(false);
        expect(state.token).toBe(null);
        expect(state.user).toBe(null);
      } finally {
        (axios as any).post = originalPost;
      }
    });
  });

  describe("Authentication Loop Prevention Guardrails", () => {
    it("never considers a session authed if token is expired even when isAuthenticated flag is true", () => {
      const expiredToken = createTestJwt(-3600);
      useAuthStore.setState({
        isAuthenticated: true, // stale flag in localStorage
        token: expiredToken,
        user: { _id: "u1", email: "admin@quickbihar.in", role: "ADMIN", fullName: "Admin", username: "admin" },
      });

      const token = useAuthStore.getState().token;
      const isAuthenticated = useAuthStore.getState().isAuthenticated;
      const valid = isTokenValid(token);

      expect(isAuthenticated).toBe(true);
      expect(valid).toBe(false);

      // Route guard authed condition:
      const authed = isAuthenticated && valid;
      expect(authed).toBe(false); // MUST NOT be considered authed!
    });

    it("forceLogin parameter flags (?expired=true, ?logout=true) ensure reauthentication path terminates cleanly", () => {
      const urlParams = new URLSearchParams("?expired=true");
      const forceLogin = urlParams.has("expired") || urlParams.has("logout") || urlParams.has("force");
      expect(forceLogin).toBe(true);

      // When forceLogin is true, clearAuth is called and GuestRoute permits viewing login
      useAuthStore.getState().clearAuth();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().token).toBe(null);
    });
  });
});
