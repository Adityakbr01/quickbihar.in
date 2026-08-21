import { createServer } from "http";
import { app } from "./app";
import connectDB from "./config/db";
import { ENV } from "./config/env.config";
import { socketService } from "./modules/common/socket/socket.service";
import { seedRbac, seedAdmin, seedAppConfig, seedRefundPolicies, seedSizeCharts, syncProductVerticals } from "./seed/seed";
import * as matchingService from "./modules/common/delivery/matching.service";
import { startNotificationWorker } from "./modules/common/notification/notification.worker";

const port = ENV.PORT;
const httpServer = createServer(app);

// Initialize Socket.io
socketService.init(httpServer);

connectDB()
  .then(async () => {
    // Seed RBAC, Admin, App Config & Policies on start
    await seedRbac();
    await seedAdmin();
    await seedAppConfig();
    await seedRefundPolicies();
    await seedSizeCharts();
    await syncProductVerticals();

    // Start background matching loop
    matchingService.start();

    // Start background notification worker
    startNotificationWorker();

    httpServer.listen(port, "0.0.0.0", () => {
      console.log(`🚀 Server and Sockets are running at http://0.0.0.0:${port}`);
    });
  })
  .catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
  });
