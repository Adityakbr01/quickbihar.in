import * as z from "zod";

export const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export type LoginValues = z.infer<typeof loginSchema>;

export interface AuthUser {
  _id: string;
  username: string;
  email: string;
  fullName: string;
  role: "admin" | "user";
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
