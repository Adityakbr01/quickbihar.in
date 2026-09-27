import { WebHaptics } from "web-haptics";

export const haptics = new WebHaptics();

export type HapticType =
  | "light"
  | "medium"
  | "heavy"
  | "selection"
  | "success"
  | "warning"
  | "error";

export const triggerHaptic = (type: HapticType = "medium") => {
  try {
    haptics.trigger(type);
  } catch {}
};

export default haptics;
