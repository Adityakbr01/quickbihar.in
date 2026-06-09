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
