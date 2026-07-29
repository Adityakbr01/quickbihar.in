import { Router } from "express";
import * as mallController from "./mall.controller";
import { verifyJWT } from "@/middlewares/auth.middleware";

const router = Router();

router.get("/", mallController.listPublic);
router.get("/top", mallController.top);
router.get("/:id", mallController.getDetail);
router.post("/:id/reviews", verifyJWT, mallController.postReview);

export default router;
