import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { UserDAO } from "./user.dao";
import { uploadToImageKit, deleteFromImageKit } from "../../utils/imagekit.util";

export class UserController {
    /**
     * Update basic profile info (fullName, phone)
     */
    static updateProfile = asyncHandler(async (req, res) => {
        const userId = (req as any).user._id;
        const { fullName, phone } = req.body;

        const updateData: any = {};
        if (fullName) updateData.fullName = fullName;
        if (phone) updateData.phone = phone;

        if (Object.keys(updateData).length === 0) {
            throw new ApiError(400, "No data provided for update");
        }

        const updatedUser = await UserDAO.updateById(userId, updateData);
        return res.status(200).json(new ApiResponse(200, updatedUser, "Profile updated successfully"));
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
            "/profiles"
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
     * Get Current User Profile
     */
    static getProfile = asyncHandler(async (req, res) => {
        const userId = (req as any).user._id;
        const user = await UserDAO.findById(userId);
        return res.status(200).json(new ApiResponse(200, user, "Profile fetched successfully"));
    });
}
