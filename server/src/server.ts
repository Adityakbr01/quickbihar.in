import { createServer } from "http";
import connectDB from "./config/db";
import { app } from "./app";
import { ENV } from "./config/env.config";
import { seedAdmin, seedUsers, seedSizeCharts, seedRefundPolicies, seedAppConfig } from "./utils/seed";
import { socketService } from "./modules/socket/socket.service";

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

    httpServer.listen(port, () => {
      console.log(`🚀 Server and Sockets are running at port : ${port}`);
    });
  })
  .catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
  });
