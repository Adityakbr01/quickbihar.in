import { Router } from "express";
import { verifyJWT, isSeller } from "../../middlewares/auth.middleware";
import { upload } from "../../middlewares/multer.middleware";
import { SellerController } from "./seller.controller";

const router = Router();

router.use(verifyJWT, isSeller);

router.get("/dashboard", SellerController.dashboard);
router.get("/setup-status", SellerController.setupStatus);

router.get("/store", SellerController.getStore);
router.put("/store", SellerController.saveStore);
router.patch("/store/open", SellerController.toggleStoreOpen);

router.get("/products", SellerController.listProducts);
router.post("/products", upload.array("images", 5), SellerController.createProduct);
router.patch("/products/:id/submit", SellerController.submitProduct);
router.patch("/products/:id", upload.array("images", 5), SellerController.updateProduct);
router.delete("/products/:id", SellerController.deleteProduct);

router.get("/categories", SellerController.categories);
router.post("/category-requests", SellerController.requestCategoryChange);

router.get("/inventory", SellerController.inventory);
router.patch("/inventory/stock", SellerController.updateStock);
router.get("/inventory/movements", SellerController.inventoryMovements);

router.get("/orders", SellerController.orders);
router.get("/orders/:id", SellerController.orderDetails);
router.patch("/orders/:id/status", SellerController.updateOrderStatus);

router.get("/coupons", SellerController.coupons);
router.post("/coupons", SellerController.createCoupon);
router.patch("/coupons/:id/submit", SellerController.submitCoupon);
router.patch("/coupons/:id", SellerController.updateCoupon);
router.delete("/coupons/:id", SellerController.deleteCoupon);

router.get("/customers", SellerController.customers);

router.get("/banners", SellerController.banners);
router.post("/banners", upload.single("image"), SellerController.createBanner);
router.patch("/banners/:id/submit", SellerController.submitBanner);
router.patch("/banners/:id", upload.single("image"), SellerController.updateBanner);
router.delete("/banners/:id", SellerController.deleteBanner);

router.get("/size-charts", SellerController.sizeCharts);
router.post("/size-charts", SellerController.createSizeChart);
router.patch("/size-charts/:id/submit", SellerController.submitSizeChart);
router.patch("/size-charts/:id/assign-products", SellerController.assignSizeChartProducts);
router.patch("/size-charts/:id", SellerController.updateSizeChart);
router.delete("/size-charts/:id", SellerController.deleteSizeChart);

router.get("/payouts", SellerController.payouts);
router.get("/reports", SellerController.reports);
router.get("/notifications", SellerController.notifications);
router.patch("/notifications/:id/read", SellerController.markNotificationRead);

router.post("/mall-request", SellerController.requestMallConnection);
router.post("/malls", SellerController.requestMallCreation);
router.post("/payout-methods", SellerController.addPayoutMethod);
router.patch("/payout-methods/:methodId/default", SellerController.setDefaultPayoutMethod);
router.post("/payout-requests", SellerController.createPayoutRequest);

export default router;
