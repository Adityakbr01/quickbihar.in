import type { UpdateQuery } from "mongoose";
import { ClothingStoreConfig, Store } from "./store.model";
import { StoreType } from "./store.schema";
import type { IStore } from "./store.types";

export const createStoreDAO = (data: any) => Store.create(data);

export const createStoreConfigDAO = (_type: StoreType, data: any) => ClothingStoreConfig.create(data);

export const updateStoreDAO = (id: string, data: UpdateQuery<IStore>) =>
    Store.findByIdAndUpdate(id, data, { new: true });

export const getStoreByIdDAO = (id: string) => Store.findById(id);

export const getStoresBySellerDAO = (sellerId: string) => Store.find({ sellerId });

export const getNearbyStoresDAO = (lng: number, lat: number, radiusKm: number, type?: StoreType, isOpen?: boolean) => {
    const query: any = {
        currentLocation: {
            $near: {
                $geometry: { type: "Point", coordinates: [lng, lat] },
                $maxDistance: radiusKm * 1000,
            },
        },
        isActive: true,
        isVerified: true,
    };

    if (type) {
        query.type = type;
    }

    if (isOpen !== undefined) {
        query.isOpen = isOpen;
    }

    return Store.find(query);
};

export const searchStoresDAO = (query: any) => Store.find(query);

export const getStoreConfigDAO = (_type: StoreType, storeId: string) =>
    ClothingStoreConfig.findOne({ storeId });

export const updateStoreConfigDAO = (_type: StoreType, storeId: string, data: any) =>
    ClothingStoreConfig.findOneAndUpdate({ storeId }, data, { returnDocument: 'after' });
