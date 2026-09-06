import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { errorHandler } from "./middlewares/error.middleware";
import { ENV } from "./config/env.config";
import { loggerMiddleware } from "./middlewares/logger.middleware";
import { responseExtensions } from "./middlewares/responseExtensions.middleware";

const app = express();

// Security headers — applied before the request logger so the body dump gate
// stays effective. CSP is intentionally permissive for now (server returns
// only JSON; any UI CSP belongs to the web/mobile apps).
app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  })
);

app.use(loggerMiddleware);

const productionDomains = [
  "https://quickbihar.in",
  "https://www.quickbihar.in",
  "https://dashboard.quickbihar.in",
];

const envCors = Array.isArray(ENV.CORS_ORIGIN)
  ? ENV.CORS_ORIGIN
  : (ENV.CORS_ORIGIN || "").split(",").map((s) => s.trim());

const allowedCorsOrigins = Array.from(
  new Set([...productionDomains, ...envCors])
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedCorsOrigins.includes("*") || allowedCorsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS origin not allowed: ${origin}`));
    },
    credentials: true,
  })
);

app.use(cookieParser());

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));

// Registers res.ok / res.created / res.nocontent helpers for standardized responses
app.use(responseExtensions);

// Routes Import
import authRouter from "./modules/common/auth/auth.router";
import bannerRouter from "./modules/common/banner/banner.router";
import categoryRouter from "./modules/common/category/category.router";
import productRouter from "./modules/clothing/products/product.router";
import sizeChartRouter from "./modules/clothing/sizeChart/sizeChart.router";
import couponRouter from "./modules/common/coupon/coupon.router";
import orderRouter from "./modules/common/order/order.router";
import labelRouter from "./modules/common/label/label.router";
import userRouter from "./modules/common/user/user.router";
import addressRouter from "./modules/common/savedAddress/savedAddresses.router";
import paymentMethodRouter from "./modules/common/paymentMethod/paymentMethod.router";
import cartRouter from "./modules/common/cart/cart.router";
import wishlistRouter from "./modules/common/wishlist/wishlist.router";
import appConfigRouter from "./modules/common/appConfig/appConfig.router";
import refundPolicyRouter from "./modules/common/refundPolicy/refundPolicy.router";
import { rbacRoutes as rbacRouter } from "./modules/common/rbac/rbac.routes";
import onboardingRouter from "./modules/common/onboarding/onboarding.router";
import storeRouter from "./modules/common/store/store.route";
import adminRouter from "./modules/common/admin/admin.router";
import sellerRouter from "./modules/common/seller/seller.router";
import mallRouter from "./modules/common/mall/mall.router";
import deliveryRouter from "./modules/common/delivery/delivery.router";
import fulfillmentEventRouter from "./modules/common/fulfillment/fulfillmentEvent.router";
import notificationRouter from "./modules/common/notification/notification.router";
import { ApiResponse } from "./utils/ApiResponse";

// Routes Declaration
app.use("/api/v1/auth", authRouter); // working
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/sellers", sellerRouter);
app.use("/api/v1/malls", mallRouter);
app.use("/api/v1/delivery", deliveryRouter);
app.use("/api/v1/events", fulfillmentEventRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/onboarding", onboardingRouter); // working
app.use("/api/v1/stores", storeRouter);  // working
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/rbac", rbacRouter);



app.use("/api/v1/banners", bannerRouter);

app.use("/api/v1/products", productRouter);
app.use("/api/v1/size-charts", sizeChartRouter);
app.use("/api/v1/coupons", couponRouter);
app.use("/api/v1/addresses", addressRouter);
// not tested
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/labels", labelRouter);
app.use("/api/v1/payment-methods", paymentMethodRouter);
app.use("/api/v1/cart", cartRouter);
app.use("/api/v1/wishlist", wishlistRouter);
app.use("/api/v1/app-config", appConfigRouter);
app.use("/api/v1/refund-policies", refundPolicyRouter);




app.get(["/", "/api", "/api/", "/api/v1", "/api/v1/"], (req, res) => {
  const ip = req.headers["x-forwarded-for"]?.toString() || req.ip || "Unknown";
  const publicIp = ip.replace("::ffff:", "");
  return res.status(200).json(new ApiResponse(200, { ip: publicIp, status: "healthy", version: "v1" }, "QuickBihar API Server is running"));
});

app.get(["/health", "/api/health", "/api/v1/health"], (req, res) => {
  return res.status(200).json(new ApiResponse(200, { status: "healthy" }, "Server is running"));
});

// Global Error Handler
app.use(errorHandler);

export { app };
