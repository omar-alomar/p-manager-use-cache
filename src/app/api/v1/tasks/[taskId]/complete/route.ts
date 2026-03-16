import { NextRequest } from "next/server"
import { getTask, updateTask } from "@/db/tasks"
import prisma from "@/db/db"
import { notificationService } from "@/services/notificationService"
import { requireAuth, isErrorResponse } from "../../../_lib/auth"
import { checkMaintenance } from "../../../_lib/maintenance"
import { jsonSuccess, jsonError, jsonNotFound } from "../../../_lib/responses"

export async function PATCH(
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

  const { completed } = body as { completed?: boolean }
  if (typeof completed !== "boolean") {
    return jsonError("completed must be a boolean", 400)
  }

  const task = await updateTask(taskId, {
    title: existing.title,
    completed,
    urgency: existing.urgency,
    userId: existing.userId,
    projectId: existing.projectId ?? undefined,
    completedAt: completed ? new Date() : null,
  })

  // Notify assigner when task is completed
  if (completed && existing.assignedById && existing.assignedById !== auth.id) {
    const [completer, assigner] = await Promise.all([
      prisma.user.findUnique({ where: { id: auth.id }, select: { name: true } }),
      prisma.user.findUnique({ where: { id: existing.assignedById }, select: { name: true } }),
    ])

    let projectTitle: string | undefined
    if (existing.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: existing.projectId },
        select: { title: true },
      })
      projectTitle = project?.title
    }

    if (completer && assigner) {
      await notificationService.notifyTaskCompleted({
        taskId: task.id,
        taskTitle: task.title,
        completedByUserId: auth.id,
        completedByUserName: completer.name,
        assignerUserId: existing.assignedById,
        assignerUserName: assigner.name,
        projectId: existing.projectId ?? undefined,
        projectTitle,
      })
    }
  }

  return jsonSuccess(task)
}
