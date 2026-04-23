import { Redis } from "ioredis";
import { ENV } from "./env.config";

const redis = new Redis(ENV.REDIS_URL, {
  maxRetriesPerRequest: null,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on("connect", () => {
  console.log("🚀 Redis Connected Successfully");
});

redis.on("error", (err) => {
  console.error("❌ Redis Connection Error:", err);
});

export { redis };