import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { toast } from "sonner";

const AUTH_STORAGE_KEY = "admin-auth-storage";

/**
 * URL substrings that should NEVER trigger the silent-refresh / sign-out flow.
 * The /auth/* endpoints are how users sign in — a 401/403 from one of them is
 * just "wrong credentials" or "role not allowed", not a session-expiry event.
 * Treating those as session-expiry would log the user out of an open browser
 * while they're literally trying to authenticate.
 */
const AUTH_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/google",
  "/auth/refresh-token",
  "/auth/request-reset",
  "/auth/reset-password",
  "/auth/set-password",
  "/auth/link-google",
  "/auth/logout",
];

const isAuthEndpoint = (url?: string) => {
  if (!url) return false;
  return AUTH_PATHS.some((path) => url.includes(path));
};

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important for cookies (refresh token is an httpOnly cookie)
});

/**
 * The persisted zustand auth store keeps the access token in localStorage under
 * `admin-auth-storage`. The refresh token is never held here — it lives only in
 * an httpOnly cookie the browser attaches automatically (withCredentials). These
 * helpers read/patch just the `token` field of the persisted blob so the request
 * interceptor and the store stay in sync after a silent refresh.
 */
const readPersistedToken = (): string | null => {
  if (typeof window === "undefined") return null;
  const persisted = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!persisted) return null;
  try {
    return JSON.parse(persisted)?.state?.token || null;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
};

const writePersistedToken = (token: string) => {
  if (typeof window === "undefined") return;
  const persisted = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!persisted) return;
  try {
    const parsed = JSON.parse(persisted);
    parsed.state = { ...parsed.state, token, isAuthenticated: true };
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // Corrupt blob — leave it; the failed-refresh path will clear auth.
  }
};

