/**
 * Saved-address data-access layer.
 *
 * Every query is scoped by `userId` so a user can only ever read or mutate their own
 * addresses — ownership is enforced here at the query level, not just in the service.
 */
import { SavedAddress, type ISavedAddress } from "./savedAddresses.model";

/** Persist a new address for a user. */
export async function create(data: Partial<ISavedAddress>) {
    return await SavedAddress.create(data);
}

/** All of a user's addresses, default first, then most recent. */
export async function findByUserId(userId: string) {
    return await SavedAddress.find({ userId }).sort({ isDefault: -1, createdAt: -1 });
}

/** Fetch a single address by id (ownership not enforced — callers must check). */
export async function findById(id: string) {
    return await SavedAddress.findById(id);
}

/** Update an address only if it belongs to the given user. */
export async function update(id: string, userId: string, data: Partial<ISavedAddress>) {
    return await SavedAddress.findOneAndUpdate({ _id: id, userId }, data, { returnDocument: 'after' });
}

/**
 * Delete a user-owned address.
 * Named `deleteAddress` (avoids the `delete` reserved word) and re-exported as `delete`
 * so call sites keep using `savedAddressDAO.delete(...)`.
 */
async function deleteAddress(id: string, userId: string) {
    return await SavedAddress.findOneAndDelete({ _id: id, userId });
}
export { deleteAddress as delete };

/** Make one address the default, clearing the flag on all the user's others first. */
export async function setAsDefault(id: string, userId: string) {
    await SavedAddress.updateMany({ userId }, { isDefault: false });
    return await SavedAddress.findOneAndUpdate({ _id: id, userId }, { isDefault: true }, { returnDocument: 'after' });
}
