export type AuthMode = "login" | "register" | "otp";

export interface AuthFormProps {
  loading: boolean;
  apiError: string | null;
  setApiError: (error: string | null) => void;
  apiSuccess: string | null;
  setApiSuccess: (msg: string | null) => void;
  switchMode: (mode: AuthMode) => void;
  setOtpEmail: (email: string) => void;
}
