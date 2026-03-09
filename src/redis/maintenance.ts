import { getRedis } from "./redis"

const MAINTENANCE_KEY = "maintenance:enabled"

export async function isMaintenanceMode(): Promise<boolean> {
  const redis = getRedis()
  if (!redis) return false

  try {
    const value = await redis.get(MAINTENANCE_KEY)
    return value === "1"
  } catch {
    return false
  }
}

export async function setMaintenanceMode(enabled: boolean): Promise<void> {
  const redis = getRedis()
  if (!redis) return

  if (enabled) {
    await redis.set(MAINTENANCE_KEY, "1")
  } else {
    await redis.del(MAINTENANCE_KEY)
  }
}
