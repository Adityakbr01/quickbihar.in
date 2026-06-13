import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important for cookies
});

axiosInstance.interceptors.request.use((config) => {
  if (typeof window === "undefined") return config;

  const persisted = window.localStorage.getItem("admin-auth-storage");
  if (!persisted) return config;

  try {
    const parsed = JSON.parse(persisted);
    const token = parsed?.state?.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    window.localStorage.removeItem("admin-auth-storage");
  }

  return config;
});

// Response Interceptor for global errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || "Something went wrong";
    return Promise.reject(new Error(message));
  }
);

export default axiosInstance;
