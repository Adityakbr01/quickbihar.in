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
 * Phone contract is role-conditional (enforced by `registerSchema.refine`):
 *   • role: "USER"     → phone optional (default — customer sign-up)
 *   • role: "SELLER"   → phone required (admin verification pre-approval)
 *   • role: "RIDER"    → phone required (admin verification pre-approval)
 *
 * The `role` field on the payload is a hint used only for phone validation;
 * actual role assignment always starts as `USER`. Partners (SELLER / RIDER)
 * are upgraded via `ensureAuthRole` once their onboarding application is
 * admin-approved. On web, partners authenticate via Google and provide their
 * required phone number directly in the onboarding registration form.
 *
 * @param registerData - Payload containing registration details (email, password, fullName, role?, phone?).
 * @returns Object containing a success message and the serialized, newly-registered user.
 * @throws {ApiError} 409 if user exists and is already verified.
 * @throws {ApiError} 400 if payload validation fails (incl. missing phone for SELLER/RIDER).
 * @throws {ApiError} 500 if database registration fails.
 */
export async function register(registerData: any) {
  try {
    const validatedData: RegisterBody = registerSchema.parse(registerData);
    const { email, password, fullName, phone } = validatedData;
    // `role` is read off the parsed payload via `RegisterBody.role` but
    // intentionally not destructured here — it's only used by Zod to gate
    // the phone-required rule. Actual role assignment stays USER until
    // admin approval flips the partner profile.

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

    // Check if phone is already registered to another account
    if (phone) {
      const cleanPhone = phone.trim().replace(/[\s\-()]/g, "");
      const phoneOccupied = await User.findOne({ phone: cleanPhone });
      if (phoneOccupied && (!user || phoneOccupied._id.toString() !== user._id.toString())) {
        throw new ApiError(400, "This phone number is already registered to another account.");
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
      // Only overwrite phone if the user doesn't already have one set —
      // protects users who originally supplied a phone via another channel
      // (e.g. legacy OTP) and are now re-registering with a different email.
      if (phone && !user.phone) user.phone = phone;
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
        ...(phone ? { phone } : {}),
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

    // Blocked check stays (above). The isVerified gate is removed as part of the
    // OTP cut-over — Google users are inherently verified (email_verified=true),
    // and password users authenticate by proving knowledge of the password.
// The legacy OTP fallback that used to fire here has been removed.

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

// ─────────────────────────────────────────────────────────────────
// Google OAuth + Password Reset — Phase 4 of the auth redesign
// ─────────────────────────────────────────────────────────────────

import { verifyGoogleIdToken } from "./googleOAuth.service";
import type { IUser, IUserIdentity } from "@/modules/common/user/user.model";

/**
 * Generate a token pair (access + refresh) and persist the refresh token on the
 * user record. Returns the serialized user alongside the raw tokens.
 */
async function issueTokensForUser(user: IUser) {
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  return {
    user: await serializeAuthUser(user),
    accessToken,
    refreshToken,
  };
}

/**
 * Verify a Google ID token and either find or create the corresponding user.
 * Email is the natural linking key; a Google arrival with an email that already
 * exists on a user without a Google identity simply appends the identity.
 *
 * @throws ApiError 409 if the email exists but is linked to a different Google account.
 */
export async function googleAuthOrCreate(idToken: string, client: "web" | "mobile") {
  const profile = await verifyGoogleIdToken(idToken, client);

  let user = await UserDAO.findByEmail(profile.email);

  if (!user) {
    // Brand-new customer — create ACTIVE immediately. No OTP, no admin approval.
    const userRole = await rbacService.getRoleByName(RoleEnum.USER);
    if (!userRole) throw new ApiError(500, "Default user role not found");

    const baseUsername = (profile.email.split("@")[0] ?? "user")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    const username = `${baseUsername}_${Math.floor(Math.random() * 10000)}`;

    const newIdentity: IUserIdentity = {
      provider: "google",
      providerId: profile.sub,
      email: profile.email,
      linkedAt: new Date(),
    };

    user = await UserDAO.createUser({
      email: profile.email,
      username,
      fullName: profile.name || profile.email.split("@")[0],
      avatar: profile.picture
        ? { url: profile.picture, fileId: `google-${profile.sub}` }
        : undefined,
      isVerified: true,
      legacyOtpOnly: false,
      roleId: userRole._id,
      identities: [newIdentity],
    });

    if (!user) throw new ApiError(500, "Failed to create user account");
  } else {
    // Existing user — link Google identity if not already present.
    const identities = (user.identities ?? []) as IUserIdentity[];
    const sameGoogleLink = identities.find(
      (i) => i.provider === "google" && i.providerId === profile.sub
    );
    const otherGoogleLink = identities.find(
      (i) => i.provider === "google" && i.providerId !== profile.sub
    );

    if (otherGoogleLink) {
      // Account already linked to a different Google account — refuse to relink.
      throw new ApiError(
        409,
        "This email is already linked to a different Google account."
      );
    }

    if (!sameGoogleLink) {
      identities.push({
        provider: "google",
        providerId: profile.sub,
        email: profile.email,
        linkedAt: new Date(),
      });
      user.identities = identities;
      // A user originally created by mobile-OTP may have legacyOtpOnly=true;
      // once they verify via Google, they're no longer legacy.
      if (user.legacyOtpOnly) user.legacyOtpOnly = false;
      // Promote avatar if Google has one and the user doesn't.
      if (profile.picture && !user.avatar?.url) {
        user.avatar = { url: profile.picture, fileId: `google-${profile.sub}` };
      }
      await user.save();
    }
  }

  // Backfill a phone onto the user record if Google provided one and we don't
  // already have one. Some Google accounts include a `phone_number` or
  // `phoneNumber` claim; the verify service normalises these onto `profile`.
  const googlePhone = (profile as any)?.phoneNumber || (profile as any)?.phone_number;
  if (googlePhone && !user.phone) {
    user.phone = String(googlePhone).trim();
    await user.save({ validateBeforeSave: false });
  }

  return issueTokensForUser(user);
}

/**
 * Set a password on the currently-authenticated user. Used by Google-only users
 * who want a password as a backup sign-in method. Idempotent — overwrites.
 */
export async function setPassword(userId: string, password: string) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  // Pre-save hook will hash this with bcrypt 10.
  user.password = password;

  // Ensure a "password" identity row exists so future conflict checks work.
  const identities = (user.identities ?? []) as IUserIdentity[];
  const hasPasswordIdentity = identities.some((i) => i.provider === "password");
  if (!hasPasswordIdentity) {
    identities.push({
      provider: "password",
      providerId: `pwd-${user._id.toString()}-${Date.now()}`,
      email: user.email,
      linkedAt: new Date(),
    });
    user.identities = identities;
  }

  await user.save();
  return { ok: true };
}

/**
 * Link a Google identity to an existing password-only account. The Google
 * account's email must match the user's email.
 */
export async function linkGoogle(userId: string, idToken: string) {
  const profile = await verifyGoogleIdToken(idToken, "web");

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  if (user.email.toLowerCase() !== profile.email) {
    throw new ApiError(
      409,
      "Google account email does not match your account email."
    );
  }

  const identities = (user.identities ?? []) as IUserIdentity[];
  const existingGoogle = identities.find((i) => i.provider === "google");
  if (existingGoogle) {
    if (existingGoogle.providerId === profile.sub) {
      // Already linked — idempotent success.
      return { ok: true };
    }
    throw new ApiError(409, "Account already linked to a different Google account.");
  }

  identities.push({
    provider: "google",
    providerId: profile.sub,
    email: profile.email,
    linkedAt: new Date(),
  });
  user.identities = identities;
  await user.save();
  return { ok: true };
}

// ── Password reset (was absent in the original codebase) ────────

const RESET_JWT_TTL = "15m";
const RESET_REDIS_PREFIX = "pwd_reset:";

function getResetSecret(): string {
  return ENV.RESET_PASSWORD_JWT_SECRET || ENV.REFRESH_TOKEN_SECRET;
}

/**
 * Generate a 15-minute reset JWT and email a magic link. Always responds
 * identically (success) regardless of whether the email is registered —
 * prevents account enumeration.
 */
export async function requestPasswordReset(email: string) {
  const cleanEmail = (email || "").toLowerCase().trim();
  if (!cleanEmail) throw new ApiError(400, "Please provide an email address.");

  const user = await UserDAO.findByEmail(cleanEmail);

  if (user) {
    const token = jwt.sign({ _id: user._id.toString(), aud: "reset" }, getResetSecret(), {
      expiresIn: RESET_JWT_TTL,
    });
    const link = `${ENV.RESET_PASSWORD_JWT_SECRET ? "" : ""}${token}`; // full URL built by client
    // We send the token + a base URL hint; the email template renders the link.
    await MailService.sendResetPasswordLink(user.email, token);
  }

  // Always return the same message — do not reveal whether the email is registered.
  return {
    message:
      "If an account exists with that email, a password reset link has been sent.",
  };
}

/**
 * Consume a reset JWT and update the user's password. Marks the token as used
 * in Redis (15-min TTL) so a single token can't be replayed.
 */
export async function consumePasswordReset(token: string, newPassword: string) {
  if (!token || token.length < 10) {
    throw new ApiError(400, "Reset link is invalid.");
  }
  if (!newPassword || newPassword.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters.");
  }

  let decoded: any;
  try {
    decoded = jwt.verify(token, getResetSecret());
  } catch {
    throw new ApiError(400, "Reset link has expired or is invalid.");
  }

  if (decoded?.aud !== "reset") {
    throw new ApiError(400, "Reset link is invalid.");
  }

  const usedKey = `${RESET_REDIS_PREFIX}${decoded._id}:${token.slice(-12)}`;
  const alreadyUsed = await redis.get(usedKey);
  if (alreadyUsed) {
    throw new ApiError(400, "Reset link has already been used.");
  }

  const user = await User.findById(decoded._id);
  if (!user) throw new ApiError(400, "Reset link is invalid.");

  user.password = newPassword; // pre-save hook hashes
  await user.save();

  // Mark this token as used for the remaining TTL window.
  await redis.set(usedKey, "1", "EX", 15 * 60);

  return { ok: true };
}
