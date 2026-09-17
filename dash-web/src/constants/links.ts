import landingData from "./landingData.json";

export const APP_LINKS = {
  PLAY_STORE:
    import.meta.env.VITE_PLAYSTORE_URL ||
    landingData.app.playStoreUrl,
  SUPPORT_EMAIL: landingData.app.supportEmail,
  SUPPORT_PHONE: landingData.app.supportPhone,
  OFFICE_ADDRESS: landingData.app.officeAddress,
};

export { landingData };
