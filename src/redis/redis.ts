// src/redis/redis.ts  (or wherever you keep it)
import Redis from "ioredis";

const isBuild =
  process.env.SKIP_REDIS === "1" ||
  process.env.NEXT_PHASE === "phase-production-build";

let client: Redis | null = null;

export function getRedis(): Redis | null {
  if (isBuild) return null;

  if (!client) {
    // Prefer REDIS_URL (e.g., redis://:pass@redis:6379/0)
    const url = process.env.REDIS_URL;
    if (url) {
      client = new Redis(url, {
        maxRetriesPerRequest: 0,
        enableReadyCheck: false,
        reconnectOnError: () => false,
      });
    } else {
      // Fallback to host/port with a safe default host for Docker
      const host = process.env.REDIS_HOST || "redis";
      const port = Number(process.env.REDIS_PORT || 6379);
      const password = process.env.REDIS_PASSWORD;
      client = new Redis({ host, port, password, maxRetriesPerRequest: 0, enableReadyCheck: false });
    }
  }
  return client;
}
