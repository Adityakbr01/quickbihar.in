import type { Document } from "mongoose";

export interface IAppConfig extends Document {
    store: {
        storeName: string;
        appTitle: string;
    };
    policies: {
        privacyPolicy: string;
        termsAndConditions: string;
        returnPolicy: string;
        shippingPolicy: string;
    };
    contact: {
        email: string;
        phone: string;
        whatsapp: string;
        address: string;
    };
    socialLinks: {
        facebook: string;
        instagram: string;
        twitter: string;
        youtube: string;
    };
    seo: {
        metaTitle: string;
        metaDescription: string;
        keywords: string[];
    };
    appearance: {
        logoUrl: string;
        faviconUrl: string;
    };
    shipping: {
        freeShippingThreshold: number;
        shippingFee: number;
    };
    tax: {
        enabled: boolean;
        rate: number;
        inclusive: boolean;
    };
    currency: {
        code: string;
        symbol: string;
    };
    marketplace?: {
        commissionPercent?: number;
    };
    delivery: {
        defaultRadiusKm: number;
        minOrderAmount: number;
        estimatedMinutes: number;
        riderPayoutAmount?: number;
        riderPayoutRules?: {
            upto3Km?: number;
            upto5Km?: number;
            upto8Km?: number;
            extraPerKmAfter8?: number;
            rainBonus?: number;
            peakBonus?: number;
            festivalBonus?: number;
            nightBonus?: number;
        };
        bonusRules?: {
            rainBonus?: number;
            peakBonus?: number;
            festivalBonus?: number;
            nightBonus?: number;
            rainMode?: "AUTO" | "FORCE_ON" | "FORCE_OFF";
            peakMode?: "AUTO" | "FORCE_ON" | "FORCE_OFF";
            festivalMode?: "AUTO" | "FORCE_ON" | "FORCE_OFF";
            nightMode?: "AUTO" | "FORCE_ON" | "FORCE_OFF";
            peakWindows?: Array<{ start: string; end: string }>;
            festivalWindows?: Array<{ name?: string; startDate: string; endDate: string }>;
            nightStart?: string;
            nightEnd?: string;
        };
    };
    updatedBy?: string;
}
