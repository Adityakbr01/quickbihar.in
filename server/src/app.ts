import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middlewares/error.middleware";
import { ENV } from "./config/env.config";
import { loggerMiddleware } from "./middlewares/logger.middleware";

const app = express();

app.use(loggerMiddleware);



app.use(
  cors({
    origin: ENV.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(cookieParser());

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));

// Routes Import
import authRouter from "./modules/auth/auth.router";
import bannerRouter from "./modules/banner/banner.router";
import categoryRouter from "./modules/category/category.router";
import productRouter from "./modules/products/product.router";
import sizeChartRouter from "./modules/sizeChart/sizeChart.router";
import couponRouter from "./modules/coupon/coupon.router";
import orderRouter from "./modules/order/order.router";
import labelRouter from "./modules/label/label.router";
import userRouter from "./modules/user/user.router";
import addressRouter from "./modules/savedAddress/savedAddresses.router";
import paymentMethodRouter from "./modules/paymentMethod/paymentMethod.router";
import cartRouter from "./modules/cart/cart.router";
import wishlistRouter from "./modules/wishlist/wishlist.router";
import appConfigRouter from "./modules/appConfig/appConfig.router";
import refundPolicyRouter from "./modules/refundPolicy/refundPolicy.router";
import { rbacRoutes as rbacRouter } from "./modules/rbac/rbac.routes";
import onboardingRouter from "./modules/onboarding/onboarding.router";
import storeRouter from "./modules/store/store.route";

// Routes Declaration
app.use("/api/v1/auth", authRouter); // working
app.use("/api/v1/onboarding", onboardingRouter); // working
app.use("/api/v1/stores", storeRouter);  // working
app.use("/api/v1/users", userRouter);
app.use("/api/v1/rbac", rbacRouter);



app.use("/api/v1/banners", bannerRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/size-charts", sizeChartRouter);
app.use("/api/v1/coupons", couponRouter);
app.use("/api/v1/addresses", addressRouter);
// not tested
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/labels", labelRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/payment-methods", paymentMethodRouter);
app.use("/api/v1/cart", cartRouter);
app.use("/api/v1/wishlist", wishlistRouter);
app.use("/api/v1/app-config", appConfigRouter);
app.use("/api/v1/refund-policies", refundPolicyRouter);


// Global Error Handler
app.use(errorHandler);

export { app };
