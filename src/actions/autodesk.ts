"use server"

import { getCurrentUser } from "@/auth/currentUser"
import { linkAccProject, unlinkAccProject, bulkLinkAccProjects } from "@/db/autodesk"
import { revalidatePath } from "next/cache"
import { isMaintenanceMode } from "@/redis/maintenance"
import type { ActionResult } from "@/types"

const MAINTENANCE_MSG = "System is under maintenance. Please try again later."

export async function linkAccProjectAction(
  projectId: number,
  accHubId: string,
  accHubName: string,
  accProjectId: string,
  accProjectName: string
): Promise<ActionResult> {
  if (await isMaintenanceMode()) return { success: false, message: MAINTENANCE_MSG }
  const user = await getCurrentUser()
  if (!user) return { success: false, message: "Not authenticated" }

  try {
    await linkAccProject({
      projectId,
      accHubId,
      accHubName,
      accProjectId,
      accProjectName,
      linkedByUserId: user.id,
    })
  } catch (error) {
    // Unique constraint violation = already linked
    if (String(error).includes("Unique constraint")) {
      return { success: false, message: "This ACC project is already linked" }
    }
    throw error
  }

  revalidatePath(`/projects/${projectId}`)
  return { success: true }
}

export async function unlinkAccProjectAction(linkId: number, projectId: number): Promise<ActionResult> {
  if (await isMaintenanceMode()) return { success: false, message: MAINTENANCE_MSG }
  const user = await getCurrentUser()
  if (!user) return { success: false, message: "Not authenticated" }

  await unlinkAccProject(linkId)

  revalidatePath(`/projects/${projectId}`)
  return { success: true }
}

export async function bulkLinkAccProjectsAction(
  links: {
    projectId: number
    accHubId: string
    accHubName: string
    accProjectId: string
    accProjectName: string
  }[]
): Promise<ActionResult> {
  if (await isMaintenanceMode()) return { success: false, message: MAINTENANCE_MSG }
  const user = await getCurrentUser()
  if (!user) return { success: false, message: "Not authenticated" }
  if (user.role !== "admin") return { success: false, message: "Admin access required" }

  await bulkLinkAccProjects(
    links.map((l) => ({ ...l, linkedByUserId: user.id }))
  )

  // Revalidate all affected project pages
  const projectIds = [...new Set(links.map((l) => l.projectId))]
  for (const pid of projectIds) {
    revalidatePath(`/projects/${pid}`)
  }
  revalidatePath("/projects")

  return { success: true }
}
