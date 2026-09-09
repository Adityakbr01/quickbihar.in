import jwt from "jsonwebtoken";
import { ENV } from "@/config/env.config";
import { DeviceToken } from "@/modules/common/notification/deviceToken.model";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";
import { ApiError } from "@/utils/ApiError";
import { User } from "./user.model";
import { UserDAO } from "./user.dao";
import { serializeAuthUser } from "@/modules/common/auth/auth.serializer";
import { uploadToImageKit, deleteFromImageKit } from "@/utils/imagekit.util";

export class UserController {
    /**
     * Update basic profile info, email, and password using authenticated JWT session
     */
    static updateProfile = asyncHandler(async (req, res) => {
        const userId = (req as any).user._id;
        const { fullName, phone, email, password } = req.body;
        console.log(`[SERVER] Profile & Security update request for user ${userId}`);

        const user = await User.findById(userId);
        if (!user) throw new ApiError(404, "User not found");

        if (fullName) user.fullName = fullName.trim();
        if (phone) {
            const cleanPhone = phone.trim().replace(/[\s\-()]/g, "");
            const phoneOccupied = await User.findOne({ phone: cleanPhone, _id: { $ne: userId } });
            if (phoneOccupied) {
                throw new ApiError(400, "This phone number is already linked to another account.");
            }
            user.phone = cleanPhone;
        }

        if (email) {
            const cleanEmail = email.trim().toLowerCase();
            const emailOccupied = await User.findOne({ email: cleanEmail, _id: { $ne: userId } });
            if (emailOccupied) {
                throw new ApiError(400, "This email address is already linked to another account.");
            }
            user.email = cleanEmail;
        }

        if (password) {
            if (password.length < 6) {
                throw new ApiError(400, "Password must be at least 6 characters long.");
            }
            user.password = password;
        }

        await user.save();
        const serialized = await serializeAuthUser(user);
        return res.status(200).json(new ApiResponse(200, serialized, "Profile and security settings updated successfully"));
    });

    /**
     * Update/Upload Profile Avatar
     */
    static updateAvatar = asyncHandler(async (req, res) => {
        const userId = (req as any).user._id;
        const file = req.file;

        if (!file) {
            throw new ApiError(400, "Please upload an image file");
        }

        const user = await UserDAO.findById(userId);
        if (!user) throw new ApiError(404, "User not found");

        // 1. Upload new image to ImageKit
        const uploadResult = await uploadToImageKit(
            file.buffer,
            `avatar_${userId}_${Date.now()}`,
            "profiles"
        );

        // 2. Delete old avatar if exists
        if (user.avatar?.fileId) {
            await deleteFromImageKit(user.avatar.fileId);
        }

        // 3. Update User record
        const updatedUser = await UserDAO.updateById(userId, { avatar: uploadResult });

        return res.status(200).json(new ApiResponse(200, updatedUser, "Avatar updated successfully"));
    });

    /**
     * Update FCM Token for Push Notifications
     */
    static updateFcmToken = asyncHandler(async (req, res) => {
        const { fcmToken } = req.body;

        if (!fcmToken) {
            throw new ApiError(400, "FCM Token is required");
        }

        // Shape guard: FCM registration tokens are ~150-200 chars. Reject blobs
        // so unauthenticated callers cannot stuff the DeviceToken collection.
        if (typeof fcmToken !== "string" || fcmToken.length > 512) {
            throw new ApiError(400, "Invalid FCM Token");
        }

        // Try to decode optional JWT token to link FCM to user if authenticated
        let userId: string | undefined = undefined;
        try {
            const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
            if (token) {
                const decodedToken: any = jwt.verify(token, ENV.ACCESS_TOKEN_SECRET);
                const user = await UserDAO.findById(decodedToken?._id);
                if (user) {
                    userId = user._id.toString();
                    (req as any).user = user;
                }
            }
        } catch (error) {
            console.log("[SERVER] Guest or invalid token in updateFcmToken, registering as guest device:", error instanceof Error ? error.message : error);
        }

        if (userId) {
            console.log(`[SERVER] Syncing FCM Token for User ${userId}`);
            await UserDAO.updateById(userId, { fcmToken });
        } else {
            console.log(`[SERVER] Registering FCM Token for guest device`);
        }

        // Also track all FCM tokens in a unified DeviceToken collection
        await DeviceToken.findOneAndUpdate(
            { fcmToken },
            { userId: userId || null },
            { upsert: true, returnDocument: "after" }
        );

        return res.status(200).json(new ApiResponse(200, {}, "FCM Token updated successfully"));
    });

    /**
     * Get Current User Profile
     */
    static getProfile = asyncHandler(async (req, res) => {
        const userId = (req as any).user._id;
        const user = await UserDAO.findById(userId);
        return res.status(200).json(new ApiResponse(200, user, "Profile fetched successfully"));
    });

    // ⭐ Management (Admin Only) ⭐

    /**
     * Get All Users (Admin only)
     */
    static getAllUsers = asyncHandler(async (req, res) => {
        const users = await UserDAO.findAll();
        return res.status(200).json(new ApiResponse(200, users, "All users fetched successfully"));
    });

    /**
     * Delete User (Admin only)
     */
    static deleteUser = asyncHandler(async (req, res) => {
        const { id } = req.params as { id: string };
        await UserDAO.updateById(id, { $set: { isActive: false } }); // Soft delete
        return res.status(200).json(new ApiResponse(200, {}, "User deactivated successfully"));
    });
}
