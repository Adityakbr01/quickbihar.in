import { SavedAddress, type ISavedAddress } from "./savedAddresses.model";

export class SavedAddressDAO {
    async create(data: Partial<ISavedAddress>) {
        return await SavedAddress.create(data);
    }

    async findByUserId(userId: string) {
        return await SavedAddress.find({ userId }).sort({ isDefault: -1, createdAt: -1 });
    }

    async findById(id: string) {
        return await SavedAddress.findById(id);
    }

    async update(id: string, userId: string, data: Partial<ISavedAddress>) {
        return await SavedAddress.findOneAndUpdate({ _id: id, userId }, data, { new: true });
    }

    async delete(id: string, userId: string) {
        return await SavedAddress.findOneAndDelete({ _id: id, userId });
    }

    async setAsDefault(id: string, userId: string) {
        // Reset all defaults for this user
        await SavedAddress.updateMany({ userId }, { isDefault: false });
        // Set this one as default
        return await SavedAddress.findOneAndUpdate({ _id: id, userId }, { isDefault: true }, { new: true });
    }
}

export const savedAddressDAO = new SavedAddressDAO();
