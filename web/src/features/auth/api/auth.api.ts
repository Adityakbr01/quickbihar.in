import axiosInstance from "@/lib/axios";
import { LoginValues, AuthResponse } from "../schemas/auth.schema";

export const loginRequest = async (values: LoginValues): Promise<AuthResponse> => {
  const response = await axiosInstance.post("/auth/login", values);
  return response.data;
};
