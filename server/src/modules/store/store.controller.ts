import type { Request, Response } from "express";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import type { StoreType } from "./store.schema";
import {
    createStoreService,
    getNearbyStoresService,
    getSellerStoresService,
    getStoreDetailsService,
    toggleStoreStatusService,
    updateStoreService,
    verifyStoreService
} from "./store.service";
import type {
    CreateStoreInput,
    SearchNearbyStoresInput,
    UpdateStoreInput
} from "./store.types";

export const createStoreController = asyncHandler(async (req: Request, res: Response) => {
    const data = req.body as CreateStoreInput;
    const store = await createStoreService(data, (req as any).user._id);
    res.status(201).json(new ApiResponse(201, store, "Store created successfully"));
});

export const updateStoreController = asyncHandler(async (req: Request, res: Response) => {
    const data = req.body as UpdateStoreInput;
    const store = await updateStoreService(req.params.id as unknown as string, data);
    res.status(200).json(new ApiResponse(200, store, "Store updated successfully"));
});

export const getNearbyStoresController = asyncHandler(async (req: Request, res: Response) => {
    const data = req.query as unknown as SearchNearbyStoresInput;
    const stores = await getNearbyStoresService(data.lng as number, data.lat as number, data.radius as number, data.type as StoreType, data.isOpen as boolean);
    res.status(200).json(new ApiResponse(200, stores, "Nearby stores fetched successfully"));
});

export const getSellerStoresController = asyncHandler(async (req: Request, res: Response) => {
    const stores = await getSellerStoresService((req as any).user._id);
    res.status(200).json(new ApiResponse(200, stores, "Seller stores fetched successfully"));
});

export const getStoreController = asyncHandler(async (req: Request, res: Response) => {
    const store = await getStoreDetailsService(req.params.id as unknown as string);
    if (!store) return res.status(404).json(new ApiResponse(404, null, "Store not found"));
    res.status(200).json(new ApiResponse(200, store, "Store details fetched successfully"));
});

export const toggleStoreStatusController = asyncHandler(async (req: Request, res: Response) => {
    const data = req.body as { isOpen: boolean };
    const store = await toggleStoreStatusService(req.params.id as unknown as string, data.isOpen);
    res.status(200).json(new ApiResponse(200, store, `Store ${data.isOpen ? "opened" : "closed"} successfully`));
});

export const verifyStoreController = asyncHandler(async (req: Request, res: Response) => {
    const data = req.body as { isVerified: boolean };
    const store = await verifyStoreService(req.params.id as unknown as string, data.isVerified);
    res.status(200).json(new ApiResponse(200, store, `Store ${data.isVerified ? "verified" : "unverified"} successfully`));
});