import { Router } from "express";
import { UserController } from "./user.controller";
import { verifyJWT } from "../../middlewares/auth.middleware";
import { upload } from "../../middlewares/multer.middleware";

const router = Router();

router.use(verifyJWT);

router.get("/profile", UserController.getProfile);
router.patch("/profile", UserController.updateProfile);
router.patch("/avatar", upload.single("avatar"), UserController.updateAvatar);

export default router;