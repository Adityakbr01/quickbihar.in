import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// For Real Devices: Use your machine's local IP address.
// I found your IP is: 10.193.97.27
// For Android emulator: 10.0.2.2
// For iOS Simulator/Web: localhost
const BASE_URL = Platform.OS === "android"
  ? "http://10.193.97.27:8000/api/v1"
  : "http://10.193.97.27:8000/api/v1";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Inject JWT token into headers
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync("userToken");
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
  }
);

// Response Interceptor: Handle global errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Distinguish between Network Error and Server Error
    if (error.code === 'ERR_NETWORK') {
      return Promise.reject(new Error(`Network Error: Could not reach server at ${BASE_URL}. Ensure your phone is on the same Wi-Fi as your PC.`));
    }

    const message = error.response?.data?.message || "Something went wrong";
    return Promise.reject(new Error(message));
  }
);

export default axiosInstance;
