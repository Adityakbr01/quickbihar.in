import { Router } from "express";
import { SavedAddressController } from "./savedAddresses.controller";
import { verifyJWT } from "../../middlewares/auth.middleware";

const router = Router();

router.use(verifyJWT);

router.post("/", SavedAddressController.createAddress);
router.get("/", SavedAddressController.getMyAddresses);
router.patch("/:id", SavedAddressController.updateAddress);
router.delete("/:id", SavedAddressController.deleteAddress);
router.patch("/:id/default", SavedAddressController.setDefaultAddress);

export default router;