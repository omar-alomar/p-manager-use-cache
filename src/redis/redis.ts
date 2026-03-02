// src/redis/redis.ts  (or wherever you keep it)
// ioredis is externalized in webpack config to avoid bundling during build
import type Redis from "ioredis";

const isBuild =
  process.env.SKIP_REDIS === "1" ||
  process.env.NEXT_PHASE === "phase-production-build";

let client: Redis | null = null;
let RedisClass: typeof Redis | null = null;

function loadRedis(): typeof Redis | null {
  if (typeof window !== 'undefined') return null; // Client-side check
  if (RedisClass) return RedisClass;
  
  try {
    // Dynamic require to avoid bundling - webpack will externalize this
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    RedisClass = require("ioredis");
    return RedisClass;
  } catch (e) {
    console.error("Failed to load ioredis:", e);
    return null;
  }
}

export function getRedis(): Redis | null {
  if (isBuild) return null;

  if (!client) {
    const RedisConstructor = loadRedis();
    if (!RedisConstructor) return null;

    // Prefer REDIS_URL (e.g., redis://:pass@redis:6379/0)
    const url = process.env.REDIS_URL;
    if (url) {
      client = new RedisConstructor(url, {
        maxRetriesPerRequest: 0,
        enableReadyCheck: false,
        reconnectOnError: () => false,
      });
    } else {
      // Fallback to host/port with a safe default host for Docker
      const host = process.env.REDIS_HOST || "redis";
      const port = Number(process.env.REDIS_PORT || 6379);
      const password = process.env.REDIS_PASSWORD;
      
      // Use environment-specific Redis database to prevent collisions
      const getRedisDb = () => {
        const env = process.env.NODE_ENV || 'development';
        // Handle custom environment names like 'staging'
        if (env === 'production') return 0;
        if (env.includes('staging')) return 1;
        if (env === 'development') return 2;
        return 2; // default fallback
      };
      
      client = new RedisConstructor({ 
        host, 
        port, 
        password, 
        db: getRedisDb(), // Environment-specific database
        maxRetriesPerRequest: 0, 
        enableReadyCheck: false 
      });
    }
  }
  return client;
}
