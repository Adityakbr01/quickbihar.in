import type { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { ApiResponse } from "@/utils/ApiResponse";
import { ApiError } from "@/utils/ApiError";
import { getCookieOptions, getClearCookieOptions } from "@/utils/cookie.util";
import { ENV } from "@/config/env.config";
import * as authService from "./auth.service";

/**
 * Handles user registration request.
 * Invokes service to validate payload, save record, and initiate email verification.
 * 
 * @route POST /api/v1/auth/register
 * @access Public
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body);

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        result,
        result.message || "User registered successfully"
      )
    );
});

/**
 * Handles user authentication (login) using email/password.
 * Sets secure cookies on the response containing tokens.
 * 
 * @route POST /api/v1/auth/login
 * @access Public
 */


/**
 * Handles user authentication (login) using email/password.
 * Sets secure cookies on the response containing tokens.
 * 
 * @route POST /api/v1/auth/login
 * @access Public
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { user, accessToken, refreshToken } = await authService.login(req.body);
  const options = getCookieOptions();

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

/**
 * Logs out the currently authenticated user.
 * Destroys token storage on database and clears the client response cookies.
 * 
 * @route POST /api/v1/auth/logout
 * @access Public / Protected
 */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?._id;
  if (userId) {
    await authService.logoutUser(userId).catch(() => undefined);
  }

  const clearOptions = getClearCookieOptions();

  return res
    .status(200)
    .clearCookie("accessToken", clearOptions)
    .clearCookie("refreshToken", clearOptions)
    .cookie("accessToken", "", clearOptions)
    .cookie("refreshToken", "", clearOptions)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

/**
 * Validates the refresh token cookie/body and signs a fresh token pair.
 * Sets new secure cookies on response.
 * 
 * @route POST /api/v1/auth/refresh-token
 * @access Public
 */
export const refreshAccessToken = asyncHandler(async (req: Request, res: Response) => {
  const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  try {
    const { user, accessToken, refreshToken } = await authService.refreshAccessToken(incomingRefreshToken);
    const options = getCookieOptions();

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { user, accessToken, refreshToken },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    // ponytail: clear stale cookies on failed refresh so client doesn't retry infinitely with dead tokens
    const clearOptions = getClearCookieOptions();
    res
      .clearCookie("accessToken", clearOptions)
      .clearCookie("refreshToken", clearOptions)
      .cookie("accessToken", "", clearOptions)
      .cookie("refreshToken", "", clearOptions);
    throw error;
  }
});

// ── Phase 4 — Google OAuth + password reset handlers ─────────────

/**
 * POST /api/v1/auth/google
 * Exchange a Google ID token for a QuickBihar session (JWT pair).
 * Brand-new customers are auto-created as ACTIVE users.
 */
export const googleAuth = asyncHandler(async (req: Request, res: Response) => {
  const { idToken, client } = req.body as { idToken: string; client: "web" | "mobile" };
  const { user, accessToken, refreshToken } = await authService.googleAuthOrCreate(idToken, client);

  // Set cookies on the web path. Mobile clients use the body tokens.
  if (client === "web") {
    const options = getCookieOptions();
    res.cookie("accessToken", accessToken, options);
    res.cookie("refreshToken", refreshToken, options);
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      { user, accessToken, refreshToken },
      "Signed in with Google"
    )
  );
});

/**
 * POST /api/v1/auth/set-password  (auth required)
 * Set a password on the currently-authenticated user. Used by Google-only users
 * who want a fallback sign-in method.
 */
export const setPassword = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?._id?.toString();
  if (!userId) throw new ApiError(401, "Unauthorized");
  await authService.setPassword(userId, req.body.password);
  return res.status(200).json(new ApiResponse(200, { ok: true }, "Password set successfully"));
});

/**
 * POST /api/v1/auth/link-google  (auth required)
 * Link a Google identity to an existing password-only account.
 */
export const linkGoogle = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?._id?.toString();
  if (!userId) throw new ApiError(401, "Unauthorized");
  await authService.linkGoogle(userId, req.body.idToken);
  return res.status(200).json(new ApiResponse(200, { ok: true }, "Google account linked"));
});

/**
 * POST /api/v1/auth/request-reset
 * Send a password-reset link to the given email. Always responds identically
 * to prevent account enumeration.
 */
export const requestReset = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.requestPasswordReset(req.body.email);
  return res.status(200).json(new ApiResponse(200, result, result.message));
});

/**
 * POST /api/v1/auth/reset-password
 * Consume a reset JWT and set a new password.
 */
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.consumePasswordReset(req.body.token, req.body.newPassword);
  return res.status(200).json(new ApiResponse(200, { ok: true }, "Password reset successfully. Please sign in."));
});

/**
 * GET /api/v1/auth/config (public)
 * Returns public auth client configuration (Google Client ID).
 * Acts as a resilient fallback if frontend static bundle wasn't baked with env at build time.
 */
export const getAuthConfig = asyncHandler(async (_req: Request, res: Response) => {
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        googleClientId: ENV.GOOGLE_CLIENT_ID || "",
      },
      "Auth configuration retrieved successfully"
    )
  );
});

