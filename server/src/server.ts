import connectDB from "./config/db";
import { app } from "./app";
import { ENV } from "./config/env.config";
import { seedAdmin, seedSizeCharts, seedRefundPolicies } from "./utils/seed";

const port = ENV.PORT;

connectDB()
  .then(async () => {
    // Seed data on start
    await seedAdmin();
    await seedSizeCharts();
    await seedRefundPolicies();

    app.listen(port, () => {
      console.log(`🚀 Server is running at port : ${port}`);
    });
  })
  .catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
  });
