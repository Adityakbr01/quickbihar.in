import { Router } from "express";
import { BannerController } from "./banner.controller";
import { verifyJWT, isAdmin } from "../../middlewares/auth.middleware";
import { upload } from "../../middlewares/multer.middleware";

const router = Router();

// Public routes
router.get("/", BannerController.getPublicBanners);
router.post("/:id/click", BannerController.trackClick);

// Admin routes (JWT + Admin role check)
router.use(verifyJWT, isAdmin);

router.get("/all", BannerController.getAllBanners);
router.get("/:id", BannerController.getBannerById);
router.post("/", upload.single("image"), BannerController.createBanner);
router.patch("/:id", upload.single("image"), BannerController.updateBanner);
router.delete("/:id", BannerController.deleteBanner);

export default router;
