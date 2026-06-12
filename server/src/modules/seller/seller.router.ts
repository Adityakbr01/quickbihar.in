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
router.get("/policies", SellerController.policies);
router.get("/refund-policies", SellerController.refundPolicies);

router.get("/inventory", SellerController.inventory);
router.patch("/inventory/stock", SellerController.updateStock);
router.get("/inventory/movements", SellerController.inventoryMovements);

router.get("/orders", SellerController.orders);
router.get("/orders/:id", SellerController.orderDetails);
router.patch("/orders/:id/status", SellerController.updateOrderStatus);

router.get("/sub-orders", SellerController.listSubOrders);
router.get("/sub-orders/:id", SellerController.subOrderDetails);
router.patch("/sub-orders/:id/status", SellerController.updateSubOrderStatus);
router.post("/sub-orders/:id/cancellation-approval", SellerController.approveSubOrderCancellation);

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
router.patch("/size-charts/:id/assign-products", SellerController.assignSizeChartProducts);

router.get("/payouts", SellerController.payouts);
router.get("/reports", SellerController.reports);
router.get("/notifications", SellerController.notifications);
router.patch("/notifications/:id/read", SellerController.markNotificationRead);

router.get("/mall", SellerController.getMall);
router.post("/mall-request", SellerController.requestMallConnection);
router.post("/malls", upload.fields([{ name: "logo", maxCount: 1 }, { name: "coverImage", maxCount: 1 }, { name: "images", maxCount: 5 }]), SellerController.requestMallCreation);
router.patch("/malls/:id", upload.fields([{ name: "logo", maxCount: 1 }, { name: "coverImage", maxCount: 1 }, { name: "images", maxCount: 5 }]), SellerController.updateMall);
router.delete("/malls/:id", SellerController.deleteMall);
router.post("/payout-methods", SellerController.addPayoutMethod);
router.patch("/payout-methods/:methodId/default", SellerController.setDefaultPayoutMethod);
router.post("/payout-requests", SellerController.createPayoutRequest);

export default router;
