const hasText = (value?: unknown) => typeof value === "string" && value.trim().length > 0;
const hasAnyText = (...values: unknown[]) => values.some(hasText);
const hasList = (value?: unknown) => Array.isArray(value) && value.some(hasText);

export const STORE_SETUP_REQUIRED_FIELDS = [
    "store.name",
    "store.logoUrl",
    "store.bannerUrl",
    "store.contact",
    "address.line1",
    "address.city",
    "address.state",
    "address.country",
    "address.postalCode",
    "delivery.deliveryAreas",
    "delivery.shippingFee",
    "delivery.freeShippingThreshold",
    "seo.storeTitle",
    "seo.metaTitle",
    "seo.metaDescription",
    "policyRefs.returnPolicy",
    "policyRefs.refundPolicy",
    "policyRefs.shippingPolicy",
];

export const buildStoreSetupStatus = (store: any) => {
    const raw = typeof store?.toObject === "function" ? store.toObject() : store || {};
    const address = raw.address || {};
    const contact = raw.contact || {};
    const categoryConfig = raw.categoryConfig || {};
    const deliveryConfig = raw.deliveryConfig || {};
    const seo = raw.seo || {};
    const policyRefs = raw.policyRefs || {};

    const deliveryFee = deliveryConfig.shippingFee ?? raw.deliveryFee;
    const freeShippingThreshold = deliveryConfig.freeShippingThreshold ?? raw.minOrderAmount;

    const checks: Record<string, boolean> = {
        "store.name": hasText(raw.name),
        "store.logoUrl": hasText(raw.logoUrl),
        "store.bannerUrl": hasText(raw.bannerUrl),
        "store.contact": hasAnyText(contact.email, contact.phone),
        "address.line1": hasText(address.line1),
        "address.city": hasText(address.city),
        "address.state": hasText(address.state),
        "address.country": hasText(address.country),
        "address.postalCode": hasAnyText(address.postalCode, address.pincode),
        "category.primaryCategory": hasText(categoryConfig.primaryCategory),
        "category.subcategories": hasList(categoryConfig.subcategories),
        "delivery.deliveryAreas": hasList(deliveryConfig.deliveryAreas),
        "delivery.shippingFee": typeof deliveryFee === "number" && deliveryFee >= 0,
        "delivery.freeShippingThreshold": typeof freeShippingThreshold === "number" && freeShippingThreshold >= 0,
        "seo.storeTitle": hasText(seo.storeTitle),
        "seo.metaTitle": hasText(seo.metaTitle),
        "seo.metaDescription": hasText(seo.metaDescription),
        "policyRefs.returnPolicy": hasText(policyRefs.returnPolicy?.toString?.() || policyRefs.returnPolicy),
        "policyRefs.refundPolicy": hasText(policyRefs.refundPolicy?.toString?.() || policyRefs.refundPolicy),
        "policyRefs.shippingPolicy": hasText(policyRefs.shippingPolicy?.toString?.() || policyRefs.shippingPolicy),
    };

    const missingFields = STORE_SETUP_REQUIRED_FIELDS.filter((field) => !checks[field]);

    return {
        isComplete: missingFields.length === 0,
        missingFields,
    };
};

export const mergeStoreForSetup = (existingStore: any, updates: any) => {
    const existing = typeof existingStore?.toObject === "function" ? existingStore.toObject() : existingStore || {};

    return {
        ...existing,
        ...updates,
        address: {
            ...(existing.address || {}),
            ...(updates.address || {}),
        },
        contact: {
            ...(existing.contact || {}),
            ...(updates.contact || {}),
        },
        categoryConfig: {
            ...(existing.categoryConfig || {}),
            ...(updates.categoryConfig || {}),
        },
        deliveryConfig: {
            ...(existing.deliveryConfig || {}),
            ...(updates.deliveryConfig || {}),
        },
        seo: {
            ...(existing.seo || {}),
            ...(updates.seo || {}),
        },
        policyRefs: {
            ...(existing.policyRefs || {}),
            ...(updates.policyRefs || {}),
        },
    };
};
