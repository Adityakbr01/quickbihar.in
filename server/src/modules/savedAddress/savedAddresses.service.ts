/**
 * Saved-address business logic.
 *
 * Thin domain layer over `savedAddressDAO`: injects the owning `userId` on create and
 * turns "not found / not yours" DAO results into 404s. Ownership scoping lives in the DAO.
 */
import * as savedAddressDAO from "./savedAddresses.dao";
import { ApiError } from "../../utils/ApiError";
import { type ISavedAddress } from "./savedAddresses.model";

/** Create an address bound to the given user. */
export async function createAddress(userId: string, data: Partial<ISavedAddress>) {
    return await savedAddressDAO.create({ ...data, userId: userId as any });
}

/** List all addresses for a user. */
export async function getUserAddresses(userId: string) {
    return await savedAddressDAO.findByUserId(userId);
}

/** Update a user-owned address or fail with 404. */
export async function updateAddress(id: string, userId: string, data: Partial<ISavedAddress>) {
    const address = await savedAddressDAO.update(id, userId, data);
    if (!address) throw new ApiError(404, "Address not found or unauthorized");
    return address;
}

/** Delete a user-owned address or fail with 404. */
export async function deleteAddress(id: string, userId: string) {
    const address = await savedAddressDAO.delete(id, userId);
    if (!address) throw new ApiError(404, "Address not found or unauthorized");
    return address;
}

/** Mark a user-owned address as default or fail with 404. */
export async function setDefaultAddress(id: string, userId: string) {
    const address = await savedAddressDAO.setAsDefault(id, userId);
    if (!address) throw new ApiError(404, "Address not found or unauthorized");
    return address;
}
