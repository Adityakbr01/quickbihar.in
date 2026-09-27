/**
 * Auth screen mode — only "login" and "register" remain after the
 * OTP cutover. Legacy OTP screen is gone; users authenticate via
 * Google (primary) or email+password (secondary).
 */
export type AuthMode = "login" | "register";

export interface AuthFormProps {
  loading: boolean;
  apiError: string | null;
  setApiError: (error: string | null) => void;
  apiSuccess: string | null;
  setApiSuccess: (msg: string | null) => void;
  switchMode: (mode: AuthMode) => void;
}
