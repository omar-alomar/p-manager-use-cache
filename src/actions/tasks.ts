"use server"

import { createTask, deleteTask, updateTask, getTask } from "@/db/tasks"
import { revalidatePath, revalidateTag } from "next/cache"
import prisma from "@/db/db"
import { notificationService } from "@/services/notificationService"
import { getCurrentUser } from "@/auth/currentUser"


export async function createTaskAction(prevState: unknown, formData: FormData) {
  const [data, errors] = validateTask(formData)

  if (!data) return errors

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
    
    // Revalidate paths
    if (data.projectId && data.projectId > 0) {
      revalidatePath(`/projects/${data.projectId}`)
    }
    revalidatePath('/projects')
    revalidatePath('/tasks')
    revalidatePath('/my-tasks')
    revalidatePath('/')

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
  const [data, errors] = validateTask(formData)

  if (!data) return errors

  try {
    const task = await updateTask(taskId, data)
    
    // Revalidate paths
    if (data.projectId && data.projectId > 0) {
      revalidatePath(`/projects/${data.projectId}`)
    }
    revalidatePath('/projects')
    revalidatePath('/tasks')
    revalidatePath('/my-tasks')
    revalidatePath(`/tasks/${taskId}`)
    revalidatePath('/')
    revalidateTag('tasks')

    // Return success state instead of redirecting
    return { success: true, message: 'Task updated successfully!', taskId: task.id }
  } catch {
    return { success: false, message: 'Failed to update task. Please try again.' }
  }
}

export async function deleteTaskAction(taskId: number | string) {
  try {
    const task = await getTask(taskId)
    if (!task) {
      console.error(`Task ${taskId} not found`)
      return { success: false, message: 'Task not found' }
    }
    
    await deleteTask(taskId)
    
    // Revalidate paths
    revalidatePath(`/projects/${task.projectId}`)
    revalidatePath('/projects')
    revalidatePath('/tasks')
    revalidatePath('/my-tasks')
    revalidatePath('/')
    revalidateTag('tasks')
    
    return { success: true, message: 'Task deleted successfully', redirectTo: "/tasks" }
  } catch (error) {
    console.error('Error deleting task:', error)
    return { success: false, message: 'Failed to delete task' }
  }
}


function validateTask(formData: FormData) {
  const errors: { 
    title?: string; 
    completed?: string; 
    urgency?: string;
    userId?: string; 
    projectId?: string;
    status?: string;
    priority?: string;
    dueDate?: string;
  } = {}
  
  const title = formData.get("title") as string
  const completed = formData.get("completed") === "on"
  const urgency = formData.get("urgency") as string
  const userId = Number(formData.get("userId"))
  const projectIdRaw = formData.get("projectId")
  const projectId = projectIdRaw && Number(projectIdRaw) > 0 ? Number(projectIdRaw) : undefined
  
  let isValid = true

  if (title === "") {
    errors.title = "Required"
    isValid = false
  }

  if (isNaN(userId)) {
    errors.userId = "Required"
    isValid = false
  }

  // projectId is optional - if provided, it must be valid
  if (projectIdRaw && projectId === undefined) {
    errors.projectId = "Invalid project selection"
    isValid = false
  }

  return [isValid ? { 
    title, 
    completed, 
    urgency: urgency || 'MEDIUM',
    userId, 
    projectId 
  } : undefined, errors] as const
}

// Update task completion status (for checkbox toggle)
export async function updateTaskCompletionAction(
  taskId: number,
  data: {
    title: string
    completed: boolean
    urgency?: string
    userId: number
    projectId?: number
  }
) {
  console.log('Server action called with:', { taskId, data })
  
  try {
    // Get the original task to check if completion status changed and get the original assigner
    const originalTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: { User: true, Project: true }
    })

    // Update the task
    const result = await updateTask(taskId, data)
    console.log('Update result:', result)

    // Send notification if task was just completed
    if (data.completed && originalTask && !originalTask.completed) {
      const currentUser = await getCurrentUser()
      
      if (!currentUser) {
        console.warn('No current user found, skipping notification')
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
    
    // Revalidate paths
    revalidatePath(`/projects/${data.projectId}`)
    revalidatePath('/projects')
    revalidatePath('/tasks')
    revalidatePath('/my-tasks')
    revalidatePath(`/tasks/${taskId}`)
    revalidatePath('/')
    
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