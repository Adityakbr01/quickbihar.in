import axios from "axios";

// Since this is the Web app running on host machine, and server is on localhost:8000
const axiosInstance = axios.create({
  baseURL: "http://localhost:8000/api/v1",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important for cookies
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
