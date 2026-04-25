import axiosInstance from "@/src/api/axiosInstance";

// ─── LOGIN ───────────────────────────────────────────────
export const loginRequest = async (data: { email: string; password: string }) => {
  const response = await axiosInstance.post("/auth/login", data);
  return response.data;
};

// ─── REGISTER ────────────────────────────────────────────
export const registerRequest = async (data: { email: string; password: string; fullName: string }) => {
  const response = await axiosInstance.post("/auth/register", data);
  return response.data;
};

// ─── REQUEST OTP ─────────────────────────────────────────
export const requestOTPRequest = async (email: string) => {
  const response = await axiosInstance.post("/auth/request-otp", { email });
  return response.data;
};

// ─── VERIFY OTP ──────────────────────────────────────────
export const verifyOTPRequest = async (data: { email: string; otp: string }) => {
  const response = await axiosInstance.post("/auth/verify-otp", data);
  return response.data;
};

// ─── LOGOUT ──────────────────────────────────────────────
export const logoutRequest = async () => {
  const response = await axiosInstance.post("/auth/logout");
  return response.data;
};
