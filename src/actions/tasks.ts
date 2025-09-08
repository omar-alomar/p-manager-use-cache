"use server"

import { createTask, deleteTask, updateTask, getTask } from "@/db/tasks"
import { revalidatePath, revalidateTag } from "next/cache"
import prisma from "@/db/db"


export async function createTaskAction(prevState: unknown, formData: FormData) {
  const [data, errors] = validateTask(formData)

  if (!data) return errors

  try {
    const task = await createTask(data)
    
    // Revalidate paths
    revalidatePath(`/projects/${data.projectId}`)
    revalidatePath('/projects')
    revalidatePath('/tasks')
    revalidatePath('/my-tasks')
    revalidatePath('/')
    revalidateTag('tasks')

    // Return success state instead of redirecting
    return { success: true, message: 'Task created successfully!', taskId: task.id }
  } catch {
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
    revalidatePath(`/projects/${data.projectId}`)
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
    userId?: string; 
    projectId?: string;
    status?: string;
    priority?: string;
    dueDate?: string;
  } = {}
  
  const title = formData.get("title") as string
  const completed = formData.get("completed") === "on"
  const userId = Number(formData.get("userId"))
  const projectId = Number(formData.get("projectId"))
  
  let isValid = true

  if (title === "") {
    errors.title = "Required"
    isValid = false
  }

  if (isNaN(userId)) {
    errors.userId = "Required"
    isValid = false
  }

  if (isNaN(projectId)) {
    errors.projectId = "Required"
    isValid = false
  }

  return [isValid ? { 
    title, 
    completed, 
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
    userId: number
    projectId: number
  }
) {
  console.log('Server action called with:', { taskId, data })
  
  try {
    // Update the task
    const result = await updateTask(taskId, data)
    console.log('Update result:', result)
    
    // AGGRESSIVE cache invalidation
    // 1. Revalidate specific paths
    revalidatePath(`/projects/${data.projectId}`)
    revalidatePath('/projects')
    revalidatePath('/tasks')
    revalidatePath('/my-tasks')
    revalidatePath(`/tasks/${taskId}`)
    revalidatePath('/')
    
    // 2. Revalidate tags if you're using them
    revalidateTag('tasks')
    
    // 3. Add a small delay to ensure DB write completes
    await new Promise(resolve => setTimeout(resolve, 50))
    
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