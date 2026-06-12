import { uploadToImageKit } from "../../utils/imagekit.util";

const parseJsonField = (value: unknown) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    try {
        return JSON.parse(trimmed);
    } catch {
        return value;
    }
};

const parseBooleanField = (value: unknown) => {
    if (typeof value === "boolean") return value;
    if (typeof value !== "string") return value;
    if (["true", "1", "on", "yes"].includes(value.toLowerCase())) return true;
    if (["false", "0", "off", "no"].includes(value.toLowerCase())) return false;
    return value;
};

const firstFile = (files: any, key: string) => {
    const value = files?.[key];
    return Array.isArray(value) ? value[0] : undefined;
};

export const normalizeMallPayload = (body: any = {}) => ({
    ...body,
    address: parseJsonField(body.address),
    contact: parseJsonField(body.contact),
    images: parseJsonField(body.images),
    isMobileVisible: parseBooleanField(body.isMobileVisible),
    isFeatured: parseBooleanField(body.isFeatured),
    isActive: parseBooleanField(body.isActive),
});

export const uploadMallMediaFiles = async (files: any = {}) => {
    const payload: Record<string, any> = {};
    const logo = firstFile(files, "logo");
    const coverImage = firstFile(files, "coverImage");
    const images = files?.images;

    if (logo) {
        const uploaded = await uploadToImageKit(logo.buffer, logo.originalname, "malls/logos");
        payload.logoUrl = uploaded.url;
        payload.logoImagePublicId = uploaded.fileId;
    }

    if (coverImage) {
        const uploaded = await uploadToImageKit(coverImage.buffer, coverImage.originalname, "malls/covers");
        payload.coverImageUrl = uploaded.url;
        payload.coverImagePublicId = uploaded.fileId;
    }

    if (images) {
        const imageFiles = Array.isArray(images) ? images : [images];
        const uploadedImages = [];
        for (const file of imageFiles) {
            const uploaded = await uploadToImageKit(file.buffer, file.originalname, "malls/images");
            uploadedImages.push({
                url: uploaded.url,
                fileId: uploaded.fileId,
            });
        }
        payload.images = uploadedImages;
    }

    return payload;
};

