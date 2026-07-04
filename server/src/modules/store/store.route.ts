import express from "express";
import { isSellerOrAdmin, checkPermissions as requirePermission, verifyJWT } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { PERMISSIONS } from "../rbac/rbac.constants";
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

// 🔐 PROTECTED ROUTES (Seller/Admin)
router.get("/:id", (req, res, next) => {
    if (/^[0-9a-fA-F]{24}$/.test(req.params.id || "")) {
        return getStoreController(req, res, next);
    }
    return next("route");
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

router.get(
    "/my-stores",
    requirePermission([PERMISSIONS.VIEW_STORE.code]),
    getSellerStoresController
);

// 🟢 PUBLIC ROUTES (Must be at the bottom to avoid catching specific routes like /my-stores)
export default router;
