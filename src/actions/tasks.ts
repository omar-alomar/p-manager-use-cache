// actions/tasks.ts
"use server"

import { createTask, deleteTask, updateTask } from "@/db/tasks"
import { redirect } from "next/navigation"
import { revalidatePath, revalidateTag } from "next/cache"

// ... other actions ...

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

// Add this helper to verify updates
export async function verifyTaskUpdate(taskId: number) {
  "use server"
  const { getTask } = await import("@/db/tasks")
  const task = await getTask(taskId)
  return task
}