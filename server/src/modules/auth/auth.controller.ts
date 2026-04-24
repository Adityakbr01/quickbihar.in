import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import { AuthService } from "./auth.service";

export class AuthController {
  static register = asyncHandler(async (req: Request, res: Response) => {
    const result = await AuthService.register(req.body);

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
  static login = asyncHandler(async (req: Request, res: Response) => {
    const { user, accessToken, refreshToken } = await AuthService.login(req.body);

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
  static requestOTP = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    const result = await AuthService.requestOTP(email);
    return res.status(200).json(new ApiResponse(200, result, "OTP sent successfully"));
  });
  static verifyOTP = asyncHandler(async (req: Request, res: Response) => {
    const { email, otp } = req.body;
    const { user, accessToken, refreshToken } = await AuthService.verifyOTPAndAuthenticate(email, otp);

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
  static logout = asyncHandler(async (req: Request, res: Response) => {
    await AuthService.logoutUser((req as any).user._id);

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
  static refreshAccessToken = asyncHandler(async (req: Request, res: Response) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    const { user, accessToken, refreshToken } = await AuthService.refreshAccessToken(incomingRefreshToken);

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
}
