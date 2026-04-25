// category.route.ts
import express from "express";
import {
    createCategoryController,
    getCategoryTreeController,
    getCategoriesController,
    createAttributeController,
    getAttributesController,
    updateCategoryController,
    updateAttributeController
} from "./category.controller";

import { verifyJWT, checkPermissions } from "../../middlewares/auth.middleware";
import { PERMISSIONS } from "../rbac/rbac.constants";
import { validate } from "../../middlewares/validate.middleware";
import { createCategorySchema, createAttributeSchema, updateCategorySchema, updateAttributeSchema } from "./category.schema";
import { upload } from "../../middlewares/multer.middleware";


const router = express.Router();

// 🟢 PUBLIC
router.get("/", getCategoriesController);
router.get("/tree", getCategoryTreeController);
router.get("/:categoryId/attributes", getAttributesController);


// 🔐 ADMIN ONLY
router.use(verifyJWT);

router.post(
    "/",
    checkPermissions([PERMISSIONS.CREATE_CATEGORY.code]),
    upload.single("image"),
    validate(createCategorySchema),
    createCategoryController
);


router.post(
    "/attribute",
    checkPermissions([PERMISSIONS.CREATE_ATTRIBUTE.code]),
    validate(createAttributeSchema),
    createAttributeController
);

router.put(
    "/:categoryId",
    checkPermissions([PERMISSIONS.UPDATE_CATEGORY.code]),
    upload.single("image"),
    validate(updateCategorySchema),
    updateCategoryController
);

router.put(
    "/attribute/:attributeId",
    checkPermissions([PERMISSIONS.UPDATE_ATTRIBUTE.code]),
    validate(updateAttributeSchema),
    updateAttributeController
);

export default router;