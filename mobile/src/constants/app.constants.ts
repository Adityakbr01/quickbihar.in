// Global App Constants (Shared across all multi-vertical modules)
export const APP_NAME = "QuickBihar";
export const APP_COMPANY_NAME = "QuickBihar Inc.";
export const APP_VERSION = "1.0.0";
export const APP_CURRENCY = "₹";
export const APP_GENERAL_SUPPORT_EMAIL = "support@quickbihar.in";
export const APP_GENERAL_SUPPORT_PHONE = "+91 98765 43210";

// Module-Specific Vertical Configuration Interface
export interface ModuleVerticalConfig {
  id: "clothing" | "jewelery" | "food";
  name: string;
  brandName: string;
  slogan: string;
  tagline: string;
  supportEmail: string;
  supportPhone: string;
  whatsappPhone: string;
  freeShippingThreshold: number;
  returnPolicyDays: number;
}

// Vertical Module Configs with Dedicated Support Numbers & Email Contacts
export const MODULE_CONFIGS: Record<
  "clothing" | "jewelery" | "food",
  ModuleVerticalConfig
> = {
  clothing: {
    id: "clothing",
    name: "Clothing & Fashion",
    brandName: "QUICKBIHAR FASHION",
    slogan: "Express Your Unique Style",
    tagline: "Trending apparel & authentic traditional wear",
    supportEmail: "clothing-support@quickbihar.in",
    supportPhone: "+91 98765 43211",
    whatsappPhone: "+91 98765 43211",
    freeShippingThreshold: 999,
    returnPolicyDays: 7,
  },
  jewelery: {
    id: "jewelery",
    name: "Jewelry",
    brandName: "QUICKBIHAR",
    slogan: "Handcrafted Fine Jewellery",
    tagline: "Sacred heirloom, Hallmarked gold & silver craftsmanship",
    supportEmail: "jewelery-support@quickbihar.in",
    supportPhone: "+91 98765 43212",
    whatsappPhone: "+91 98765 43212",
    freeShippingThreshold: 5000,
    returnPolicyDays: 30,
  },
  food: {
    id: "food",
    name: "Food & Delicacies",
    brandName: "QUICKBIHAR EATS",
    slogan: "Fresh & Local Flavors Delivered",
    tagline: "Authentic local delicacies and fresh food from top sellers",
    supportEmail: "food-support@quickbihar.in",
    supportPhone: "+91 98765 43213",
    whatsappPhone: "+91 98765 43213",
    freeShippingThreshold: 499,
    returnPolicyDays: 0,
  },
};

// Convenient Named Exports per Vertical
export const CLOTHING_MODULE_CONFIG = MODULE_CONFIGS.clothing;
export const JEWELERY_MODULE_CONFIG = MODULE_CONFIGS.jewelery;
export const FOOD_MODULE_CONFIG = MODULE_CONFIGS.food;

// Web Admin Dashboard
// The mobile app does not ship an in-app admin panel — admins reach the
// web admin at this URL. Open in the system browser via Linking.openURL;
// the user re-authenticates on the web (no JWT handoff).
export const WEB_ADMIN_URL = "https://admin.quickbihar.com";
export const WEB_ADMIN_LOGIN_URL = `${WEB_ADMIN_URL}/admin/login`;
