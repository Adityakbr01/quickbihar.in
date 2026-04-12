import { Router } from "express";
import { CategoryController } from "./category.controller";
import { verifyJWT, isAdmin } from "../../middlewares/auth.middleware";
import { upload } from "../../middlewares/multer.middleware";

const router = Router();

// Public routes
router.get("/public", CategoryController.getAllCategories);
router.get("/:id", CategoryController.getCategoryById);

// Admin routes (JWT + Admin role check)
router.use(verifyJWT, isAdmin);

router.get("/", CategoryController.getAllCategoriesAdmin);
router.post("/", upload.single("image"), CategoryController.createCategory);
router.patch("/:id", upload.single("image"), CategoryController.updateCategory);
router.delete("/:id", CategoryController.deleteCategory);

export default router;
