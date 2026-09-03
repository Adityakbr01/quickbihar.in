/**
 * Migration 003 — drain OTP-related keys from Redis.
 *
 * Scans for `otp:*` and `otp_cooldown:*` keys and deletes them.
 * Idempotent: SCAN-based, no destructive write outside the targeted prefix.
 *
 * Run: bun run src/db/migrations/003-drain-redis-otp-keys.ts
 */
import { redis } from "../../config/redis.config";

const PATTERNS = ["otp:*", "otp_cooldown:*"];

async function drainPattern(pattern: string) {
  let cursor = "0";
  let deleted = 0;
  do {
    const [next, batch] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 200);
    cursor = next;
    if (batch.length > 0) {
      deleted += await redis.del(...batch);
    }
  } while (cursor !== "0");
  return deleted;
}

async function main() {
  let total = 0;
  for (const p of PATTERNS) {
    const n = await drainPattern(p);
    console.log(`Migration 003: drained ${n} keys matching ${p}`);
    total += n;
  }
  console.log(`Migration 003 complete: total ${total} keys deleted`);
  await redis.quit();
}

main().catch(async (err) => {
  console.error("Migration 003 failed:", err);
  await redis.quit().catch(() => {});
  process.exit(1);
});