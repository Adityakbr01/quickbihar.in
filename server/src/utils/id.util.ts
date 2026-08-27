import { Types } from "mongoose";

/**
 * Safely extracts the canonical string ID from an ObjectId, a populated Mongoose document,
 * an object with an `_id` property, or a string.
 */
export function idString(value: any): string {
    if (!value) return "";
    if (typeof value === "string") return value.trim();
    if (typeof value.toHexString === "function") return value.toHexString();
    if (value._id) return idString(value._id);
    return value.toString?.() || String(value);
}

/**
 * Converts any ID-like value to a Mongoose Types.ObjectId, or returns undefined if invalid.
 */
export function toObjectId(value: any): Types.ObjectId | undefined {
    const id = idString(value);
    return Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : undefined;
}
