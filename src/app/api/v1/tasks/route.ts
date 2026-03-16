import { NextRequest } from "next/server"
import { taskSchema } from "@/schemas/schemas"
import { getTasks, getUserTasks, getProjectTasks, createTask } from "@/db/tasks"
import prisma from "@/db/db"
import { notificationService } from "@/services/notificationService"
import { requireAuth, isErrorResponse } from "../_lib/auth"
import { checkMaintenance } from "../_lib/maintenance"
import { jsonSuccess, jsonCreated, jsonError } from "../_lib/responses"

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (isErrorResponse(auth)) return auth

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")
  const projectId = searchParams.get("projectId")

  let tasks
  if (userId) {
    tasks = await getUserTasks(userId)
  } else if (projectId) {
    tasks = await getProjectTasks(projectId)
  } else {
    tasks = await getTasks()
  }

  return jsonSuccess(tasks)
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (isErrorResponse(auth)) return auth

  const blocked = await checkMaintenance(auth)
  if (blocked) return blocked

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

  const task = await createTask({
    ...parsed.data,
    assignedById: auth.id,
  })

  // Send notification if assigned to someone else
  if (task.userId !== auth.id) {
    const [assignee, assigner] = await Promise.all([
      prisma.user.findUnique({ where: { id: task.userId }, select: { name: true } }),
      prisma.user.findUnique({ where: { id: auth.id }, select: { name: true } }),
    ])

    let projectTitle: string | undefined
    if (task.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: task.projectId },
        select: { title: true },
      })
      projectTitle = project?.title
    }

    if (assignee && assigner) {
      await notificationService.notifyTaskAssigned({
        taskId: task.id,
        taskTitle: task.title,
        assignedUserId: task.userId,
        assignedUserName: assignee.name,
        assignerUserId: auth.id,
        assignerUserName: assigner.name,
        projectId: task.projectId ?? undefined,
        projectTitle,
      })
    }
  }

  return jsonCreated(task)
}
