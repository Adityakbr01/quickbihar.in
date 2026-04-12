import { ApiError } from "../../utils/ApiError";
import { UserDAO } from "../user/user.dao";
import { authenticateSchema, type AuthenticateBody } from "./auth.validation";
import { ZodError } from "zod";

export class AuthService {
  static async authenticate(authData: any) {
    try {
      const validatedData: AuthenticateBody = authenticateSchema.parse(authData);
      const { email, password } = validatedData;

      // 1. Check if user exists
      let user = await UserDAO.findByUsernameOrEmail(undefined, email);
      let isNewUser = false;

      if (!user) {
        // 2. Register logic for new user
        isNewUser = true;
        const generatedUsername = email.split("@")[0] + "_" + Math.floor(Math.random() * 1000);
        const generatedFullName = email.split("@")[0];

        user = await UserDAO.createUser({
          email,
          password,
          username: generatedUsername.toLowerCase(),
          fullName: generatedFullName,
        });

        if (!user) {
          throw new ApiError(500, "Failed to create user account");
        }
      }

      // 3. Login logic (Common for both)
      const isPasswordValid = await user.isPasswordCorrect(password);

      if (!isPasswordValid) {
        throw new ApiError(401, "Invalid password credentials");
      }

      const accessToken = user.generateAccessToken();
      const refreshToken = user.generateRefreshToken();

      // Update refresh token in DB
      user.refreshToken = refreshToken;
      await user.save({ validateBeforeSave: false });

      return {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
        accessToken,
        refreshToken,
        isNewUser
      };
    } catch (error) {
      if (error instanceof ZodError) {
        throw new ApiError(400, "Validation Error", error.issues as any);
      }
      throw error;
    }
  }

  static async logoutUser(userId: string) {
    await UserDAO.updateById(userId, {
      $set: { refreshToken: undefined }
    });
  }

  // Legacy methods (can be kept or removed based on preference)
  static async registerUser(userData: any) {
    return this.authenticate(userData);
  }

  static async loginUser(loginData: any) {
    return this.authenticate(loginData);
  }
}
