import { Queue } from "bullmq";
import Redis from "ioredis";
import { ENV } from "../../config/env.config";

// Dedicated connection for the Queue client
export const queueConnection = new Redis(ENV.REDIS_URL, {
  maxRetriesPerRequest: null,
});

queueConnection.on("error", (err) => {
  console.error("❌ BullMQ Queue Redis Connection Error:", err);
});

export const notificationQueue = new Queue("notification-queue", {
  connection: queueConnection,
});
