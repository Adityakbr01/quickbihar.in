import type { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { ApiResponse } from "@/utils/ApiResponse";
import { getCookieOptions, getClearCookieOptions } from "@/utils/cookie.util";
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
 * Sends a one-time password (OTP) verification email.
 * 
 * @route POST /api/v1/auth/request-otp
 * @access Public
 */
export const requestOTP = asyncHandler(async (req: Request, res: Response) => {
  const target = req.body.email || req.body.phone || req.body.target;
  const isRegistration = req.body.isRegistration || req.body.flow === "signup";
  const result = await authService.requestOTP(target, isRegistration);
  return res.status(200).json(new ApiResponse(200, result, "OTP sent successfully"));
});

/**
 * Verifies the OTP code submitted by a user and authenticates them.
 * Sets secure cookies on the response containing tokens.
 * 
 * @route POST /api/v1/auth/verify-otp
 * @access Public
 */
export const verifyOTP = asyncHandler(async (req: Request, res: Response) => {
  const target = req.body.phone || req.body.email || req.body.target || req.body.identifier;
  const { otp } = req.body;
  const { user, accessToken, refreshToken } = await authService.verifyOTPAndAuthenticate(target, otp);
  const options = getCookieOptions();

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user, accessToken, refreshToken },
        "User verified and logged in successfully"
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
});
