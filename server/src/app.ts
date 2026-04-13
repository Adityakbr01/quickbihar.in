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
import sizeChartRouter from "./modules/sizeChart/sizeChart.router";

// Routes Declaration
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/banners", bannerRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/size-charts", sizeChartRouter);

// Global Error Handler
app.use(errorHandler);

export { app };
