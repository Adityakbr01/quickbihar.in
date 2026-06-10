import { Router } from "express";
import { verifyJWT } from "../../middlewares/auth.middleware";
import { FulfillmentEventController } from "./fulfillmentEvent.controller";

const router = Router();

router.use(verifyJWT);
router.get("/", FulfillmentEventController.listMine);

export default router;
