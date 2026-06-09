import {
    createStoreDAO,
    createStoreConfigDAO,
    updateStoreDAO,
    getStoreByIdDAO,
    getNearbyStoresDAO,
    getStoresBySellerDAO,
    getStoreConfigDAO,
    updateStoreConfigDAO
} from "./store.dao";
import type { CreateStoreInput, UpdateStoreInput } from "./store.types";
import { StoreType } from "./store.schema";
import { Seller } from "../seller/seller.model";
import { ApiError } from "../../utils/ApiError";
import { buildStoreSetupStatus, mergeStoreForSetup } from "./store.setup";


export const createStoreService = async (data: CreateStoreInput, sellerId: string) => {
    // 🛡️ Validate Seller Type
    const seller = await Seller.findOne({ userId: sellerId });
    if (!seller) {
        throw new ApiError(404, "Seller profile not found");
    }

    if (seller.status !== "APPROVED" || !seller.isVerified) {
        throw new ApiError(403, "Seller approval is required before creating a store.");
    }

    if (seller.sellerType !== data.type) {
        throw new ApiError(400, `You are registered as a ${seller.sellerType} seller. You cannot create a ${data.type} store.`);
    }

    // 🛡️ Validate Max Stores (1 per user)
    const existingStores = await getStoresBySellerDAO(sellerId);
    if (existingStores && existingStores.length > 0) {
        throw new ApiError(400, "You already have a store. A seller can only have one store at a time.");
    }

    const { config, ...storeData } = data;
    const setup = buildStoreSetupStatus(storeData);

    const store = await createStoreDAO({
        ...storeData,
        sellerId,
        currentLocation: {
            type: "Point",
            coordinates: [data.currentLocation.lng, data.currentLocation.lat],
        },
        isSetupComplete: setup.isComplete,
        setupCompletedAt: setup.isComplete ? new Date() : undefined,
        setupMissingFields: setup.missingFields,
    });


    if (data.config) {
        await createStoreConfigDAO(data.type as StoreType, {
            ...data.config,
            storeId: store._id,
        });
    }

    return store;
};


export const updateStoreService = async (id: string, data: UpdateStoreInput) => {
    const existingStore = await getStoreByIdDAO(id);
    if (!existingStore) {
        throw new ApiError(404, "Store not found");
    }

    const updateData: any = { ...data };

    if (data.currentLocation) {
        updateData.currentLocation = {
            type: "Point",
            coordinates: [data.currentLocation.lng, data.currentLocation.lat],
        };
    }

    delete updateData.config;
    const setup = buildStoreSetupStatus(mergeStoreForSetup(existingStore, updateData));
    updateData.isSetupComplete = setup.isComplete;
    updateData.setupMissingFields = setup.missingFields;
    updateData.setupCompletedAt = setup.isComplete ? (existingStore.setupCompletedAt || new Date()) : null;

    const store = await updateStoreDAO(id, updateData);

    if (store && data.config) {
        await updateStoreConfigDAO(store.type as StoreType, store._id as unknown as string, data.config);
    }

    return store;
};


export const toggleStoreStatusService = async (id: string, isOpen: boolean) => {
    return updateStoreDAO(id, { isOpen });
};

export const verifyStoreService = async (id: string, isVerified: boolean) => {
    return updateStoreDAO(id, { isVerified });
};


export const getNearbyStoresService = async (lng: number, lat: number, radiusKm: number, type?: StoreType, isOpen?: boolean) => {
    return getNearbyStoresDAO(lng, lat, radiusKm, type, isOpen);
};

export const getSellerStoresService = async (sellerId: string) => {
    console.log("sellerId", sellerId)
    return getStoresBySellerDAO(sellerId);
};

export const getStoreDetailsService = async (id: string) => {
    const store = await getStoreByIdDAO(id);
    if (!store) return null;

    const config = await getStoreConfigDAO(store.type as StoreType, store._id as unknown as string);

    return {
        ...store.toObject(),
        config
    };
};

