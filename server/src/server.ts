import connectDB from "./config/db";
import { app } from "./app";
import { ENV } from "./config/env.config";
import { seedAdmin } from "./utils/seed";

const port = ENV.PORT;

connectDB()
  .then(async () => {
    // Seed Admin on start
    await seedAdmin();

    app.listen(port, () => {
      console.log(`🚀 Server is running at port : ${port}`);
    });
  })
  .catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
  });
