import type { UpdateQuery } from "mongoose";
import { ClothingStoreConfig, FoodStoreConfig, JewelryStoreConfig, Store } from "./store.model";
import { StoreType } from "./store.schema";
import type { IStore } from "./store.types";

export const createStoreDAO = (data: any) => Store.create(data);

export const createStoreConfigDAO = (type: StoreType, data: any) => {
    if (type === StoreType.FOOD) return FoodStoreConfig.create(data);
    if (type === StoreType.CLOTHING) return ClothingStoreConfig.create(data);
    if (type === StoreType.JEWELRY) return JewelryStoreConfig.create(data);
};

export const updateStoreDAO = (id: string, data: UpdateQuery<IStore>) =>
    Store.findByIdAndUpdate(id, data, { new: true });


export const getStoreByIdDAO = (id: string) => Store.findById(id);

export const getStoresBySellerDAO = (sellerId: string) => Store.find({ sellerId });

export const getNearbyStoresDAO = (lng: number, lat: number, radiusKm: number, type?: StoreType, isOpen?: boolean) => {
    const query: any = {
        currentLocation: {
            $near: {
                $geometry: { type: "Point", coordinates: [lng, lat] },
                $maxDistance: radiusKm * 1000, // Convert km to meters
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

export const getStoreConfigDAO = (type: StoreType, storeId: string) => {
    if (type === StoreType.FOOD) return FoodStoreConfig.findOne({ storeId });
    if (type === StoreType.CLOTHING) return ClothingStoreConfig.findOne({ storeId });
    if (type === StoreType.JEWELRY) return JewelryStoreConfig.findOne({ storeId });
};

export const updateStoreConfigDAO = (type: StoreType, storeId: string, data: any) => {
    if (type === StoreType.FOOD) return FoodStoreConfig.findOneAndUpdate({ storeId }, data, { new: true });
    if (type === StoreType.CLOTHING) return ClothingStoreConfig.findOneAndUpdate({ storeId }, data, { new: true });
    if (type === StoreType.JEWELRY) return JewelryStoreConfig.findOneAndUpdate({ storeId }, data, { new: true });
};


