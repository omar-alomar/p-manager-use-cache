"use server"

import { createTask, deleteTask, updateTask } from "@/db/tasks"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export async function createTaskAction(prevState: unknown, formData: FormData) {
  const [data, errors] = validateTask(formData)

  if (!data) return errors

  const task = await createTask(data)

  redirect(`/tasks/${task.id}`)
}

export async function editTaskAction(
  taskId: number,
  prevState: unknown,
  formData: FormData
) {
  const [data, errors] = validateTask(formData)

  if (!data) return errors

  const task = await updateTask(taskId, data)

  redirect(`/tasks/${task.id}`)
}

export async function deleteTaskAction(taskId: number | string) {
  await deleteTask(taskId)
  redirect("/tasks")
}

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
  const result = await updateTask(taskId, data)
  console.log('Update result:', result)
  return result
}

function validateTask(formData: FormData) {
  const errors: { title?: string; completed?: string; body?: string; userId?: string; projectId?: string } = {}
  const title = formData.get("title") as string
  const completed = Boolean(formData.get("completed"))
  const userId = Number(formData.get("userId"))
  const projectId = Number(formData.get("projectId"))
  let isValid = true

  if (title === "") {
    errors.title = "Required"
    isValid = false
  }

  if (completed === null) {
    errors.completed = "Required"
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

  return [isValid ? { title, completed, userId, projectId } : undefined, errors] as const
}