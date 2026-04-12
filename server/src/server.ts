import connectDB from "./config/db";
import { app } from "./app";
import { ENV } from "./config/env.config";

const port = ENV.PORT;

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`\n 🚀 Server is running at port : ${port}`);
    });
  })
  .catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
  });
