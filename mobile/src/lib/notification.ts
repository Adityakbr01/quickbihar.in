import { Platform } from "react-native";
import * as Device from "expo-device";
import Constants from "expo-constants";

export async function registerForPushNotificationsAsync() {
  // Check if running in Expo Go (remote notifications removed in SDK 53+)
  if (Constants.appOwnership === "expo") {
    console.log("[Notification] Skipping registration in Expo Go.");
    return;
  }

  // ✅ Dynamic Import (CRITICAL FIX)
  const Notifications = await import("expo-notifications");

  let token;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      console.warn("Failed to get push token for push notification!");
      return;
    }

    try {
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;
      if (!projectId) {
        console.warn(
          "Project ID not found in Constants. Notification token might fail."
        );
      }
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      console.log("[Notification] Token sync successful");
    } catch (e) {
      console.error("[Notification] Error getting token:", e);
    }
  } else {
    console.log("[Notification] Physical device required for tokens");
  }

  return token;
}

/**
 * Lazy initialization of the notification handler.
 * Call this only in non-Expo-Go environments.
 */
export async function initializeNotificationHandler() {
  if (Constants.appOwnership === "expo") return;

  const Notifications = await import("expo-notifications");

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}
