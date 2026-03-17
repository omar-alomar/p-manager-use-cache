"use server"

import { createProject, deleteProject, updateProject, getProject, updateProjectField, addMilestone, setProjectArchived } from "@/db/projects"
import { revalidatePath } from "next/cache"
import { getProjects } from "@/db/projects"
import { redirect } from "next/navigation"
import { parseProjectFormData, milestoneSchema } from "@/schemas/schemas"
import type { ActionResult } from "@/types"
import { isBlocked } from "@/utils/maintenance"
import { getCurrentUser } from "@/auth/currentUser"
import prisma from "@/db/db"
import { notificationService } from "@/services/notificationService"

const MAINTENANCE_MSG = "Site is under maintenance. Please try again later."

export async function createProjectAction(prevState: unknown, formData: FormData) {
  if (await isBlocked()) return { success: false, message: MAINTENANCE_MSG }

  const result = parseProjectFormData(formData)

  if (!result.success) {
    const errors: Record<string, string> = {}
    result.error.issues.forEach(issue => {
      if (issue.path[0]) errors[issue.path[0] as string] = issue.message
    })
    return errors
  }

  const data = result.data

  const project = await createProject(data)

  // Notify the assigned manager if different from current user
  const currentUser = await getCurrentUser()
  if (currentUser && data.userId !== currentUser.id) {
    const [assignedUser, assigner] = await Promise.all([
      prisma.user.findUnique({ where: { id: data.userId }, select: { name: true } }),
      prisma.user.findUnique({ where: { id: currentUser.id }, select: { name: true } }),
    ])
    if (assignedUser && assigner) {
      await notificationService.notifyProjectAssigned({
        projectId: project.id,
        projectTitle: project.title,
        assignedUserId: data.userId,
        assignedUserName: assignedUser.name,
        assignerUserId: currentUser.id,
        assignerUserName: assigner.name,
      })
    }
  }

  return { success: true, message: 'Project created successfully', redirectTo: `/projects/${project.id}` }
}

export async function editProjectAction(
  projectId: number,
  prevState: unknown,
  formData: FormData
) {
  if (await isBlocked()) return { success: false, message: MAINTENANCE_MSG }

  const result = parseProjectFormData(formData)

  if (!result.success) {
    const errors: Record<string, string> = {}
    result.error.issues.forEach(issue => {
      if (issue.path[0]) errors[issue.path[0] as string] = issue.message
    })
    return errors
  }

  const data = result.data

  // Check if manager is changing
  const oldProject = await getProject(projectId)
  const project = await updateProject(projectId, data)

  // Notify the new manager if they changed
  if (oldProject && oldProject.userId !== data.userId) {
    const currentUser = await getCurrentUser()
    if (currentUser && data.userId !== currentUser.id) {
      const [assignedUser, assigner] = await Promise.all([
        prisma.user.findUnique({ where: { id: data.userId }, select: { name: true } }),
        prisma.user.findUnique({ where: { id: currentUser.id }, select: { name: true } }),
      ])
      if (assignedUser && assigner) {
        await notificationService.notifyProjectAssigned({
          projectId: project.id,
          projectTitle: project.title,
          assignedUserId: data.userId,
          assignedUserName: assignedUser.name,
          assignerUserId: currentUser.id,
          assignerUserName: assigner.name,
        })
      }
    }
  }

  return { success: true, message: 'Project updated successfully', redirectTo: `/projects/${project.id}` }
}

export async function deleteProjectAction(projectId: number | string) {
  if (await isBlocked()) return { success: false, message: MAINTENANCE_MSG }

  await deleteProject(projectId)
  redirect("/projects")
}

export async function updateProjectFieldAction(
  projectId: number,
  field: 'body' | 'mbaNumber' | 'coFileNumbers' | 'dldReviewer' | 'propertyAddress',
  value: string
): Promise<ActionResult> {
  if (await isBlocked()) return { success: false, message: MAINTENANCE_MSG }

  await updateProjectField(projectId, field, value)

  revalidatePath('/projects')
  revalidatePath(`/projects/${projectId}`)

  return { success: true }
}

export async function getProjectsAction(options?: { includeArchived?: boolean }) {
  return getProjects(options ?? {})
}

export async function setProjectArchivedAction(projectId: number | string, archived: boolean): Promise<ActionResult> {
  if (await isBlocked()) return { success: false, message: MAINTENANCE_MSG }

  await setProjectArchived(projectId, archived)
  revalidatePath("/projects")
  revalidatePath(`/projects/${projectId}`)
  return { success: true }
}

export async function addMilestoneAction(
  projectId: number,
  prevState: unknown,
  formData: FormData
) {
  if (await isBlocked()) return { errors: { general: MAINTENANCE_MSG } }

  const result = milestoneSchema.safeParse({
    date: formData.get("date"),
    item: formData.get("item"),
    apfo: formData.get("apfo") === "on",
  })

  if (!result.success) {
    const errors: Record<string, string> = {}
    result.error.issues.forEach(issue => {
      if (issue.path[0]) errors[issue.path[0] as string] = issue.message
    })
    return { errors }
  }

  try {
    await addMilestone(projectId, {
      date: new Date(result.data.date),
      item: result.data.item,
      apfo: result.data.apfo,
    })

    return { success: true }
  } catch (error) {
    console.error("Error adding milestone:", error)
    return {
      errors: {
        general: "Failed to add milestone. Please try again."
      }
    }
  }
}
