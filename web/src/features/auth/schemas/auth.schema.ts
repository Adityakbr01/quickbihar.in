import * as z from "zod";

export const loginSchema = z.object({
  email: z.string().refine((val) => {
    const isEmail = z.string().email().safeParse(val).success;
    const isPhone = /^\d{10}$/.test(val.replace(/\D/g, "").slice(-10));
    return isEmail || isPhone;
  }, {
    message: "Must be a valid email address or 10-digit phone number",
  }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  phone: z.string().length(10, { message: "Phone number must be exactly 10 digits" }),
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters" }),
});


export const verifyOtpSchema = z.object({
  email: z.string().optional(),
  phone: z.string().optional(),
  target: z.string().optional(),
  otp: z.string().length(6, { message: "OTP must be 6 digits" }),
});

export type RegisterValues = z.infer<typeof registerSchema>;
export type VerifyOtpValues = z.infer<typeof verifyOtpSchema>;

export interface AuthUser {
  _id: string;
  username: string;
  email: string;
  phone?: string;
  fullName: string;
  role: "ADMIN" | "SUPER_ADMIN" | "SELLER" | "DELIVERY" | "USER" | null | {
    _id: string;
    name: "ADMIN" | "SUPER_ADMIN" | "SELLER" | "DELIVERY" | "USER";
    description?: string;
  };
}

export interface AuthResponse {
  statusCode: number;
  data: {
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
    isNewUser: boolean;
  };
  message: string;
}
