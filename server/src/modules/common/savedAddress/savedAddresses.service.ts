/**
 * Saved-address business logic.
 *
 * Thin domain layer over `savedAddressDAO`: injects the owning `userId` on create and
 * turns "not found / not yours" DAO results into 404s. Ownership scoping lives in the DAO.
 */
import * as savedAddressDAO from "./savedAddresses.dao";
import { ApiError } from "@/utils/ApiError";
import { type ISavedAddress } from "./savedAddresses.model";
import { User } from "@/modules/common/user/user.model";

function cleanPhone(p?: string): string {
    return (p || "").replace(/\D/g, "").slice(-10);
}

/** Create an address bound to the given user. Stamps isPhoneVerified if phone matches user's verified phone. */
export async function createAddress(userId: string, data: Partial<ISavedAddress>) {
    const user = await User.findById(userId).select("isPhoneVerified phone").lean();
    const isAddressPhoneVerified = Boolean(
        user?.isPhoneVerified &&
        cleanPhone(user.phone) &&
        cleanPhone(user.phone) === cleanPhone(data.phone)
    );

    return await savedAddressDAO.create({
        ...data,
        userId: userId as any,
        isPhoneVerified: isAddressPhoneVerified,
    });
}

/** List all addresses for a user. */
export async function getUserAddresses(userId: string) {
    return await savedAddressDAO.findByUserId(userId);
}

/** Update a user-owned address or fail with 404. Keeps isPhoneVerified in sync with verified phone. */
export async function updateAddress(id: string, userId: string, data: Partial<ISavedAddress>) {
    const user = await User.findById(userId).select("isPhoneVerified phone").lean();
    const existing = await savedAddressDAO.findByUserId(userId);
    const target = existing.find(a => (a as any)._id?.toString() === id);
    const targetPhone = data.phone !== undefined ? data.phone : target?.phone;

    const isAddressPhoneVerified = Boolean(
        user?.isPhoneVerified &&
        cleanPhone(user.phone) &&
        cleanPhone(user.phone) === cleanPhone(targetPhone)
    );

    const address = await savedAddressDAO.update(id, userId, {
        ...data,
        isPhoneVerified: isAddressPhoneVerified,
    });
    if (!address) {
        const techMsg = `Address ${id} for user ${userId} not found or unauthorized`;
        const userMsg = "Address not found or you do not have permission to update it.";
        console.error(`[savedAddresses update] Technical: ${techMsg} | User Message: ${userMsg}`);
        throw new ApiError(404, userMsg);
    }
    return address;
}

/** Delete a user-owned address or fail with 404. */
export async function deleteAddress(id: string, userId: string) {
    const address = await savedAddressDAO.delete(id, userId);
    if (!address) {
        const techMsg = `Address ${id} for user ${userId} not found for deletion`;
        const userMsg = "Address not found or already deleted.";
        console.error(`[savedAddresses delete] Technical: ${techMsg} | User Message: ${userMsg}`);
        throw new ApiError(404, userMsg);
    }
    return address;
}

/** Mark a user-owned address as default or fail with 404. */
export async function setDefaultAddress(id: string, userId: string) {
    const address = await savedAddressDAO.setAsDefault(id, userId);
    if (!address) {
        const techMsg = `Address ${id} for user ${userId} not found for setDefaultAddress`;
        const userMsg = "Address not found or could not be set as default.";
        console.error(`[savedAddresses setDefault] Technical: ${techMsg} | User Message: ${userMsg}`);
        throw new ApiError(404, userMsg);
    }
    return address;
}

