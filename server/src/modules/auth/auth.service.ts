import { ApiError } from "../../utils/ApiError";
import { UserDAO } from "../user/user.dao";
import { authenticateSchema, registerSchema, type AuthenticateBody, type RegisterBody } from "./auth.validation";
import { ZodError } from "zod";
import jwt from "jsonwebtoken";
import { ENV } from "../../config/env.config";
import * as rbacService from "../rbac/rbac.service";
import { RoleEnum } from "../rbac/rbac.types";
import { redis } from "../../config/redis.config";
import { MailService } from "../../utils/mail.service";

export class AuthService {
  static async register(registerData: any) {
    try {
      const validatedData: RegisterBody = registerSchema.parse(registerData);
      const { email, password, fullName } = validatedData;

      // 1. Check if user already exists
      let user = await UserDAO.findByUsernameOrEmail(undefined, email);

      if (user?.isVerified) {
        throw new ApiError(409, "User already exists and is verified. Please login instead.");
      }

      // 2. Get Default Role
      const userRole = await rbacService.getRoleByName(RoleEnum.USER);
      if (!userRole) {
        throw new ApiError(500, "Default security role not found.");
      }

      // 3. Create or Update unverified user
      if (user) {
        // Update details for re-registration
        user.password = password;
        user.fullName = fullName;
        await user.save();
      } else {
        const generatedUsername = email.split("@")[0] + "_" + Math.floor(Math.random() * 1000);
        user = await UserDAO.createUser({
          email,
          password,
          username: generatedUsername.toLowerCase(),
          fullName,
          isVerified: false,
          roleId: userRole._id,
        });
      }

      if (!user) {
        throw new ApiError(500, "Failed to process registration.");
      }

      // 4. Send OTP and set cooldown
      await this.requestOTP(email);

      return {
        message: "Registration successful! Please verify your email with the OTP sent to your inbox.",
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: userRole,
        }
      };
    } catch (error) {
      if (error instanceof ZodError) {
        throw new ApiError(400, "Validation failed", error.issues as any);
      }
      throw error;
    }
  }
  static async login(loginData: any) {
    try {
      const validatedData: AuthenticateBody = authenticateSchema.parse(loginData);
      const { email, password } = validatedData;

      const user = await UserDAO.findByUsernameOrEmail(undefined, email);

      if (!user) {
        throw new ApiError(404, "User not found. Please register first.");
      }

      if (user.isBlocked) {
        throw new ApiError(403, "Your account has been blocked.");
      }

      // Check password first to ensure it's a valid login attempt
      const isPasswordValid = await user.isPasswordCorrect(password);
      if (!isPasswordValid) {
        throw new ApiError(401, "Invalid password credentials");
      }

      // If not verified, trigger OTP and block login
      if (!user.isVerified) {
        try {
          await this.requestOTP(email);
        } catch (otpError: any) {
          if (otpError.statusCode === 429) {
            throw new ApiError(401, "Email not verified. OTP already sent, please check your inbox.");
          }
          throw otpError;
        }
        throw new ApiError(401, "Email not verified. A new OTP has been sent to your email.");
      }

      const accessToken = user.generateAccessToken();
      const refreshToken = user.generateRefreshToken();

      user.refreshToken = refreshToken;
      await user.save({ validateBeforeSave: false });

      return {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.roleId,
        },
        accessToken,
        refreshToken,
      };
    } catch (error) {
      if (error instanceof ZodError) {
        throw new ApiError(400, "Validation failed", error.issues as any);
      }
      throw error;
    }
  }
  static async requestOTP(email: string) {
    const cooldownKey = `otp_cooldown:${email}`;
    const onCooldown = await redis.get(cooldownKey);

    if (onCooldown) {
      throw new ApiError(429, "Too many requests. Please wait 60 seconds before requesting another OTP.");
    }

    // ⭐ Check if user is already verified
    const user = await UserDAO.findByUsernameOrEmail(undefined, email);
    if (user?.isVerified) {
      throw new ApiError(400, "Your email is already verified. Please login with your password.");
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const redisKey = `otp:${email}`;
    console.log(otp);

    // Store OTP in Redis for 10 minutes
    await redis.set(redisKey, otp, "EX", 600);
    // Set cooldown for 60 seconds
    await redis.set(cooldownKey, "true", "EX", 60);

    const emailSent = await MailService.sendOTP(email, otp);
    if (!emailSent) {
      throw new ApiError(500, "Failed to send OTP email");
    }

    return { message: "OTP sent successfully to your email" };
  }
  static async verifyOTPAndAuthenticate(email: string, otp: string) {
    const redisKey = `otp:${email}`;
    const storedOtp = await redis.get(redisKey);

    if (!storedOtp) {
      throw new ApiError(400, "OTP expired or not found");
    }

    if (storedOtp !== otp) {
      throw new ApiError(400, "Invalid OTP");
    }

    // OTP verified, remove it from redis
    await redis.del(redisKey);

    // 1. Check if user exists
    let user = await UserDAO.findByUsernameOrEmail(undefined, email);

    if (user?.isVerified) {
      throw new ApiError(400, "Your email is already verified. Please login with your password.");
    }
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const generatedUsername = email.split("@")[0] + "_" + Math.floor(Math.random() * 1000);
      const generatedFullName = email.split("@")[0];

      // Temporary password for OTP-only users (they can change it later)
      const tempPassword = Math.random().toString(36).slice(-10);

      user = await UserDAO.createUser({
        email,
        password: tempPassword,
        username: generatedUsername.toLowerCase(),
        fullName: generatedFullName,
        isVerified: true, // Mark as verified since they used OTP
      });

      if (!user) {
        throw new ApiError(500, "Failed to create user account");
      }

      // ⭐ RBAC: Assign default USER role
      try {
        const userRole = await rbacService.getRoleByName(RoleEnum.USER);
        if (userRole) {
          await rbacService.assignUserToRole(user._id.toString(), userRole._id.toString());
        }
      } catch (rbacError) {
        console.error("Failed to assign default role:", rbacError);
      }
    } else {
      if (user.isBlocked) {
        throw new ApiError(403, "Your account has been blocked. Please contact support.");
      }
      if (!user.isVerified) {
        user.isVerified = true;
        await user.save();
      }
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return {
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.roleId,
      },
      accessToken,
      refreshToken,
      isNewUser
    };
  }
  static async logoutUser(userId: string) {
    await UserDAO.updateById(userId, {
      $set: { refreshToken: undefined }
    });
  }
  static async refreshAccessToken(incomingRefreshToken: string) {
    try {
      if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request: No refresh token provided");
      }

      const decodedToken: any = jwt.verify(
        incomingRefreshToken,
        ENV?.REFRESH_TOKEN_SECRET!
      );

      const user = await UserDAO.findById(decodedToken?._id);

      if (!user) {
        throw new ApiError(401, "Invalid refresh token: User not found");
      }

      if (incomingRefreshToken !== user.refreshToken) {
        throw new ApiError(401, "Refresh token is expired or used");
      }

      const accessToken = user.generateAccessToken();
      const refreshToken = user.generateRefreshToken();

      user.refreshToken = refreshToken;
      await user.save({ validateBeforeSave: false });

      return {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.roleId,
        },
        accessToken,
        refreshToken,
      };
    } catch (error: any) {
      throw new ApiError(401, error?.message || "Invalid refresh token");
    }
  }
}
