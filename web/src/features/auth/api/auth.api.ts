import axiosInstance from "@/lib/axios";
import { LoginValues, AuthResponse, RegisterValues, VerifyOtpValues } from "../schemas/auth.schema";

export const loginRequest = async (values: LoginValues): Promise<AuthResponse> => {
  const response = await axiosInstance.post("/auth/login", values);
  return response.data;
};

export const registerRequest = async (values: RegisterValues): Promise<AuthResponse> => {
  const response = await axiosInstance.post("/auth/register", values);
  return response.data;
};

export const verifyOtpRequest = async (values: VerifyOtpValues): Promise<AuthResponse> => {
  const response = await axiosInstance.post("/auth/verify-otp", values);
  return response.data;
};

export const requestOtpRequest = async (values: { target: string; isRegistration?: boolean }): Promise<any> => {
  const response = await axiosInstance.post("/auth/request-otp", values);
  return response.data;
};

export const updateProfileRequest = async (values: { email?: string; password?: string; fullName?: string }): Promise<any> => {
  const response = await axiosInstance.patch("/users/profile", values);
  return response.data;
};

export const logoutRequest = async (): Promise<any> => {
  try {
    const response = await axiosInstance.post("/auth/logout");
    return response.data;
  } catch {
    return null;
  }
};

