"use server"

import { createTask, deleteTask, updateTask, getTask } from "@/db/tasks"
import prisma from "@/db/db"
import { notificationService } from "@/services/notificationService"
import { getCurrentUser } from "@/auth/currentUser"
import { revalidateTaskPaths } from "@/utils/revalidate"
import { parseTaskFormData } from "@/schemas/schemas"
import type { ActionResult } from "@/types"
import { isBlocked } from "@/utils/maintenance"

const MAINTENANCE_MSG = "Site is under maintenance. Please try again later."


export async function createTaskAction(prevState: unknown, formData: FormData) {
  if (await isBlocked()) return { success: false, message: MAINTENANCE_MSG }

  const result = parseTaskFormData(formData)

  if (!result.success) {
    const errors: Record<string, string> = {}
    result.error.issues.forEach(issue => {
      if (issue.path[0]) errors[issue.path[0] as string] = issue.message
    })
    return errors
  }

  const data = result.data

  try {
    const currentUser = await getCurrentUser()
    const task = await createTask({
      ...data,
      assignedById: currentUser?.id
    })

    // Get user and project details for notification
    const [assignedUser, project, assignerUser] = await Promise.all([
      prisma.user.findUnique({ where: { id: data.userId } }),
      data.projectId ? prisma.project.findUnique({ where: { id: data.projectId } }) : null,
      currentUser ? prisma.user.findUnique({ where: { id: currentUser.id } }) : null,
    ])

    // Send notification for task assignment
    if (assignedUser && assignerUser) {
      await notificationService.notifyTaskAssigned({
        taskId: task.id,
        taskTitle: task.title,
        assignedUserId: assignedUser.id,
        assignedUserName: assignedUser.name,
        assignerUserId: assignerUser.id,
        assignerUserName: assignerUser.name,
        projectId: project?.id,
        projectTitle: project?.title,
      })
    }

    revalidateTaskPaths({ projectId: data.projectId })

    // Return success state instead of redirecting
    return { success: true, message: 'Task created successfully!', taskId: task.id }
  } catch (error) {
    console.error('Failed to create task:', error)
    return { success: false, message: 'Failed to create task. Please try again.' }
  }
}

export async function editTaskAction(
  taskId: number,
  prevState: unknown,
  formData: FormData
) {
  if (await isBlocked()) return { success: false, message: MAINTENANCE_MSG }

  const result = parseTaskFormData(formData)

  if (!result.success) {
    const errors: Record<string, string> = {}
    result.error.issues.forEach(issue => {
      if (issue.path[0]) errors[issue.path[0] as string] = issue.message
    })
    return errors
  }

  const data = result.data

  try {
    // Check if completion status changed to set completedAt
    const originalTask = await prisma.task.findUnique({ where: { id: taskId } })
    const completedAt = data.completed
      ? (originalTask?.completed ? originalTask.completedAt : new Date())
      : null

    const task = await updateTask(taskId, { ...data, completedAt })

    revalidateTaskPaths({ projectId: data.projectId, taskId })

    // Return success state instead of redirecting
    return { success: true, message: 'Task updated successfully!', taskId: task.id }
  } catch {
    return { success: false, message: 'Failed to update task. Please try again.' }
  }
}

export async function deleteTaskAction(taskId: number | string) {
  if (await isBlocked()) return { success: false, message: MAINTENANCE_MSG }

  try {
    const task = await getTask(taskId)
    if (!task) {
      return { success: false, message: 'Task not found' }
    }

    await deleteTask(taskId)

    revalidateTaskPaths({ projectId: task.projectId })

    return { success: true, message: 'Task deleted successfully', redirectTo: "/tasks" }
  } catch (error) {
    console.error('Error deleting task:', error)
    return { success: false, message: 'Failed to delete task' }
  }
}


// Update task completion status (for checkbox toggle)
export async function updateTaskCompletionAction(
  taskId: number,
  data: {
    title: string
    completed: boolean
    urgency?: string | null
    userId: number
    projectId?: number
  }
) {
  if (await isBlocked()) throw new Error(MAINTENANCE_MSG)

  try {
    // Get the original task to check if completion status changed and get the original assigner
    const originalTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: { User: true, Project: true }
    })

    // Update the task — set completedAt when completing, clear when uncompleting
    const result = await updateTask(taskId, {
      ...data,
      completedAt: data.completed ? (originalTask?.completed ? originalTask.completedAt : new Date()) : null,
    })

    // Send notification if task was just completed
    if (data.completed && originalTask && !originalTask.completed) {
      const currentUser = await getCurrentUser()

      if (!currentUser) {
        return { success: true, message: 'Task updated successfully!', taskId: result.id }
      }

      const [completedByUser, project, originalAssigner] = await Promise.all([
        prisma.user.findUnique({ where: { id: currentUser.id } }),
        data.projectId ? prisma.project.findUnique({ where: { id: data.projectId } }) : null,
        originalTask.assignedById ? prisma.user.findUnique({ where: { id: originalTask.assignedById } }) : null,
      ])

      if (completedByUser && originalAssigner) {
        await notificationService.notifyTaskCompleted({
          taskId: taskId,
          taskTitle: data.title,
          completedByUserId: completedByUser.id,
          completedByUserName: completedByUser.name,
          assignerUserId: originalAssigner.id,
          assignerUserName: originalAssigner.name,
          projectId: project?.id,
          projectTitle: project?.title,
        })
      }
    }

    revalidateTaskPaths({ projectId: data.projectId, taskId })

    return result
  } catch (error) {
    console.error('Error in updateTaskCompletionAction:', error)
    throw error
  }
}

// Verify task update helper
export async function verifyTaskUpdate(taskId: number) {
  // Bypass cache to get fresh data immediately after update
  const task = await prisma.task.findUnique({
    where: { id: Number(taskId) },
    include: {
      Project: true,
      User: true
    }
  })
  return task
}
