import { isMaintenanceMode } from "@/redis/maintenance"
import { getCurrentUser } from "@/auth/currentUser"
import { Role } from "@prisma/client"

/**
 * Returns true if the site is in maintenance mode and the current user
 * is not an admin. Call at the top of mutation server actions to block
 * writes during maintenance.
 */
export async function isBlocked(): Promise<boolean> {
  const maintenance = await isMaintenanceMode()
  if (!maintenance) return false

  const user = await getCurrentUser()
  return !user || user.role !== Role.admin
}
