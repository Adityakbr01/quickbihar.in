import { createServer } from "http";
import { app } from "./app";
import connectDB from "./config/db";
import { ENV } from "./config/env.config";
import { socketService } from "./modules/socket/socket.service";
import { seedRbac } from "./utils/seed";

const port = ENV.PORT;
const httpServer = createServer(app);

// Initialize Socket.io
socketService.init(httpServer);

connectDB()
  .then(async () => {
    // Seed data on start
    // await seedAdmin();
    // await seedUsers();
    // await seedSizeCharts();
    // await seedRefundPolicies();
    // await seedAppConfig();
    // await seedRbac();


    httpServer.listen(port, () => {
      console.log(`🚀 Server and Sockets are running at port : ${port}`);
    });
  })
  .catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
  });
