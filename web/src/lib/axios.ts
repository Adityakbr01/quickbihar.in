import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";

const AUTH_STORAGE_KEY = "admin-auth-storage";

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

const clearPersistedAuth = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
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
  const loginPath = path.startsWith("/seller")
    ? "/seller/login"
    : path.startsWith("/delivery")
      ? "/delivery/login"
      : "/admin/login";
  if (path !== loginPath) window.location.assign(loginPath);
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableConfig | undefined;
    const status = error.response?.status;

    if (status === 401 && originalRequest && !originalRequest._retry) {
      const url = originalRequest.url || "";
      // A 401 from the refresh endpoint itself is terminal — log out.
      if (url.includes("/auth/refresh-token")) {
        clearPersistedAuth();
        redirectToLogin();
        return Promise.reject(
          new Error(error.response?.data instanceof Object
            ? (error.response.data as { message?: string }).message || "Session expired"
            : "Session expired"),
        );
      }

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
        clearPersistedAuth();
        redirectToLogin();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
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
