import { savedAddressDAO } from "./savedAddresses.dao";
import { ApiError } from "../../utils/ApiError";
import { type ISavedAddress } from "./savedAddresses.model";

export class SavedAddressService {
    async createAddress(userId: string, data: Partial<ISavedAddress>) {
        return await savedAddressDAO.create({ ...data, userId: userId as any });
    }

    async getUserAddresses(userId: string) {
        return await savedAddressDAO.findByUserId(userId);
    }

    async updateAddress(id: string, userId: string, data: Partial<ISavedAddress>) {
        const address = await savedAddressDAO.update(id, userId, data);
        if (!address) throw new ApiError(404, "Address not found or unauthorized");
        return address;
    }

    async deleteAddress(id: string, userId: string) {
        const address = await savedAddressDAO.delete(id, userId);
        if (!address) throw new ApiError(404, "Address not found or unauthorized");
        return address;
    }

    async setDefaultAddress(id: string, userId: string) {
        const address = await savedAddressDAO.setAsDefault(id, userId);
        if (!address) throw new ApiError(404, "Address not found or unauthorized");
        return address;
    }
}

export const savedAddressService = new SavedAddressService();