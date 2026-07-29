/**
 * Notification (push) service.
 *
 * Thin delivery layer over Firebase Cloud Messaging with Expo Push fallback. The Firebase
 * Admin SDK is initialized once at module load; delivery helpers no-op gracefully when the
 * SDK is unavailable so callers never need to guard around notification failures.
 */

import admin from "firebase-admin";
import { ENV } from "@/config/env.config";
import axios from "axios";

/** Tracks whether the Firebase Admin SDK initialized successfully at module load. */
let isInitialized = false;

/**
 * Initializes the Firebase Admin SDK exactly once using service-account credentials
 * from the environment. Failures are swallowed (logged) so the module still loads and
 * delivery helpers degrade gracefully.
 */
function init() {
  try {
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: ENV.FIREBASE_PROJECT_ID,
          clientEmail: ENV.FIREBASE_CLIENT_EMAIL,
          privateKey: ENV.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
      });
      isInitialized = true;
      console.log("[NotificationService] Firebase Admin SDK initialized successfully");
    }
  } catch (error) {
    console.error("[NotificationService] Firebase initialization failed:", error);
  }
}

// Initialize the SDK on module load (preserves the previous constructor side-effect).
init();

/**
 * Sends a push notification to a single device token.
 * Expo push tokens are routed via the Expo Push API; all other tokens go through native FCM.
 * No-ops on empty tokens or when FCM is uninitialized. Never throws — errors are logged.
 *
 * @param token - Target device token (Expo or FCM).
 * @param title - Notification title.
 * @param body - Notification body text.
 * @param data - Optional data payload delivered alongside the notification.
 * @returns The provider response on success, otherwise `undefined`.
 */
export async function sendPush(token: string, title: string, body: string, data?: any) {
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

  if (!isInitialized) {
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

/**
 * Sends a push notification to all devices subscribed to an FCM topic.
 * No-ops when FCM is uninitialized. Never throws — errors are logged.
 *
 * @param topic - FCM topic name to broadcast to.
 * @param title - Notification title.
 * @param body - Notification body text.
 * @param data - Optional data payload delivered alongside the notification.
 * @returns The FCM response on success, otherwise `undefined`.
 */
export async function sendToTopic(topic: string, title: string, body: string, data?: any) {
  if (!isInitialized) return;

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
