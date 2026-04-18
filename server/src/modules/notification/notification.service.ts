import admin from "firebase-admin";
import { ENV } from "../../config/env.config";

export class NotificationService {
  private isInitialized = false;

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (admin.apps.length === 0) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: ENV.FIREBASE_PROJECT_ID,
            clientEmail: ENV.FIREBASE_CLIENT_EMAIL,
            privateKey: ENV.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
          }),
        });
        this.isInitialized = true;
        console.log("[NotificationService] Firebase Admin SDK initialized successfully");
      }
    } catch (error) {
      console.error("[NotificationService] Firebase initialization failed:", error);
    }
  }

  async sendPush(token: string, title: string, body: string, data?: any) {
    if (!this.isInitialized) {
      console.warn("[NotificationService] Firebase not initialized, skipping notification");
      return;
    }

    try {
      const message = {
        notification: {
          title,
          body,
        },
        data: data ? { ...data, click_action: "FLUTTER_NOTIFICATION_CLICK" } : { click_action: "FLUTTER_NOTIFICATION_CLICK" },
        token,
      };

      const response = await admin.messaging().send(message);
      console.log(`[NotificationService] Notification sent successfully: ${response}`);
      return response;
    } catch (error) {
      console.error("[NotificationService] Error sending notification:", error);
    }
  }

  async sendToTopic(topic: string, title: string, body: string, data?: any) {
    if (!this.isInitialized) return;

    try {
      const message = {
        notification: {
          title,
          body,
        },
        data: data || {},
        topic,
      };

      const response = await admin.messaging().send(message);
      console.log(`[NotificationService] Topic notification sent successfully: ${response}`);
      return response;
    } catch (error) {
      console.error(`[NotificationService] Error sending topic notification (${topic}):`, error);
    }
  }
}

export const notificationService = new NotificationService();
