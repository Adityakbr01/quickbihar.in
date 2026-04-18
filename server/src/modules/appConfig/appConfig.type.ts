import type { Document } from "mongoose";

export interface IAppConfig extends Document {
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
    updatedBy?: string;
}
