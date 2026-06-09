import { Router } from "express";
import { MallController } from "./mall.controller";

const router = Router();

router.get("/", MallController.listPublic);
router.get("/top", MallController.top);

export default router;
