import Redis from "ioredis"

const globalForRedis = global as unknown as { redis: Redis | undefined }

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  // Do NOT set username - use password-only auth like your CLI
}

export const redisClient =
  globalForRedis.redis ??
  new Redis(redisConfig)

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redisClient
