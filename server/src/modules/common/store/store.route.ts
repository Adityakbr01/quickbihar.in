import express from "express";
import { ApiError } from "@/utils/ApiError";
import { isSellerOrAdmin, checkPermissions as requirePermission, verifyJWT } from "@/middlewares/auth.middleware";
import { validate } from "@/middlewares/validate.middleware";
import { PERMISSIONS } from "@/modules/common/rbac/rbac.constants";
import {
    checkServiceabilityController,
    createStoreController,
    getNearbyStoresController,
    getSellerStoresController,
    getStoreController,
    toggleStoreStatusController,
    updateStoreController,
    verifyStoreController
} from "./store.controller";
import {
    checkServiceabilitySchema,
    createStoreSchema,
    searchNearbyStoresSchema,
    toggleStoreStatusSchema,
    updateStoreSchema,
    verifyStoreSchema
} from "./store.schema";

const router = express.Router();

// 🟢 PUBLIC ROUTES
router.get(
    "/nearby",
    validate(searchNearbyStoresSchema, "query"),
    getNearbyStoresController
);

router.get(
    "/serviceability",
    validate(checkServiceabilitySchema, "query"),
    checkServiceabilityController
);

// 🔐 SELLER ROUTE — must be registered BEFORE "/:id" (Express matches in order;
// "/:id" would otherwise swallow "my-stores" and 404 on the ObjectId regex).
// Plan §26 A8 fix for the previously unreachable handler.
router.get(
    "/my-stores",
    verifyJWT,
    isSellerOrAdmin,
    requirePermission([PERMISSIONS.VIEW_STORE.code]),
    getSellerStoresController
);

// 🔐 PROTECTED ROUTES (Seller/Admin)
router.get("/:id", (req, res, next) => {
    if (/^[0-9a-fA-F]{24}$/.test(req.params.id || "")) {
        return getStoreController(req, res, next);
    }
    throw new ApiError(404, "Store not found");
});

router.use(verifyJWT);
router.use(isSellerOrAdmin)


router.post(
    "/",
    requirePermission([PERMISSIONS.CREATE_STORE.code]),
    validate(createStoreSchema),
    createStoreController
);

router.patch(
    "/:id",
    requirePermission([PERMISSIONS.UPDATE_STORE.code]),
    validate(updateStoreSchema),
    updateStoreController
);

router.patch(
    "/:id/status",
    requirePermission([PERMISSIONS.UPDATE_STORE_STATUS.code]),
    validate(toggleStoreStatusSchema),
    toggleStoreStatusController
);

router.patch(
    "/:id/verify",
    requirePermission([PERMISSIONS.VERIFY_STORE.code]),
    validate(verifyStoreSchema),
    verifyStoreController
);

// 🟢 PUBLIC ROUTES (Must be at the bottom to avoid catching specific routes like /my-stores)
export default router;
