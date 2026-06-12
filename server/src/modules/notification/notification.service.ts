import admin from "firebase-admin";
import { ENV } from "../../config/env.config";
import axios from "axios";

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
    if (!token || typeof token !== "string" || token.trim() === "") {
      console.warn("[NotificationService] Empty token, skipping notification");
      return;
    }

    console.log(`[🔥 FIREBASE_FCM] Preparing push notification. Target Token: ${token.substring(0, 30)}...`);

    // Check if it's an Expo Push Token
    if (token.startsWith("ExponentPushToken[") || token.startsWith("ExpoPushToken[")) {
      try {
        console.log(`[🔥 FIREBASE_FCM] Routing Expo Token via Expo Push API: ${token}`);
        const expoPayload = {
          to: token,
          title,
          body,
          data: data || {},
          sound: "default",
          channelId: "default",
        };

        const response = await axios.post("https://exp.host/--/api/v2/push/send", expoPayload, {
          headers: {
            Accept: "application/json",
            "Accept-encoding": "gzip, deflate",
            "Content-Type": "application/json",
          },
        });
        console.log("[🔥 FIREBASE_FCM] Expo notification dispatched successfully. Response:", response.data);
        return response.data;
      } catch (error: any) {
        console.error("[🔥 FIREBASE_FCM] Error dispatching Expo notification:", error?.response?.data || error.message);
        return;
      }
    }

    if (!this.isInitialized) {
      console.warn("[🔥 FIREBASE_FCM] Firebase not initialized, skipping direct FCM delivery");
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

      console.log(`[🔥 FIREBASE_FCM] Dispatching native FCM push to Firebase SDK...`);
      const response = await admin.messaging().send(message);
      console.log(`[🔥 FIREBASE_FCM] Native FCM push successful! Message ID: ${response}`);
      return response;
    } catch (error) {
      console.error("[🔥 FIREBASE_FCM] Error dispatching native FCM push:", error);
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
