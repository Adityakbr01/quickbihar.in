import { Worker, Job } from "bullmq";
import Redis from "ioredis";
import admin from "firebase-admin";
import axios from "axios";
import { ENV } from "../../config/env.config";
import { Notification, NotificationStatus, DeliveryChannel, DeliveryType } from "./notification.model";
import { User } from "../user/user.model";
import { Role } from "../rbac/rbac.model";
import { socketService } from "../socket/socket.service";
import { SocketEvents } from "../../constants/socketEvents";
import { notificationService } from "./notification.service";

// Dedicated connection for the Worker client
const workerConnection = new Redis(ENV.REDIS_URL, {
  maxRetriesPerRequest: null,
});

workerConnection.on("error", (err) => {
  console.error("❌ BullMQ Worker Redis Connection Error:", err);
});

export class NotificationWorker {
  private worker: Worker;

  constructor() {
    this.worker = new Worker(
      "notification-queue",
      async (job: Job) => {
        const { notificationId } = job.data;
        console.log(`[NotificationWorker] Processing job ${job.id} for notification ${notificationId}`);

        const notification = await Notification.findById(notificationId);
        if (!notification) {
          console.error(`[NotificationWorker] Notification ${notificationId} not found`);
          return;
        }

        // Check if the notification campaign has expired
        if (notification.expiresAt && new Date() > new Date(notification.expiresAt)) {
          console.warn(`[NotificationWorker] Campaign ${notificationId} expired at ${notification.expiresAt}`);
          notification.status = NotificationStatus.FAILED;
          notification.error = "Notification campaign expired before delivery";
          await notification.save();

          // Emit status update to admin
          socketService.emitToAdmins("notification_status_update", {
            notificationId: notification._id.toString(),
            status: NotificationStatus.FAILED,
            error: notification.error,
          });
          return;
        }

        // Update status to PROCESSING
        notification.status = NotificationStatus.PROCESSING;
        await notification.save();

        // Emit status update to admin
        socketService.emitToAdmins("notification_status_update", {
          notificationId: notification._id.toString(),
          status: NotificationStatus.PROCESSING,
        });

        try {
          // 1. Retrieve Target Users
          let usersQuery: any = { isBlocked: { $ne: true } };

          if (notification.targetType === "SPECIFIC") {
            usersQuery._id = notification.targetUser;
          } else if (notification.targetType === "ROLE") {
            const role = await Role.findOne({ name: notification.targetRole });
            if (!role) {
              throw new Error(`Role ${notification.targetRole} not found in database`);
            }
            usersQuery.roleId = role._id;
          }

          const targetUsers = await User.find(usersQuery).select("_id fcmToken").lean();
          console.log(`[NotificationWorker] Found ${targetUsers.length} target users`);

          // 2. Filter & Separate Push Tokens if required
          if (notification.deliveryChannel === DeliveryChannel.FCM || notification.deliveryChannel === DeliveryChannel.BOTH) {
            const tokens = targetUsers
              .map((u: any) => u.fcmToken)
              .filter((t): t is string => !!t && typeof t === "string" && t.trim() !== "");

            const expoTokens: string[] = [];
            const fcmTokens: string[] = [];

            for (const token of tokens) {
              if (token.startsWith("ExponentPushToken[") || token.startsWith("ExpoPushToken[")) {
                expoTokens.push(token);
              } else {
                fcmTokens.push(token);
              }
            }

            console.log(`[🔥 FIREBASE_FCM] Notification Worker processing job. Target users: ${targetUsers.length}`);
            console.log(`[🔥 FIREBASE_FCM] Active Tokens: ${tokens.length} total (Expo: ${expoTokens.length}, Native FCM: ${fcmTokens.length})`);

            let successCount = 0;
            let failureCount = 0;

            // Send via Google FCM
            if (fcmTokens.length > 0) {
              console.log(`[🔥 FIREBASE_FCM] Dispatching native FCM multicast to tokens:`, fcmTokens);
              const fcmChunks = chunkArray(fcmTokens, 500);
              for (const chunk of fcmChunks) {
                try {
                  let generatedDeepLink = notification.deepLink || "";
                  if (!generatedDeepLink) {
                    if (notification.redirectType === "product" && notification.redirectId) {
                      generatedDeepLink = `quickbihar://product/${notification.redirectId}`;
                    } else if (notification.redirectType === "category" && notification.redirectId) {
                      generatedDeepLink = `quickbihar://category/${notification.redirectId}`;
                    } else if (notification.redirectType === "external" && notification.externalUrl) {
                      generatedDeepLink = notification.externalUrl;
                    }
                  }

                  let attachmentUrl = notification.imageUrl || notification.richContent?.image;
                  if (attachmentUrl && !attachmentUrl.startsWith("https://")) {
                    console.warn(`[NotificationWorker] Invalid image URL (must be HTTPS): ${attachmentUrl}`);
                    attachmentUrl = undefined;
                  }

                  const message: any = {
                    tokens: chunk,
                    data: {
                      channel: notification.channel || "general",
                      notificationId: notification._id.toString(),
                      title: notification.title,
                      body: notification.description || notification.body || "",
                      imageUrl: attachmentUrl || "",
                      redirectType: notification.redirectType || "none",
                      redirectId: notification.redirectId || "",
                      externalUrl: notification.externalUrl || "",
                      deepLink: generatedDeepLink,
                      priority: notification.priority || "MEDIUM",
                      deliveryType: notification.deliveryType || "ALERT",
                    },
                  };

                  let categoryId = getCategoryForButtonText(notification.actionButtonText);
                  if (!categoryId) {
                    if (notification.redirectType === "product") {
                      categoryId = "PROMOTION_BUY_NOW";
                    } else if (notification.redirectType === "category") {
                      categoryId = "PROMOTION_SHOP_NOW";
                    } else if (notification.redirectType === "external") {
                      categoryId = "PROMOTION_VIEW_DETAILS";
                    }
                  }

                  if (categoryId) {
                    message.data.categoryId = categoryId;
                    if (notification.actionButtonText) {
                      message.data.actionButtonText = notification.actionButtonText;
                    }
                  }

                  // If ALERT or LIVE_ACTIVITY, include notification block for visible alert
                  if (notification.deliveryType !== DeliveryType.SILENT) {
                    message.notification = {
                      title: notification.title,
                      body: notification.description || notification.body || "",
                    };
                    if (attachmentUrl) {
                      message.notification.image = attachmentUrl;
                    }

                    const isHigh = notification.priority === "HIGH";
                    const channelId = (notification.channel === "promotions" || (message.data.categoryId && message.data.categoryId.startsWith("PROMOTION"))) ? "promotions" : "default";

                    message.android = {
                      priority: isHigh ? "high" : "normal",
                      notification: {
                        sound: "default",
                        channelId,
                        ...(attachmentUrl ? { image: attachmentUrl } : {}),
                      },
                    };

                    message.apns = {
                      payload: {
                        aps: {
                          sound: "default",
                          ...(attachmentUrl ? { mutableContent: true } : {}),
                        },
                      },
                      headers: {
                        "apns-priority": isHigh ? "10" : "5",
                      },
                      ...(attachmentUrl ? { fcmOptions: { image: attachmentUrl } } : {}),
                    };
                  } else {
                    // Silent Notification (Background Data Refresh)
                    message.apns = {
                      payload: {
                        aps: {
                          contentAvailable: true,
                        },
                      },
                      headers: {
                        "apns-push-type": "background",
                        "apns-priority": "5",
                      },
                    };
                    message.android = {
                      priority: "normal",
                    };
                  }

                  console.log(`[🔥 FIREBASE_FCM] Sending native FCM chunk of ${chunk.length} tokens...`);
                  const response = await admin.messaging().sendEachForMulticast(message);
                  successCount += response.successCount;
                  failureCount += response.failureCount;
                  console.log(`[🔥 FIREBASE_FCM] FCM Multicast Success: ${response.successCount}, Failures: ${response.failureCount}`);
                  if (response.failureCount > 0) {
                    console.log(`[🔥 FIREBASE_FCM] FCM Errors:`, response.responses.filter(r => !r.success).map(r => r.error));
                  }
                } catch (fcmError) {
                  console.error("[🔥 FIREBASE_FCM] Error sending FCM chunk:", fcmError);
                  failureCount += chunk.length;
                }
              }
            }

            // Send via Expo Push Service
            if (expoTokens.length > 0) {
              console.log(`[🔥 FIREBASE_FCM] Dispatching Expo push to tokens:`, expoTokens);
              const expoChunks = chunkArray(expoTokens, 100);
              for (const chunk of expoChunks) {
                try {
                  const expoPayload = chunk.map((token) => {
                    const payload: any = {
                      to: token,
                      data: {
                        channel: notification.channel || "general",
                        notificationId: notification._id.toString(),
                        title: notification.title,
                        body: notification.description || notification.body || "",
                        imageUrl: notification.imageUrl || notification.richContent?.image || "",
                        redirectType: notification.redirectType || "none",
                        redirectId: notification.redirectId || "",
                        externalUrl: notification.externalUrl || "",
                        deepLink: notification.deepLink || "",
                        priority: notification.priority || "MEDIUM",
                        deliveryType: notification.deliveryType || "ALERT",
                      },
                    };

                    if (notification.deliveryType !== DeliveryType.SILENT) {
                      payload.title = notification.title;
                      payload.body = notification.description || notification.body || "";
                      payload.sound = "default";
                      payload.channelId = "default";
                      payload.priority = notification.priority === "HIGH" ? "high" : "default";
                    } else {
                      payload.priority = "normal";
                    }

                    return payload;
                  });

                  console.log(`[🔥 FIREBASE_FCM] Sending Expo HTTP chunk of ${chunk.length} tokens...`);
                  const expoResponse = await axios.post("https://exp.host/--/api/v2/push/send", expoPayload, {
                    headers: {
                      Accept: "application/json",
                      "Accept-encoding": "gzip, deflate",
                      "Content-Type": "application/json",
                    },
                  });

                  const responseData = expoResponse.data?.data || [];
                  responseData.forEach((res: any) => {
                    if (res.status === "ok") {
                      successCount++;
                    } else {
                      failureCount++;
                    }
                  });
                  console.log(`[🔥 FIREBASE_FCM] Expo Push Chunk of ${chunk.length} processed.`);
                } catch (expoError: any) {
                  console.error("[🔥 FIREBASE_FCM] Error sending Expo push chunk:", expoError?.response?.data || expoError.message);
                  failureCount += chunk.length;
                }
              }
            }

            notification.sentCount = successCount;
            notification.failedCount = failureCount;
          } else {
            // IN_APP only campaign
            notification.sentCount = targetUsers.length;
            notification.failedCount = 0;
          }

          // Update status to SENT
          notification.status = NotificationStatus.SENT;
          await notification.save();
          console.log(`[NotificationWorker] Job ${job.id} completed successfully`);

          // Emit live socket notification if delivery channel is IN_APP or BOTH
          if (notification.deliveryChannel === DeliveryChannel.IN_APP || notification.deliveryChannel === DeliveryChannel.BOTH) {
            const socketPayload = {
              _id: notification._id.toString(),
              title: notification.title,
              description: notification.description,
              body: notification.body || "",
              imageUrl: notification.imageUrl || notification.richContent?.image || "",
              channel: notification.channel,
              deliveryChannel: notification.deliveryChannel,
              deliveryType: notification.deliveryType,
              redirectType: notification.redirectType,
              redirectId: notification.redirectId || "",
              externalUrl: notification.externalUrl || "",
              deepLink: notification.deepLink || "",
              priority: notification.priority || "MEDIUM",
              createdAt: notification.createdAt.toISOString(),
              isRead: false,
            };

            if (notification.targetType === "ALL") {
              socketService.emitToAll(SocketEvents.NEW_NOTIFICATION, socketPayload);
            } else if (notification.targetType === "ROLE" && notification.targetRole) {
              socketService.emitToRoom(`role_${notification.targetRole.toLowerCase()}`, SocketEvents.NEW_NOTIFICATION, socketPayload);
            } else {
              for (const u of targetUsers) {
                socketService.emitToUser(u._id.toString(), SocketEvents.NEW_NOTIFICATION, socketPayload);
              }
            }
            console.log(`[NotificationWorker] Dispatched live socket event for notification ${notification._id}`);
          }

          // Emit status update to admin
          socketService.emitToAdmins("notification_status_update", {
            notificationId: notification._id.toString(),
            status: NotificationStatus.SENT,
            sentCount: notification.sentCount,
            failedCount: notification.failedCount,
          });
        } catch (error: any) {
          console.error(`[NotificationWorker] Job ${job.id} failed:`, error);
          notification.status = NotificationStatus.FAILED;
          notification.error = error.message || String(error);
          await notification.save();

          // Emit status update to admin
          socketService.emitToAdmins("notification_status_update", {
            notificationId: notification._id.toString(),
            status: NotificationStatus.FAILED,
            error: notification.error,
          });
        }
      },
      {
        connection: workerConnection,
        concurrency: 2,
      }
    );

    this.worker.on("failed", (job, err) => {
      console.error(`❌ Job ${job?.id} failed globally:`, err);
    });
  }
}

