import landingData from "./landingData.json";

export const APP_LINKS = {
  // Kept for launch day (VITE_PLAYSTORE_URL override or the JSON fallback).
  // Nothing links here until the Android app is live.
  PLAY_STORE:
    import.meta.env.VITE_PLAYSTORE_URL ||
    landingData.app.playStoreUrl,
  // Live today: the QuickBihar web app.
  WEB_APP: "https://quickbihar.in",
  // WhatsApp Business chat (support) + launch-notify channel.
  WHATSAPP:
    "https://wa.me/919304922632?text=Hi%20QuickBihar!%20I%20need%20help.",
  WHATSAPP_LAUNCH:
    "https://wa.me/919304922632?text=Hi!%20Please%20notify%20me%20when%20the%20QuickBihar%20Android%20app%20launches.",
  SUPPORT_EMAIL: landingData.app.supportEmail,
  SUPPORT_PHONE: landingData.app.supportPhone,
  OFFICE_ADDRESS: landingData.app.officeAddress,
};

export { landingData };
