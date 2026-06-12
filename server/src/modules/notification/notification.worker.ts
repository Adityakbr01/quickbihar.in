import { Worker, Job } from "bullmq";
import Redis from "ioredis";
import admin from "firebase-admin";
import axios from "axios";
import { ENV } from "../../config/env.config";
import { Notification, NotificationStatus } from "./notification.model";
import { User } from "../user/user.model";
import { Role } from "../rbac/rbac.model";
import { socketService } from "../socket/socket.service";
import { SocketEvents } from "../../constants/socketEvents";

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

        // Update status to PROCESSING
        notification.status = NotificationStatus.PROCESSING;
        await notification.save();

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
          if (notification.deliveryType === "FCM" || notification.deliveryType === "BOTH") {
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

            console.log(`[NotificationWorker] Dispatching to ${fcmTokens.length} FCM devices and ${expoTokens.length} Expo devices`);

            // Send via Google FCM
            if (fcmTokens.length > 0) {
              const fcmChunks = chunkArray(fcmTokens, 500);
              for (const chunk of fcmChunks) {
                try {
                  const message: any = {
                    tokens: chunk,
                    notification: {
                      title: notification.title,
                      body: notification.description,
                    },
                    data: {
                      channel: notification.channel || "general",
                      notificationId: notification._id.toString(),
                      title: notification.title,
                      body: notification.description,
                      imageUrl: notification.imageUrl || "",
                      redirectType: notification.redirectType || "none",
                      redirectId: notification.redirectId || "",
                      externalUrl: notification.externalUrl || "",
                    },
                  };

                  if (notification.imageUrl) {
                    message.notification.imageUrl = notification.imageUrl;
                    message.android = {
                      notification: {
                        imageUrl: notification.imageUrl,
                      },
                    };
                    message.apns = {
                      payload: {
                        aps: {
                          mutableContent: true,
                        },
                      },
                      fcmOptions: {
                        imageUrl: notification.imageUrl,
                      },
                    };
                  }

                  const response = await admin.messaging().sendEachForMulticast(message);
                  console.log(`[NotificationWorker] FCM Multicast Success: ${response.successCount}, Failures: ${response.failureCount}`);
                } catch (fcmError) {
                  console.error("[NotificationWorker] Error sending FCM chunk:", fcmError);
                }
              }
            }

            // Send via Expo Push Service
            if (expoTokens.length > 0) {
              const expoChunks = chunkArray(expoTokens, 100);
              for (const chunk of expoChunks) {
                try {
                  const expoPayload = chunk.map((token) => ({
                    to: token,
                    title: notification.title,
                    body: notification.description,
                    data: {
                      channel: notification.channel || "general",
                      notificationId: notification._id.toString(),
                      title: notification.title,
                      body: notification.description,
                      imageUrl: notification.imageUrl || "",
                      redirectType: notification.redirectType || "none",
                      redirectId: notification.redirectId || "",
                      externalUrl: notification.externalUrl || "",
                    },
                    sound: "default",
                    channelId: "default",
                  }));

                  await axios.post("https://exp.host/--/api/v2/push/send", expoPayload, {
                    headers: {
                      Accept: "application/json",
                      "Accept-encoding": "gzip, deflate",
                      "Content-Type": "application/json",
                    },
                  });
                  console.log(`[NotificationWorker] Expo Push Chunk of ${chunk.length} sent successfully`);
                } catch (expoError: any) {
                  console.error("[NotificationWorker] Error sending Expo push chunk:", expoError?.response?.data || expoError.message);
                }
              }
            }
          }

          // Update status to COMPLETED
          notification.status = NotificationStatus.COMPLETED;
          await notification.save();
          console.log(`[NotificationWorker] Job ${job.id} completed successfully`);

          // Emit live socket notification if delivery type is IN_APP or BOTH
          if (notification.deliveryType === "IN_APP" || notification.deliveryType === "BOTH") {
            const socketPayload = {
              _id: notification._id.toString(),
              title: notification.title,
              description: notification.description,
              imageUrl: notification.imageUrl || "",
              channel: notification.channel,
              redirectType: notification.redirectType,
              redirectId: notification.redirectId || "",
              externalUrl: notification.externalUrl || "",
              createdAt: notification.createdAt.toISOString(),
              isRead: false,
            };

            if (notification.targetType === "ALL") {
              socketService.emitToAll(SocketEvents.NEW_NOTIFICATION, socketPayload);
            } else {
              for (const u of targetUsers) {
                socketService.emitToUser(u._id.toString(), SocketEvents.NEW_NOTIFICATION, socketPayload);
              }
            }
            console.log(`[NotificationWorker] Dispatched live socket event for notification ${notification._id}`);
          }
        } catch (error: any) {
          console.error(`[NotificationWorker] Job ${job.id} failed:`, error);
          notification.status = NotificationStatus.FAILED;
          notification.error = error.message || String(error);
          await notification.save();
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
