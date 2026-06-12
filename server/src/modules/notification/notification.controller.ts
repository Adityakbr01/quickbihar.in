import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";
import { Notification, NotificationStatus, TargetType, DeliveryType, RedirectType } from "./notification.model";
import { NotificationRead } from "./notificationRead.model";
import { notificationQueue } from "./notification.queue";
import { Role } from "../rbac/rbac.model";
import { User } from "../user/user.model";
import { uploadToImageKit } from "../../utils/imagekit.util";

export class NotificationController {
  /**
   * 📣 Admin: Create and queue a new notification campaign (handles file upload and URL)
   */
  static sendNotification = asyncHandler(async (req: Request, res: Response) => {
    const {
      title,
      description,
      imageUrl,
      channel,
      deliveryType,
      targetType,
      targetRole,
      targetUser,
      redirectType,
      redirectId,
      externalUrl,
    } = req.body;

    if (!title || !description) {
      throw new ApiError(400, "Title and description are required");
    }

    if (!deliveryType || !Object.values(DeliveryType).includes(deliveryType)) {
      throw new ApiError(400, "Invalid delivery type");
    }

    if (!targetType || !Object.values(TargetType).includes(targetType)) {
      throw new ApiError(400, "Invalid target type");
    }

    // Validate role target
    if (targetType === TargetType.ROLE) {
      if (!targetRole) {
        throw new ApiError(400, "Target role is required when targetType is ROLE");
      }
      const roleExists = await Role.findOne({ name: targetRole });
      if (!roleExists) {
        throw new ApiError(400, `Role '${targetRole}' does not exist`);
      }
    }

    // Validate specific user target
    if (targetType === TargetType.SPECIFIC) {
      if (!targetUser) {
        throw new ApiError(400, "Target user ID is required when targetType is SPECIFIC");
      }
      const userExists = await User.findById(targetUser);
      if (!userExists) {
        throw new ApiError(400, "Target user not found");
      }
    }

    // Handle Direct File Upload or URL
    let finalImageUrl = imageUrl;
    if (req.file) {
      try {
        const uploadResult = await uploadToImageKit(req.file.buffer, req.file.originalname, "notifications");
        finalImageUrl = uploadResult.url;
      } catch (uploadError: any) {
        throw new ApiError(500, `Image upload failed: ${uploadError.message}`);
      }
    }

    // Create Notification campaign
    const notification = await Notification.create({
      title,
      description,
      imageUrl: finalImageUrl,
      channel: channel || "general",
      deliveryType,
      targetType,
      targetRole,
      targetUser,
      redirectType: redirectType || RedirectType.NONE,
      redirectId,
      externalUrl,
      status: NotificationStatus.PENDING,
    });

    // Queue BullMQ Job for background dispatching
    await notificationQueue.add(
      "dispatch-notification",
      { notificationId: notification._id.toString() },
      { removeOnComplete: true, removeOnFail: false }
    );

    res.status(201).json(new ApiResponse(201, notification, "Notification campaign queued successfully"));
  });

  /**
   * 📜 Admin: Get notification history
   */
  static getNotificationHistory = asyncHandler(async (req: Request, res: Response) => {
    const history = await Notification.find({})
      .populate("targetUser", "fullName email username avatar")
      .sort({ createdAt: -1 });

    res.status(200).json(new ApiResponse(200, history, "Notification history retrieved successfully"));
  });

  /**
   * 📱 Client: Get notifications targeting the authenticated user (In-app inbox)
   */
  static getUserNotifications = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    if (!user) {
      throw new ApiError(401, "Authentication required");
    }

    const roleName = user.roleId?.name;

    // Find all notifications matching this user
    const notifications = await Notification.find({
      $or: [
        { targetType: TargetType.ALL },
        { targetType: TargetType.ROLE, targetRole: roleName },
        { targetType: TargetType.SPECIFIC, targetUser: user._id },
      ],
      deliveryType: { $in: [DeliveryType.IN_APP, DeliveryType.BOTH] },
      status: NotificationStatus.COMPLETED,
    }).sort({ createdAt: -1 });

    // Fetch read states for this user
    const readStates = await NotificationRead.find({ userId: user._id }).select("notificationId");
    const readIds = new Set(readStates.map((r) => r.notificationId.toString()));

    const results = notifications.map((notification) => ({
      _id: notification._id,
      title: notification.title,
      description: notification.description,
      imageUrl: notification.imageUrl,
      channel: notification.channel,
      redirectType: notification.redirectType,
      redirectId: notification.redirectId,
      externalUrl: notification.externalUrl,
      createdAt: notification.createdAt,
      isRead: readIds.has(notification._id.toString()),
    }));

    res.status(200).json(new ApiResponse(200, results, "In-app notifications retrieved successfully"));
  });

  /**
   * 📱 Client: Mark a notification as read
   */
  static markAsRead = asyncHandler(async (req: Request, res: Response) => {
    const { id: notificationId } = req.params;
    const user = (req as any).user;

    if (!user) {
      throw new ApiError(401, "Authentication required");
    }

    // Verify notification exists
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      throw new ApiError(404, "Notification not found");
    }

    // Create or find read state
    await NotificationRead.findOneAndUpdate(
      { userId: user._id, notificationId },
      { readAt: new Date() },
      { upsert: true, returnDocument: 'after' }
    );

    res.status(200).json(new ApiResponse(200, null, "Notification marked as read"));
  });

  /**
   * 📱 Client: Mark all notifications as read
   */
  static markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    if (!user) {
      throw new ApiError(401, "Authentication required");
    }

    const roleName = user.roleId?.name;

    // Fetch all notifications targeting user
    const notifications = await Notification.find({
      $or: [
        { targetType: TargetType.ALL },
        { targetType: TargetType.ROLE, targetRole: roleName },
        { targetType: TargetType.SPECIFIC, targetUser: user._id },
      ],
      deliveryType: { $in: [DeliveryType.IN_APP, DeliveryType.BOTH] },
      status: NotificationStatus.COMPLETED,
    }).select("_id");

    const notificationIds = notifications.map((n) => n._id);

    // Find already read notification IDs
    const readStates = await NotificationRead.find({
      userId: user._id,
      notificationId: { $in: notificationIds },
    }).select("notificationId");

    const readIds = new Set(readStates.map((r) => r.notificationId.toString()));
    const unreadNotificationIds = notificationIds.filter((id) => !readIds.has(id.toString()));

    if (unreadNotificationIds.length > 0) {
      const docs = unreadNotificationIds.map((id) => ({
        userId: user._id,
        notificationId: id,
        readAt: new Date(),
      }));
      await NotificationRead.insertMany(docs, { ordered: false }).catch(() => null);
    }

    res.status(200).json(new ApiResponse(200, null, "All notifications marked as read"));
  });
}
