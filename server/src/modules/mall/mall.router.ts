import { Router } from "express";
import { MallController } from "./mall.controller";
import { verifyJWT } from "../../middlewares/auth.middleware";

const router = Router();

router.get("/", MallController.listPublic);
router.get("/top", MallController.top);
router.get("/:id", MallController.getDetail);
router.post("/:id/reviews", verifyJWT, MallController.postReview);

export default router;
