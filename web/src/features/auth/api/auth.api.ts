import axiosInstance from "@/lib/axios";
import {
  LoginValues,
  AuthResponse,
  RegisterValues,
  GoogleAuthValues,
  SetPasswordValues,
  LinkGoogleValues,
  RequestResetValues,
  ResetPasswordValues,
  PasswordResetResponse,
  UpdateProfileValues,
} from "../schemas/auth.schema";

export const loginRequest = async (values: LoginValues): Promise<AuthResponse> => {
  const response = await axiosInstance.post("/auth/login", values);
  return response.data;
};

export const registerRequest = async (values: RegisterValues): Promise<AuthResponse> => {
  const response = await axiosInstance.post("/auth/register", values);
  return response.data;
};

export const googleAuthRequest = async (values: GoogleAuthValues): Promise<AuthResponse> => {
  const response = await axiosInstance.post("/auth/google", {
    idToken: values.idToken,
    client: "web",
    ...(values.legacyPhone ? { legacyPhone: values.legacyPhone } : {}),
  });
  return response.data;
};

export const setPasswordRequest = async (
  values: SetPasswordValues,
): Promise<{ statusCode: number; data: { ok: boolean } }> => {
  const response = await axiosInstance.post("/auth/set-password", {
    password: values.password,
    currentPassword: values.currentPassword,
  });
  return response.data;
};

export const linkGoogleRequest = async (
  values: LinkGoogleValues,
): Promise<{ statusCode: number; data: { ok: boolean } }> => {
  const response = await axiosInstance.post("/auth/link-google", {
    idToken: values.idToken,
  });
  return response.data;
};

export const requestResetRequest = async (
  values: RequestResetValues,
): Promise<PasswordResetResponse> => {
  const response = await axiosInstance.post("/auth/request-reset", {
    email: values.email,
  });
  return response.data;
};

export const resetPasswordRequest = async (
  values: ResetPasswordValues,
): Promise<{ statusCode: number; data: { ok: boolean } }> => {
  const response = await axiosInstance.post("/auth/reset-password", {
    token: values.token,
    password: values.password,
  });
  return response.data;
};

export const updateProfileRequest = async (
  values: UpdateProfileValues,
): Promise<AuthResponse> => {
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
