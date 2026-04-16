import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import { AuthService } from "./auth.service";

export class AuthController {
  static authenticate = asyncHandler(async (req: Request, res: Response) => {
    const { user, accessToken, refreshToken, isNewUser } = await AuthService.authenticate(req.body);

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    };

    const message = isNewUser ? "User registered and logged in successfully" : "User logged in successfully";

    return res
      .status(isNewUser ? 201 : 200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          isNewUser ? 201 : 200,
          {
            user,
            accessToken,
            refreshToken,
          },
          message
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
