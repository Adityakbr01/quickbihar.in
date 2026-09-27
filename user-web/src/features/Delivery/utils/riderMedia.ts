import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { deliveryApi, type DeliveryLocationPayload, type RiderOffer } from "../api/delivery.api";
import { money, storeNameOf } from "../theme/riderTheme";
import type { ShowDialog } from "../types/rider.types";

export async function currentLocation(): Promise<DeliveryLocationPayload | undefined> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") return undefined;
  const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    heading: position.coords.heading || 0,
  };
}

export async function pickProofPhoto(showDialog: ShowDialog, kind: "pickup" | "delivery" = "pickup") {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== "granted") {
    showDialog("Camera Permission Required", "Photo proof is required for pickup and delivery.");
    return "";
  }
  const result = await ImagePicker.launchCameraAsync({
    quality: 0.55,
    allowsEditing: false,
  });
  if (result.canceled) return "";
  const localUri = result.assets[0]?.uri;
  if (!localUri) return "";

  // Upload the captured image to the server so we submit a hosted URL the whole
  // platform can render — not the device-local file:// path, which is a stub
  // that only exists on this phone.
  try {
    const { url } = await deliveryApi.uploadProof(localUri, kind);
    return url;
  } catch (error: any) {
    showDialog("Upload Failed", error?.message || "Could not upload the proof photo. Please try again.");
    return "";
  }
}

export async function notifyLocalOffer(offer: RiderOffer) {
  try {
    const Notifications = await import("expo-notifications");
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "New Delivery Offer",
        body: `${storeNameOf(offer)} - ${money(offer.payoutAmount)}`,
        sound: true,
      },
      trigger: null,
    });
  } catch {
    // The in-app dialog is the reliable path across Expo runtimes.
  }
}
