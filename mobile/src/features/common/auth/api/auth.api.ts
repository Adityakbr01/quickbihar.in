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

export const requestOTPRequest = async (
  payload: string | { email?: string; phone?: string; target?: string; isRegistration?: boolean; flow?: string }
) => {
  const data = typeof payload === "string" ? { target: payload, phone: payload, email: payload } : payload;
  const response = await axiosInstance.post("/auth/request-otp", data);
  return response.data;
};

// ─── VERIFY OTP ──────────────────────────────────────────
export const verifyOTPRequest = async (data: { email?: string; phone?: string; target?: string; identifier?: string; otp: string }) => {
  const response = await axiosInstance.post("/auth/verify-otp", data);
  return response.data;
};

// ─── LOGOUT ──────────────────────────────────────────────
export const logoutRequest = async () => {
  const response = await axiosInstance.post("/auth/logout");
  return response.data;
};
