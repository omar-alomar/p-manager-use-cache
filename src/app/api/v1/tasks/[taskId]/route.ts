import { NextRequest } from "next/server"
import { taskSchema } from "@/schemas/schemas"
import { getTask, updateTask, deleteTask } from "@/db/tasks"
import { requireAuth, isErrorResponse } from "../../_lib/auth"
import { checkMaintenance } from "../../_lib/maintenance"
import { jsonSuccess, jsonNoContent, jsonError, jsonNotFound } from "../../_lib/responses"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const auth = await requireAuth(request)
  if (isErrorResponse(auth)) return auth

  const { taskId } = await params
  const task = await getTask(taskId)
  if (!task) return jsonNotFound("Task not found")

  return jsonSuccess(task)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const auth = await requireAuth(request)
  if (isErrorResponse(auth)) return auth

  const blocked = await checkMaintenance(auth)
  if (blocked) return blocked

  const { taskId } = await params
  const existing = await getTask(taskId)
  if (!existing) return jsonNotFound("Task not found")

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonError("Invalid JSON body")
  }

  const parsed = taskSchema.safeParse(body)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const e of parsed.error.issues) {
      fieldErrors[e.path.join(".")] = e.message
    }
    return jsonError("Validation failed", 400, fieldErrors)
  }

  const task = await updateTask(taskId, {
    ...parsed.data,
    completedAt: parsed.data.completed ? new Date() : null,
  })
  return jsonSuccess(task)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const auth = await requireAuth(request)
  if (isErrorResponse(auth)) return auth

  const blocked = await checkMaintenance(auth)
  if (blocked) return blocked

  const { taskId } = await params
  const existing = await getTask(taskId)
  if (!existing) return jsonNotFound("Task not found")

  await deleteTask(taskId)
  return jsonNoContent()
}
