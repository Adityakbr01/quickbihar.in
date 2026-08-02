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
