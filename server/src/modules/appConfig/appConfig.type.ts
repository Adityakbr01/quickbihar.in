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
    delivery: {
        defaultRadiusKm: number;
        minOrderAmount: number;
        estimatedMinutes: number;
        riderPayoutAmount?: number;
    };
    updatedBy?: string;
}
