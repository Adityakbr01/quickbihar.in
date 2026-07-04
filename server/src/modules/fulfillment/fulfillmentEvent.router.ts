import { Router } from "express";
import { verifyJWT } from "../../middlewares/auth.middleware";
import * as fulfillmentEventController from "./fulfillmentEvent.controller";

const router = Router();

router.use(verifyJWT);
router.get("/", fulfillmentEventController.listMine);

export default router;
