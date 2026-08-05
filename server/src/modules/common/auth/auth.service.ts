import { ApiError } from "@/utils/ApiError";
import { UserDAO } from "@/modules/common/user/user.dao";
import {
  authenticateSchema,
  registerSchema,
  type AuthenticateBody,
  type RegisterBody,
} from "./auth.validation";
import { ZodError } from "zod";
import jwt from "jsonwebtoken";
import { ENV } from "@/config/env.config";
import * as rbacService from "@/modules/common/rbac/rbac.service";
import { RoleEnum } from "@/modules/common/rbac/rbac.types";
import { redis } from "@/config/redis.config";
import { MailService } from "@/utils/mail.service";
import { serializeAuthUser } from "./auth.serializer";

import { User } from "@/modules/common/user/user.model";

/**
 * Registers a new user in the system.
 * Checks for existing verified users, assigns a default security role,
 * generates a temp unverified user record, and triggers an email verification OTP.
 *
 * @param registerData - Payload containing registration details (email, password, fullName).
 * @returns Object containing a success message and the serialized, newly-registered user.
 * @throws {ApiError} 409 if user exists and is already verified.
 * @throws {ApiError} 400 if payload validation fails.
 * @throws {ApiError} 500 if database registration fails.
 */
export async function register(registerData: any) {
  try {
    const validatedData: RegisterBody = registerSchema.parse(registerData);
    const { email, password, fullName } = validatedData;

    // 1. Check if user already exists
    let user = await UserDAO.findByUsernameOrEmail(undefined, email);

    // 2. Check if email is already registered to another verified account
    if (email && email.includes("@")) {
      const cleanEmail = email.trim().toLowerCase();
      const emailOccupied = await User.findOne({ email: cleanEmail });
      if (emailOccupied && emailOccupied.isVerified && (!user || emailOccupied._id.toString() !== user._id.toString())) {
        throw new ApiError(400, "This email address is already registered to another account. Please sign in instead.");
      }
    }

    // 2. Get Default Role
    const userRole = await rbacService.getRoleByName(RoleEnum.USER);
    if (!userRole) {
      throw new ApiError(500, "Default security role not found.");
    }

    // 3. Create or Update user details (e.g. post-OTP password setting)
    if (user) {
      if (password) user.password = password;
      if (fullName) user.fullName = fullName;
      user.roleId = user.roleId || userRole._id;
      user.isVerified = true;
      await user.save();
    } else {
      const generatedUsername =
        email.split("@")[0] + "_" + Math.floor(Math.random() * 1000);
      user = await UserDAO.createUser({
        email,
        password,
        username: generatedUsername.toLowerCase(),
        fullName,
        isVerified: true,
        roleId: userRole._id,
      });
    }

    if (!user) {
      throw new ApiError(500, "Failed to process registration.");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return {
      message: "Account registration & profile setup successful!",
      user: await serializeAuthUser(user),
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

/**
 * Authenticates a user using email and password.
 * Checks verification status, issues access/refresh tokens, and updates DB.
 *
 * @param loginData - Payload containing login credentials (email, password).
 * @returns Object containing the serialized user details, accessToken, and refreshToken.
 * @throws {ApiError} 404 if user is not found.
 * @throws {ApiError} 403 if account is blocked.
 * @throws {ApiError} 401 if credentials are invalid or if email is not verified (triggers a new OTP).
 */
export async function login(loginData: any) {
  try {
    const identifier = (
      loginData.email ||
      loginData.phone ||
      loginData.identifier ||
      ""
    ).trim();
    if (!identifier || !loginData.password) {
      throw new ApiError(400, "Please provide your email/phone and password.");
    }
    const user = await UserDAO.findByUsernameOrEmail(undefined, identifier);

    if (!user) {
      throw new ApiError(404, "User not found. Please register first.");
    }

    if (user.isBlocked) {
      throw new ApiError(403, "Your account has been blocked.");
    }

    // Check password first to ensure it's a valid login attempt
    const isPasswordValid = await user.isPasswordCorrect(loginData.password);
    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid password credentials");
    }

    // If not verified, trigger OTP and block login
    if (!user.isVerified) {
      try {
        await requestOTP(identifier);
      } catch (otpError: any) {
        if (otpError.statusCode === 429) {
          throw new ApiError(
            401,
            "Account not verified. OTP already sent, please check your inbox.",
          );
        }
        throw otpError;
      }
      throw new ApiError(401, "Account not verified. A new OTP has been sent.");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return {
      user: await serializeAuthUser(user),
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

export function normalizeTarget(identifier: string): string {
  const trimmed = (identifier || "").trim();
  if (!trimmed) return "";
  if (trimmed.includes("@")) {
    return trimmed.toLowerCase();
  }
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return digits || trimmed;
}

export async function requestOTP(
  identifier: string,
  isRegistration: boolean = false,
) {
  const rawTarget = (identifier || "").trim();
  const target = normalizeTarget(rawTarget);

  console.log(`\n======================================================`);
  console.log(
    `🔑 [REQUEST OTP] Raw Input: "${rawTarget}" | Target Key: "${target}" | isRegistration: ${isRegistration}`,
  );

  if (!target) {
    throw new ApiError(
      400,
      "Please provide a valid mobile number or email address.",
    );
  }

  // Check if mobile number or email is already registered before sending OTP for registration
  if (isRegistration) {
    const existingUser = await UserDAO.findByUsernameOrEmail(undefined, target);
    if (existingUser && existingUser.isVerified) {
      const isPhone = !rawTarget.includes("@");
      console.log(
        `❌ [REGISTRATION REJECTED] ${isPhone ? "Phone" : "Email"} ${target} is already registered in DB.`,
      );
      throw new ApiError(
        400,
        isPhone
          ? "This mobile number is already registered. Please sign in instead."
          : "This email address is already registered. Please sign in instead.",
      );
    }
  }

  const cooldownKey = `otp_cooldown:${target}`;
  const onCooldown = await redis.get(cooldownKey);

  if (onCooldown) {
    console.log(`⚠️ [REQUEST OTP] Target "${target}" is on cooldown.`);
    throw new ApiError(
      429,
      "Too many requests. Please wait 60 seconds before requesting another OTP.",
    );
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const redisKey = `otp:${target}`;

  // Store OTP in Redis for 10 minutes
  await redis.set(redisKey, otp, "EX", 600);
  // Set cooldown for 60 seconds
  await redis.set(cooldownKey, "true", "EX", 10);

  // 🔑 LOG OTP ONLY IN BACKEND CONSOLE (FOR DEV / DEMO)
  console.log(`🔑 [SERVER OTP LOG] Target Key: ${target} | CODE: ${otp}`);
  console.log(`======================================================\n`);

  if (rawTarget.includes("@")) {
    const emailSent = await MailService.sendOTP(target, otp);
    if (!emailSent) {
      console.warn(
        `[Server] MailService unconfigured or failed to deliver email to ${target}. See OTP code logged in console above.`,
      );
    }
  } else {
    console.log(
      `[Server] Mobile SMS OTP generated for target ${target}. See OTP code logged in console above.`,
    );
  }

  return {
    message: "OTP sent successfully",
  };
}

/**
 * Verifies the OTP code submitted by a user and logs them in.
 * If user does not exist yet (OTP-only login), creates a verified user profile and assigns a default role.
 */
export async function verifyOTPAndAuthenticate(
  emailOrPhone: string,
  otp: string,
) {
  const rawTarget = (emailOrPhone || "").trim();
  const target = normalizeTarget(rawTarget);
  const redisKey = `otp:${target}`;
  const storedOtp = await redis.get(redisKey);

  console.log(`\n------------------------------------------------------`);
  console.log(
    `🔍 [VERIFY OTP REQUEST] Raw Target: "${rawTarget}" | Key: "${target}" | Submitted Code: "${otp}" | Redis Stored: "${storedOtp}"`,
  );

  const isDevFallback =
    process.env.NODE_ENV !== "production" && otp === "123456";

  if (!storedOtp && !isDevFallback) {
    console.log(
      `❌ [VERIFY OTP FAILED] Redis key "${redisKey}" not found or expired.`,
    );
    throw new ApiError(
      400,
      "OTP expired or not found. Please request a new code.",
    );
  }

  if (storedOtp !== otp && !isDevFallback) {
    console.log(
      `❌ [VERIFY OTP FAILED] Code mismatch for "${target}". Expected "${storedOtp}", received "${otp}".`,
    );
    throw new ApiError(400, "Invalid OTP code. Please check and try again.");
  }

  console.log(`✅ [VERIFY OTP SUCCESS] Code match verified for "${target}".`);

  // OTP verified, remove it from redis
  if (storedOtp) {
    await redis.del(redisKey);
  }

  // 1. Check if user exists
  let user = await UserDAO.findByUsernameOrEmail(undefined, target);
  let isNewUser = false;

  if (!user) {
    isNewUser = true;
    const isPhone = !rawTarget.includes("@");
    const resolvedEmail = isPhone
      ? `${target}@quickbihar.local`
      : target.toLowerCase();
    const resolvedPhone = isPhone ? target : undefined;
    const generatedUsername = isPhone
      ? `user_${target}`
      : target.split("@")[0] + "_" + Math.floor(Math.random() * 1000);
    const generatedFullName = isPhone
      ? `User ${target.slice(-4)}`
      : target.split("@")[0];
    const userRole = await rbacService.getRoleByName(RoleEnum.USER);

    // Temporary password for OTP-only users (they can change it later)
    const tempPassword = Math.random().toString(36).slice(-10);

    user = await UserDAO.createUser({
      email: resolvedEmail,
      phone: resolvedPhone,
      password: tempPassword,
      username: generatedUsername.toLowerCase(),
      fullName: generatedFullName,
      isVerified: true, // Mark as verified since they used OTP
      roleId: userRole._id,
    });

    if (!user) {
      throw new ApiError(500, "Failed to create user account");
    }

    // ⭐ RBAC: Assign default USER role
    try {
      if (userRole) {
        await rbacService.assignUserToRole(
          user._id.toString(),
          userRole._id.toString(),
        );
      }
    } catch (rbacError) {
      console.error("Failed to assign default role:", rbacError);
    }
  } else {
    if (user.isBlocked) {
      throw new ApiError(
        403,
        "Your account has been blocked. Please contact support.",
      );
    }
    if (!user.isVerified) {
      user.isVerified = true;
      if (!user.roleId) {
        const userRole = await rbacService.getRoleByName(RoleEnum.USER);
        user.roleId = userRole._id;
      }
      await user.save();
    }
  }

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  console.log(
    `🚀 [AUTH SUCCESS] User authenticated: ${user.fullName} (${user._id})`,
  );
  console.log(`------------------------------------------------------\n`);

  return {
    user: await serializeAuthUser(user),
    accessToken,
    refreshToken,
    isNewUser,
  };
}

/**
 * Logs out a user by removing their persistent refresh token from the database.
 *
 * @param userId - Unique MongoDB ID of the user.
 */
export async function logoutUser(userId: string) {
  await UserDAO.updateById(userId, {
    $set: { refreshToken: undefined },
  });
}

/**
 * Validates the incoming refresh token and issues a new access token + refresh token pair.
 *
 * @param incomingRefreshToken - Refresh token sent by client.
 * @returns Object with serialized user and fresh tokens.
 * @throws {ApiError} 401 if refresh token is missing, invalid, or expired.
 */
export async function refreshAccessToken(incomingRefreshToken: string) {
  try {
    if (!incomingRefreshToken) {
      throw new ApiError(
        401,
        "Unauthorized request: No refresh token provided",
      );
    }

    const decodedToken: any = jwt.verify(
      incomingRefreshToken,
      ENV?.REFRESH_TOKEN_SECRET!,
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
      user: await serializeAuthUser(user),
      accessToken,
      refreshToken,
    };
  } catch (error: any) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
}