// Utility to chunk arrays into specific sizes
function chunkArray<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

// Singleton worker instanced at startup
let notificationWorkerInstance: NotificationWorker | null = null;

export const startNotificationWorker = () => {
  if (!notificationWorkerInstance) {
    notificationWorkerInstance = new NotificationWorker();
    console.log("⚙️ BullMQ Notification Worker initialized and running");
  }
  return notificationWorkerInstance;
};

// Utility to map custom admin button texts to registered client category IDs
function getCategoryForButtonText(text?: string): string | undefined {
  if (!text || text.trim() === "") return undefined;
  
  const normalized = text.trim().toLowerCase();
  
  if (normalized.includes("buy")) return "PROMOTION_BUY_NOW";
  if (normalized.includes("shop")) return "PROMOTION_SHOP_NOW";
  if (normalized.includes("order")) return "PROMOTION_ORDER_NOW";
  if (normalized.includes("claim") || normalized.includes("coupon") || normalized.includes("offer")) return "PROMOTION_CLAIM_OFFER";
  if (normalized.includes("product")) return "PROMOTION_VIEW_PRODUCT";
  if (normalized.includes("link") || normalized.includes("website") || normalized.includes("site")) return "PROMOTION_OPEN_LINK";
  if (normalized.includes("details") || normalized.includes("info") || normalized.includes("more")) return "PROMOTION_VIEW_DETAILS";
  if (normalized.includes("check")) return "PROMOTION_CHECK_IT_OUT";
  if (normalized.includes("learn")) return "PROMOTION_LEARN_MORE";
  
  return "PROMOTION_LEARN_MORE";
}