const clearPersistedAuth = async () => {
  if (typeof window === "undefined") return;
  // 1. Reset the in-memory Zustand store. Without this, the dashboard keeps
  //    seeing isAuthenticated=true from the in-memory state even after
  //    localStorage and the httpOnly cookie are cleared, so it remounts and
  //    re-fires its queries — which 401/403 again — which re-enters this
  //    handler — infinite reload loop. The proxy then bounces the user
  //    between /delivery/dashboard and /delivery/login on every cycle.
  try {
    const { useAuthStore } = await import("@/features/auth/store/authStore");
    useAuthStore.getState().clearAuth();
  } catch {
    // Module load failed (SSR, etc.) — still wipe localStorage as a fallback
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }
  // 2. Belt-and-braces: clear the persisted blob in case the store's
  //    clearAuth didn't fully wipe it (e.g. if persist has hydrated a stale
  //    snapshot mid-cycle).
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  // 3. The accessToken / refreshToken are httpOnly cookies — document.cookie
  //    CANNOT delete them. The only thing that can is the server's /auth/logout
  //    endpoint, which sets Set-Cookie with Max-Age=0. We hit it before
  //    redirecting; if it fails, fall back to a plain document.cookie write
  //    (harmless for non-httpOnly fallbacks, no-op for the real ones).
  //    `fetch` is used instead of `axios` because the bare-axios call here
  //    bypasses our interceptor stack and has more reliable CORS-preflight
  //    handling on cross-origin logout calls.
  try {
    await fetch(`${axiosInstance.defaults.baseURL}/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    });
  } catch {
    try {
      document.cookie = "accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    } catch {}
  }
};

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = readPersistedToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
);

// --- Silent token refresh (mirrors the mobile interceptor) ---
// On a 401 we hit /auth/refresh-token exactly once; concurrent 401s queue and
// replay after the single refresh resolves, so a burst of parallel requests
// triggers only one refresh call.
type RetriableConfig = AxiosRequestConfig & { _retry?: boolean };

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error || !token) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

const redirectToLogin = () => {
  if (typeof window === "undefined") return;
  const path = window.location.pathname;
  // Send each portal back to its own login; default to the admin login.
  const loginBase = path.startsWith("/seller")
    ? "/seller/login"
    : path.startsWith("/delivery")
      ? "/delivery/login"
      : "/admin/login";
  if (!path.startsWith(loginBase)) {
    toast.error("Your session has ended. Please sign in again.");
    // Use assign so the page fully reloads and React Query / zustand persist
    // state is cleared. Append ?expired=true so proxy.ts knows never to bounce
    // back to dashboard even if stale cookies linger.
    window.location.assign(`${loginBase}?expired=true`);
  }
};

let lastRedirectAt = 0;
const redirectToLoginDebounced = () => {
  // Many parallel 401/403s in flight at once — only fire one redirect per 2s
  // so we don't hammer the browser with back-to-back location.assign calls.
  const now = Date.now();
  if (now - lastRedirectAt < 2000) return;
  lastRedirectAt = now;
  redirectToLogin();
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableConfig | undefined;
    const status = error.response?.status;
    const url = originalRequest?.url || "";

    // Auth endpoints (login, register, google, refresh, reset, etc.) are how
    // a user signs in — a 401/403 there is "wrong credentials / wrong role"
    // and should NOT be treated as a session-expiry event. Just surface the
    // server's message and let the form handle it.
    if (isAuthEndpoint(url)) {
      const authMessage =
        (error.response?.data instanceof Object &&
          (error.response.data as { message?: string }).message) ||
        error.message ||
        "Authentication failed";
      return Promise.reject(new Error(authMessage));
    }

    if (status === 401) {
      // A 401 from the refresh endpoint itself is terminal — log out.
      if (url.includes("/auth/refresh-token")) {
        await clearPersistedAuth();
        redirectToLoginDebounced();
        return Promise.reject(new Error("Session expired"));
      }

      if (originalRequest && !originalRequest._retry) {
        // A refresh is already in flight — queue this request and replay it.
        if (isRefreshing) {
          return new Promise<string>((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then((token) => {
            originalRequest.headers = {
              ...originalRequest.headers,
              Authorization: `Bearer ${token}`,
            };
            return axiosInstance(originalRequest);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // The refresh token rides along as an httpOnly cookie (withCredentials);
          // no body needed. Use a bare axios call to skip these interceptors.
          const response = await axios.post(
            `${axiosInstance.defaults.baseURL}/auth/refresh-token`,
            {},
            { withCredentials: true },
          );

          const newToken: string = response.data?.data?.accessToken;
          if (!newToken) throw new Error("No access token in refresh response");

          writePersistedToken(newToken);
          axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
          originalRequest.headers = {
            ...originalRequest.headers,
            Authorization: `Bearer ${newToken}`,
          };

          processQueue(null, newToken);
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          await clearPersistedAuth();
          redirectToLoginDebounced();
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        // Retried and still 401 -> session invalid
        await clearPersistedAuth();
        redirectToLoginDebounced();
      }
    }

    // 403 from a protected route means the token is valid but the user's role
    // no longer matches what the endpoint requires. This is effectively
    // session-expiry from the dashboard's perspective — keep the user from
    // staring at a blank page full of failed requests.
    if (status === 403) {
      // CRITICAL: await the cookie clear before redirecting. The server
      // proxy (proxy.ts) redirects /delivery/login back to /delivery/dashboard
      // whenever the accessToken cookie is present. If we navigate before
      // /auth/logout finishes, the proxy sees the still-present cookie and
      // bounces the user straight back to the dashboard — a tight loop.
      await clearPersistedAuth();
      redirectToLoginDebounced();
      return Promise.reject(
        new Error(
          (error.response?.data instanceof Object &&
            (error.response.data as { message?: string }).message) ||
            "Access denied. Please sign in again.",
        ),
      );
    }

    const message =
      (error.response?.data instanceof Object &&
        (error.response.data as { message?: string }).message) ||
      error.message ||
      "Something went wrong";
    return Promise.reject(new Error(message));
  },
);

export default axiosInstance;
