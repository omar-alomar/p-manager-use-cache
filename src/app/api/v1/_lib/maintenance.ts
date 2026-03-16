import { isMaintenanceMode } from "@/redis/maintenance"
import { jsonMaintenance } from "./responses"
import type { SessionUser } from "./auth"

/**
 * Check if maintenance mode is active and the user is not an admin.
 * Returns a 503 response if blocked, or null if the request can proceed.
 */
export async function checkMaintenance(user: SessionUser): Promise<Response | null> {
  const maintenance = await isMaintenanceMode()
  if (!maintenance) return null
  if (user.role === "admin") return null
  return jsonMaintenance()
}
