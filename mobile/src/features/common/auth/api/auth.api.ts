import axiosInstance from "@/src/api/axiosInstance";

// ─── LOGIN (email + password) ────────────────────────────
export const loginRequest = async (data: { email: string; password: string }) => {
  const response = await axiosInstance.post("/auth/login", data);
  return response.data;
};

// ─── REGISTER (email + password + fullName) ─────────────
export const registerRequest = async (data: {
  email: string;
  password: string;
  fullName: string;
}) => {
  const response = await axiosInstance.post("/auth/register", data);
  return response.data;
};

// ─── GOOGLE OAUTH ───────────────────────────────────────
// Sends the Google ID token obtained from the native SDK to the server.
// The server verifies it, looks up or creates the user, and issues
// access + refresh tokens. Optional `legacyPhone` is sent only for
// legacy OTP users who still have a `phone` on file; the server uses
// it to merge identities on the same person.
export const googleAuthRequest = async (data: {
  idToken: string;
  client?: "web" | "mobile";
  legacyPhone?: string;
}) => {
  const response = await axiosInstance.post("/auth/google", data);
  return response.data;
};

// ─── SET PASSWORD (authenticated) ────────────────────────
// Lets a logged-in user set a password if they only have a Google
// identity, or change their existing password. The new password is
// stored as a parallel "password" identity on the user document.
export const setPasswordRequest = async (data: {
  password: string;
  currentPassword?: string;
}) => {
  const response = await axiosInstance.post("/auth/set-password", data);
  return response.data;
};

// ─── LINK GOOGLE (authenticated) ─────────────────────────
// Lets a logged-in password user link a Google identity to their
// existing account. Verifies the ID token then pushes a new identity
// subdoc onto the user.
export const linkGoogleRequest = async (data: { idToken: string }) => {
  const response = await axiosInstance.post("/auth/link-google", data);
  return response.data;
};

// ─── REQUEST PASSWORD RESET ─────────────────────────────
// Sends a one-time reset link to the user's email. The link contains
// a 15-minute JWT with aud:"reset". Always returns 200 to avoid
// leaking which emails are registered.
export const requestResetRequest = async (data: { email: string }) => {
  const response = await axiosInstance.post("/auth/request-reset", data);
  return response.data;
};

// ─── RESET PASSWORD (consumes the reset link) ────────────
// Body carries the `token` (from the email link) and the new password.
// The server validates the JWT, marks it consumed in Redis, and
// updates the password identity.
export const resetPasswordRequest = async (data: {
  token: string;
  password: string;
}) => {
  const response = await axiosInstance.post("/auth/reset-password", data);
  return response.data;
};

// ─── UPDATE PROFILE (post-signup completion) ────────────
// Patches the user's name/email/phone after Google sign-in so the
// legacy synthetic email can be replaced with a real one. This
// endpoint exists already on the user router.
export const updateProfileRequest = async (data: {
  fullName?: string;
  email?: string;
  phone?: string;
}) => {
  const response = await axiosInstance.patch("/users/profile", data);
  return response.data;
};

// ─── LOGOUT ──────────────────────────────────────────────
export const logoutRequest = async () => {
  const response = await axiosInstance.post("/auth/logout");
  return response.data;
};
