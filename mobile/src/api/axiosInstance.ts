import axios from "axios";
import { useAuthStore } from "../features/common/auth/store/authStore";
import { authStorage } from "../lib/authStorage";

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

// Configure these in Expo/EAS with EXPO_PUBLIC_API_URL and EXPO_PUBLIC_SOCKET_URL.
export const API_ORIGIN = trimTrailingSlash(
  process.env.EXPO_PUBLIC_API_ORIGIN ||
  process.env.EXPO_PUBLIC_SOCKET_URL ||
  (__DEV__ ? "http://10.0.2.2:8000" : "http://80.225.194.37"),
);

export const API_URL = trimTrailingSlash(
  process.env.EXPO_PUBLIC_API_URL ||
  `${API_ORIGIN}/api/v1`,
);

// Kept for existing socket imports. This is the API/socket origin, not the /api/v1 URL.
export const LOCAL_URL = API_ORIGIN;
const BASE_URL = API_URL;

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Variables to handle token refresh
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Request Interceptor: Inject JWT token into headers
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      const token = await authStorage.getItemAsync("userToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error retrieving token:", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response Interceptor: Handle global errors and token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Distinguish between Network Error and Server Error
    if (error.code === "ERR_NETWORK") {
      return Promise.reject(
        new Error(
          `Network Error: Could not reach server at ${BASE_URL}. Ensure your phone is on the same Wi-Fi as your PC.`,
        ),
      );
    }

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If we are already refreshing, queue the request
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = "Bearer " + token;
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      // If the error is from the refresh token endpoint itself, logout
      if (originalRequest.url.includes("/auth/refresh-token")) {
        await useAuthStore.getState().clearAuth();
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await authStorage.getItemAsync("refreshToken");

        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        const response = await axios.post(`${BASE_URL}/auth/refresh-token`, {
          refreshToken: refreshToken,
        });

        const {
          accessToken,
          refreshToken: newRefreshToken,
          user,
        } = response.data.data;

        // Update auth store and persisted session data.
        await useAuthStore
          .getState()
          .setAuth(user, accessToken, newRefreshToken);

        // Update header and retry original request
        axiosInstance.defaults.headers.common["Authorization"] =
          `Bearer ${accessToken}`;
        originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;

        processQueue(null, accessToken);
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await useAuthStore.getState().clearAuth();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    const message = error.response?.data?.message || "Something went wrong";
    return Promise.reject(new Error(message));
  },
);

export default axiosInstance;
