import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
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
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { user, accessToken, refreshToken } = await authService.login(req.body);

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

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
  const { email } = req.body;
  const result = await authService.requestOTP(email);
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
  const { email, otp } = req.body;
  const { user, accessToken, refreshToken } = await authService.verifyOTPAndAuthenticate(email, otp);

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user, accessToken, refreshToken },
        "Email verified and logged in successfully"
      )
    );
});

/**
 * Logs out the currently authenticated user.
 * Destroys token storage on database and clears the client response cookies.
 * 
 * @route POST /api/v1/auth/logout
 * @access Protected
 */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  await authService.logoutUser((req as any).user._id);

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
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
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  const { user, accessToken, refreshToken } = await authService.refreshAccessToken(incomingRefreshToken);

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

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
