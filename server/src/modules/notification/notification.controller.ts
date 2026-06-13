import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";
import { 
  Notification, 
  NotificationStatus, 
  TargetType, 
  DeliveryChannel, 
  DeliveryType, 
  RedirectType, 
  NotificationType, 
  Priority 
} from "./notification.model";
import { NotificationRead } from "./notificationRead.model";
import { NotificationTrack } from "./notificationTrack.model";
import { notificationQueue } from "./notification.queue";
import { Role } from "../rbac/rbac.model";
import { User } from "../user/user.model";
import { uploadToImageKit } from "../../utils/imagekit.util";
import { socketService } from "../socket/socket.service";

export class NotificationController {
  /**
   * 📣 Admin: Create and queue a new notification campaign (handles file upload and URL)
   */
  static sendNotification = asyncHandler(async (req: Request, res: Response) => {
    const {
      title,
      description,
      body,
      imageUrl,
      channel,
      deliveryChannel,
      deliveryType,
      targetType,
      targetRole,
      targetUser,
      redirectType,
      redirectId,
      externalUrl,
      deepLink,
      scheduledAt,
      expiresAt,
      notificationType,
      priority,
      actionButtonText,
    } = req.body;

    if (!title || !description) {
      throw new ApiError(400, "Title and description are required");
    }

    if (deliveryChannel && !Object.values(DeliveryChannel).includes(deliveryChannel)) {
      throw new ApiError(400, "Invalid delivery channel");
    }

    if (deliveryType && !Object.values(DeliveryType).includes(deliveryType)) {
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

    const nType = notificationType || (finalImageUrl ? NotificationType.RICH : NotificationType.NORMAL);

    // Create Notification campaign
    const notification = await Notification.create({
      title,
      description,
      body: body || description,
      imageUrl: finalImageUrl,
      richContent: finalImageUrl ? { image: finalImageUrl } : undefined,
      channel: channel || "general",
      deliveryChannel: deliveryChannel || DeliveryChannel.BOTH,
      deliveryType: deliveryType || DeliveryType.ALERT,
      targetType,
      targetRole,
      targetUser,
      redirectType: redirectType || RedirectType.NONE,
      redirectId,
      externalUrl,
      deepLink,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      notificationType: nType,
      priority: priority || Priority.MEDIUM,
      actionButtonText,
      status: NotificationStatus.PENDING,
    });

    // Check if scheduled for the future
    const scheduleTime = scheduledAt ? new Date(scheduledAt).getTime() : 0;
    const nowTime = Date.now();

    if (scheduleTime > nowTime) {
      const delay = scheduleTime - nowTime;
      console.log(`[NotificationController] Scheduling campaign ${notification._id} to run in ${delay}ms`);
      
      const job = await notificationQueue.add(
        "dispatch-notification",
        { notificationId: notification._id.toString() },
        { delay, removeOnComplete: true, removeOnFail: false }
      );
      
      notification.jobId = job.id;
      await notification.save();
    } else {
      console.log(`[NotificationController] Queueing campaign ${notification._id} for immediate dispatch`);
      const job = await notificationQueue.add(
        "dispatch-notification",
        { notificationId: notification._id.toString() },
        { removeOnComplete: true, removeOnFail: false }
      );
      notification.jobId = job.id;
      await notification.save();
    }

    // Notify admins of new pending campaign
    socketService.emitToAdmins("notification_status_update", {
      notificationId: notification._id.toString(),
      status: NotificationStatus.PENDING,
    });

    res.status(201).json(new ApiResponse(201, notification, "Notification campaign created and queued successfully"));
  });

  /**
   * 📜 Admin: Get notification history with advanced filters, search, and pagination
   */
  static getNotificationHistory = asyncHandler(async (req: Request, res: Response) => {
    const { search, status, priority, notificationType, sortBy, sortOrder } = req.query;

    const query: any = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (status) {
      query.status = status;
    }

    if (priority) {
      query.priority = priority;
    }

    if (notificationType) {
      query.notificationType = notificationType;
    }

    const sortField = (sortBy as string) || "createdAt";
    const sortDir = sortOrder === "asc" ? 1 : -1;

    const history = await Notification.find(query)
      .populate("targetUser", "fullName email username avatar")
      .sort({ [sortField]: sortDir });

    res.status(200).json(new ApiResponse(200, history, "Notification history retrieved successfully"));
  });

  /**
   * 📜 Admin: Get single notification details
   */
  static getNotificationDetails = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const notification = await Notification.findById(id).populate("targetUser", "fullName email username avatar phone");
    if (!notification) {
      throw new ApiError(404, "Notification not found");
    }
    res.status(200).json(new ApiResponse(200, notification, "Notification details retrieved successfully"));
  });

  /**
   * 📣 Admin: Edit notification (handles rescheduling if pending)
   */
  static updateNotification = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const notification = await Notification.findById(id);
    if (!notification) {
      throw new ApiError(404, "Notification not found");
    }

    const {
      title,
      description,
      body,
      imageUrl,
      channel,
      deliveryChannel,
      deliveryType,
      targetType,
      targetRole,
      targetUser,
      redirectType,
      redirectId,
      externalUrl,
      deepLink,
      scheduledAt,
      expiresAt,
      notificationType,
      priority,
      status, // Admin can force status updates (e.g. for Live Activity)
      actionButtonText,
    } = req.body;

    // Handle Direct File Upload
    let finalImageUrl = imageUrl;
    if (req.file) {
      try {
        const uploadResult = await uploadToImageKit(req.file.buffer, req.file.originalname, "notifications");
        finalImageUrl = uploadResult.url;
      } catch (uploadError: any) {
        throw new ApiError(500, `Image upload failed: ${uploadError.message}`);
      }
    }

    // If campaign is still pending, we allow modifying fields & rescheduling
    if (notification.status === NotificationStatus.PENDING) {
      notification.title = title || notification.title;
      notification.description = description || notification.description;
      notification.body = body !== undefined ? body : notification.body;
      if (finalImageUrl !== undefined) {
        notification.imageUrl = finalImageUrl;
        notification.richContent = finalImageUrl ? { image: finalImageUrl } : undefined;
      }
      notification.channel = channel || notification.channel;
      notification.deliveryChannel = deliveryChannel || notification.deliveryChannel;
      notification.deliveryType = deliveryType || notification.deliveryType;
      notification.targetType = targetType || notification.targetType;
      notification.targetRole = targetRole !== undefined ? targetRole : notification.targetRole;
      notification.targetUser = targetUser !== undefined ? targetUser : notification.targetUser;
      notification.redirectType = redirectType || notification.redirectType;
      notification.redirectId = redirectId !== undefined ? redirectId : notification.redirectId;
      notification.externalUrl = externalUrl !== undefined ? externalUrl : notification.externalUrl;
      notification.deepLink = deepLink !== undefined ? deepLink : notification.deepLink;
      notification.expiresAt = expiresAt !== undefined ? (expiresAt ? new Date(expiresAt) : undefined) : notification.expiresAt;
      notification.notificationType = notificationType || notification.notificationType;
      notification.priority = priority || notification.priority;
      notification.actionButtonText = actionButtonText !== undefined ? actionButtonText : notification.actionButtonText;

      // Check for schedule change
      if (scheduledAt !== undefined) {
        const oldScheduledTime = notification.scheduledAt ? new Date(notification.scheduledAt).getTime() : 0;
        const newScheduledTime = scheduledAt ? new Date(scheduledAt).getTime() : 0;

        if (oldScheduledTime !== newScheduledTime) {
          notification.scheduledAt = scheduledAt ? new Date(scheduledAt) : undefined;

          // Remove old queued job
          if (notification.jobId) {
            try {
              const oldJob = await notificationQueue.getJob(notification.jobId);
              if (oldJob) await oldJob.remove();
            } catch (jobErr) {
              console.error("Error removing old BullMQ job on update:", jobErr);
            }
          }

          // Queue new job with updated delay
          if (newScheduledTime > Date.now()) {
            const delay = newScheduledTime - Date.now();
            const job = await notificationQueue.add(
              "dispatch-notification",
              { notificationId: notification._id.toString() },
              { delay, removeOnComplete: true, removeOnFail: false }
            );
            notification.jobId = job.id;
          } else {
            const job = await notificationQueue.add(
              "dispatch-notification",
              { notificationId: notification._id.toString() },
              { removeOnComplete: true, removeOnFail: false }
            );
            notification.jobId = job.id;
          }
        }
      }

      await notification.save();
    } else {
      // If notification has been processed (SENT/FAILED), we allow limited edits like deepLink, status (for Live Update)
      notification.title = title || notification.title;
      notification.description = description || notification.description;
      notification.body = body !== undefined ? body : notification.body;
      if (finalImageUrl !== undefined) {
        notification.imageUrl = finalImageUrl;
        notification.richContent = finalImageUrl ? { image: finalImageUrl } : undefined;
      }
      notification.deepLink = deepLink !== undefined ? deepLink : notification.deepLink;
      notification.status = status || notification.status;
      await notification.save();

      // Emit live updates instantly to users for live activities or changed content!
      if (notification.deliveryType === DeliveryType.LIVE_ACTIVITY || status) {
        const socketPayload = {
          notificationId: notification._id.toString(),
          title: notification.title,
          description: notification.description,
          body: notification.body || "",
          imageUrl: notification.imageUrl || "",
          status: notification.status,
          deepLink: notification.deepLink || "",
        };

        if (notification.targetType === TargetType.ALL) {
          socketService.emitToAll("notification_updated", socketPayload);
        } else if (notification.targetType === TargetType.ROLE && notification.targetRole) {
          socketService.emitToRoom(`role_${notification.targetRole.toLowerCase()}`, "notification_updated", socketPayload);
        } else if (notification.targetUser) {
          socketService.emitToUser(notification.targetUser.toString(), "notification_updated", socketPayload);
        }
      }
    }

    // Broadcast status change to admins
    socketService.emitToAdmins("notification_status_update", {
      notificationId: notification._id.toString(),
      status: notification.status,
      title: notification.title,
      description: notification.description,
    });

    res.status(200).json(new ApiResponse(200, notification, "Notification campaign updated successfully"));
  });

  /**
   * 📣 Admin: Delete notification campaign
   */
  static deleteNotification = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const notification = await Notification.findById(id);
    if (!notification) {
      throw new ApiError(404, "Notification not found");
    }

    // Remove pending job from BullMQ
    if (notification.jobId && notification.status === NotificationStatus.PENDING) {
      try {
        const job = await notificationQueue.getJob(notification.jobId);
        if (job) await job.remove();
      } catch (jobErr) {
        console.error("Error removing BullMQ job on delete:", jobErr);
      }
    }

    await Notification.findByIdAndDelete(id);
    // Cleanup track records
    await NotificationRead.deleteMany({ notificationId: id });
    await NotificationTrack.deleteMany({ notificationId: id });

    res.status(200).json(new ApiResponse(200, null, "Notification campaign deleted successfully"));
  });

  /**
   * 📣 Admin: Re-send notification campaign
   */
  static resendNotification = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const notification = await Notification.findById(id);
    if (!notification) {
      throw new ApiError(404, "Notification not found");
    }

    // Reset properties for re-delivery
    notification.status = NotificationStatus.PENDING;
    notification.sentCount = 0;
    notification.deliveryCount = 0;
    notification.openCount = 0;
    notification.failedCount = 0;
    notification.error = undefined;

    // Remove tracking records to count cleanly
    await NotificationTrack.deleteMany({ notificationId: id });
    await NotificationRead.deleteMany({ notificationId: id });

    // Queue in BullMQ immediately
    const job = await notificationQueue.add(
      "dispatch-notification",
      { notificationId: notification._id.toString() },
      { removeOnComplete: true, removeOnFail: false }
    );
    notification.jobId = job.id;
    await notification.save();

    // Broadcast status to admin
    socketService.emitToAdmins("notification_status_update", {
      notificationId: notification._id.toString(),
      status: NotificationStatus.PENDING,
      sentCount: 0,
      deliveryCount: 0,
      openCount: 0,
      failedCount: 0,
    });

    res.status(200).json(new ApiResponse(200, notification, "Notification campaign queued for re-sending"));
  });

  /**
   * 📈 Admin: Get notification analytics summary
   */
  static getNotificationAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const totalCampaigns = await Notification.countDocuments({});

    const statusAgg = await Notification.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const statusBreakdown = statusAgg.reduce((acc: any, curr: any) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    const deliveryAgg = await Notification.aggregate([
      {
        $group: {
          _id: null,
          totalSent: { $sum: "$sentCount" },
          totalDelivered: { $sum: "$deliveryCount" },
          totalOpened: { $sum: "$openCount" },
          totalFailed: { $sum: "$failedCount" },
        },
      },
    ]);

    const stats = deliveryAgg[0] || {
      totalSent: 0,
      totalDelivered: 0,
      totalOpened: 0,
      totalFailed: 0,
    };

    const deliveryRate = stats.totalSent > 0 ? (stats.totalDelivered / stats.totalSent) * 100 : 0;
    const openRate = stats.totalDelivered > 0 ? (stats.totalOpened / stats.totalDelivered) * 100 : 0;

    res.status(200).json(
      new ApiResponse(
        200,
        {
          totalCampaigns,
          sentCount: stats.totalSent,
          deliveryCount: stats.totalDelivered,
          openCount: stats.totalOpened,
          failedCount: stats.totalFailed,
          deliveryRate: Math.round(deliveryRate * 100) / 100,
          openRate: Math.round(openRate * 100) / 100,
          statusBreakdown,
        },
        "Notification analytics retrieved successfully"
      )
    );
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

    // Find all notifications matching this user that are visual
    const notifications = await Notification.find({
      $and: [
        {
          $or: [
            { targetType: TargetType.ALL },
            { targetType: TargetType.ROLE, targetRole: roleName },
            { targetType: TargetType.SPECIFIC, targetUser: user._id },
          ],
        },
        {
          $or: [
            { deliveryChannel: { $in: [DeliveryChannel.IN_APP, DeliveryChannel.BOTH] } },
            { deliveryType: { $in: ["IN_APP", "BOTH"] as any } }
          ],
        }
      ],
      // Allow sent, delivered, or opened statuses
      status: { $in: [NotificationStatus.SENT, NotificationStatus.DELIVERED, NotificationStatus.OPENED, "COMPLETED" as any] },
    }).sort({ createdAt: -1 });

    // Fetch read states for this user
    const readStates = await NotificationRead.find({ userId: user._id }).select("notificationId");
    const readIds = new Set(readStates.map((r) => r.notificationId.toString()));

    const results = notifications.map((notification) => ({
      _id: notification._id,
      title: notification.title,
      description: notification.description,
      body: notification.body || notification.description,
      imageUrl: notification.imageUrl || notification.richContent?.image,
      channel: notification.channel,
      deliveryChannel: notification.deliveryChannel,
      deliveryType: notification.deliveryType,
      redirectType: notification.redirectType,
      redirectId: notification.redirectId,
      externalUrl: notification.externalUrl,
      deepLink: notification.deepLink,
      priority: notification.priority,
      actionButtonText: notification.actionButtonText,
      createdAt: notification.createdAt,
      isRead: readIds.has(notification._id.toString()),
    }));

    res.status(200).json(new ApiResponse(200, results, "In-app notifications retrieved successfully"));
  });

  /**
   * 📱 Client: Mark a notification as read (also tracks open metrics)
   */
  static markAsRead = asyncHandler(async (req: Request, res: Response) => {
    const notificationId = req.params.id as string;
    const user = (req as any).user;

    if (!user) {
      throw new ApiError(401, "Authentication required");
    }

    // Verify notification exists
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      throw new ApiError(404, "Notification not found");
    }

    // Insert read state
    await NotificationRead.findOneAndUpdate(
      { userId: user._id, notificationId },
      { readAt: new Date() },
      { upsert: true, returnDocument: 'after' }
    );

    // Track delivery and open counts
    let track = await NotificationTrack.findOne({ notificationId, userId: user._id });
    if (!track) {
      await NotificationTrack.create({
        notificationId,
        userId: user._id,
        status: "OPENED",
        deliveredAt: new Date(),
        openedAt: new Date(),
      });

      // Update counters in database
      const updated = await Notification.findByIdAndUpdate(
        notificationId,
        { $inc: { deliveryCount: 1, openCount: 1 } },
        { new: true }
      );

      if (updated) {
        socketService.emitToAdmins("notification_status_update", {
          notificationId,
          deliveryCount: updated.deliveryCount,
          openCount: updated.openCount,
        });
      }
    } else if (track.status !== "OPENED") {
      track.status = "OPENED";
      track.openedAt = new Date();
      await track.save();

      const updated = await Notification.findByIdAndUpdate(
        notificationId,
        { $inc: { openCount: 1 } },
        { new: true }
      );

      if (updated) {
        socketService.emitToAdmins("notification_status_update", {
          notificationId,
          deliveryCount: updated.deliveryCount,
          openCount: updated.openCount,
        });
      }
    }

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
      $and: [
        {
          $or: [
            { targetType: TargetType.ALL },
            { targetType: TargetType.ROLE, targetRole: roleName },
            { targetType: TargetType.SPECIFIC, targetUser: user._id },
          ],
        },
        {
          $or: [
            { deliveryChannel: { $in: [DeliveryChannel.IN_APP, DeliveryChannel.BOTH] } },
            { deliveryType: { $in: ["IN_APP", "BOTH"] as any } }
          ],
        }
      ],
      status: { $in: [NotificationStatus.SENT, NotificationStatus.DELIVERED, NotificationStatus.OPENED, "COMPLETED" as any] },
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
      // Create NotificationRead documents
      const docs = unreadNotificationIds.map((id) => ({
        userId: user._id,
        notificationId: id,
        readAt: new Date(),
      }));
      await NotificationRead.insertMany(docs, { ordered: false }).catch(() => null);

      // Create NotificationTrack documents & increment counters
      for (const nId of unreadNotificationIds) {
        let track = await NotificationTrack.findOne({ notificationId: nId, userId: user._id });
        if (!track) {
          await NotificationTrack.create({
            notificationId: nId,
            userId: user._id,
            status: "OPENED",
            deliveredAt: new Date(),
            openedAt: new Date(),
          });
          const updated = await Notification.findByIdAndUpdate(
            nId,
            { $inc: { deliveryCount: 1, openCount: 1 } },
            { new: true }
          );
          if (updated) {
            socketService.emitToAdmins("notification_status_update", {
              notificationId: nId.toString(),
              deliveryCount: updated.deliveryCount,
              openCount: updated.openCount,
            });
          }
        } else if (track.status !== "OPENED") {
          track.status = "OPENED";
          track.openedAt = new Date();
          await track.save();
          const updated = await Notification.findByIdAndUpdate(
            nId,
            { $inc: { openCount: 1 } },
            { new: true }
          );
          if (updated) {
            socketService.emitToAdmins("notification_status_update", {
              notificationId: nId.toString(),
              deliveryCount: updated.deliveryCount,
              openCount: updated.openCount,
            });
          }
        }
      }
    }

    res.status(200).json(new ApiResponse(200, null, "All notifications marked as read"));
  });

  /**
   * 📱 Client: Report notification delivery (push receipt)
   */
  static reportDelivery = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const user = (req as any).user;
    if (!user) {
      throw new ApiError(401, "Authentication required");
    }

    const notification = await Notification.findById(id);
    if (!notification) {
      throw new ApiError(404, "Notification not found");
    }

    let track = await NotificationTrack.findOne({ notificationId: id, userId: user._id });
    if (!track) {
      track = await NotificationTrack.create({
        notificationId: id,
        userId: user._id,
        status: "DELIVERED",
        deliveredAt: new Date(),
      });

      const updated = await Notification.findByIdAndUpdate(
        id,
        { $inc: { deliveryCount: 1 } },
        { new: true }
      );

      if (updated) {
        socketService.emitToAdmins("notification_status_update", {
          notificationId: id,
          deliveryCount: updated.deliveryCount,
          openCount: updated.openCount,
        });
      }
    }

    res.status(200).json(new ApiResponse(200, track, "Delivery status logged successfully"));
  });

  /**
   * 📱 Client: Report notification open / click
   */
  static reportOpen = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const user = (req as any).user;
    if (!user) {
      throw new ApiError(401, "Authentication required");
    }

    const notification = await Notification.findById(id);
    if (!notification) {
      throw new ApiError(404, "Notification not found");
    }

    let track = await NotificationTrack.findOne({ notificationId: id, userId: user._id });
    if (!track) {
      track = await NotificationTrack.create({
        notificationId: id,
        userId: user._id,
        status: "OPENED",
        deliveredAt: new Date(),
        openedAt: new Date(),
      });

      const updated = await Notification.findByIdAndUpdate(
        id,
        { $inc: { deliveryCount: 1, openCount: 1 } },
        { new: true }
      );

      if (updated) {
        socketService.emitToAdmins("notification_status_update", {
          notificationId: id,
          deliveryCount: updated.deliveryCount,
          openCount: updated.openCount,
        });
      }
    } else if (track.status !== "OPENED") {
      track.status = "OPENED";
      track.openedAt = new Date();
      await track.save();

      const updated = await Notification.findByIdAndUpdate(
        id,
        { $inc: { openCount: 1 } },
        { new: true }
      );

      if (updated) {
        socketService.emitToAdmins("notification_status_update", {
          notificationId: id,
          deliveryCount: updated.deliveryCount,
          openCount: updated.openCount,
        });
      }
    }

    // Synchronize with standard read-state
    await NotificationRead.findOneAndUpdate(
      { userId: user._id, notificationId: id },
      { readAt: new Date() },
      { upsert: true, returnDocument: 'after' }
    );

    res.status(200).json(new ApiResponse(200, track, "Open status logged successfully"));
  });
}
