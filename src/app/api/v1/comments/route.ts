import { NextRequest } from "next/server"
import { z } from "zod"
import { getProjectComments, getTaskComments, createComment } from "@/db/comments"
import { createMentions } from "@/db/mentions"
import prisma from "@/db/db"
import { parseMentions, extractMentionedUsernames } from "@/utils/mentions"
import { notificationService } from "@/services/notificationService"
import { requireAuth, isErrorResponse } from "../_lib/auth"
import { checkMaintenance } from "../_lib/maintenance"
import { jsonSuccess, jsonCreated, jsonError } from "../_lib/responses"
import { getPaginationParams, paginate } from "../_lib/pagination"

const commentSchema = z.object({
  body: z.string().min(1, "Comment body is required"),
  projectId: z.number().int().positive().optional(),
  taskId: z.number().int().positive().optional(),
})

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (isErrorResponse(auth)) return auth

  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get("projectId")
  const taskId = searchParams.get("taskId")
  const { page, limit } = getPaginationParams(searchParams)

  if (!projectId && !taskId) {
    return jsonError("Either projectId or taskId query param is required", 400)
  }

  const comments = projectId
    ? await getProjectComments(projectId)
    : await getTaskComments(taskId!)

  return jsonSuccess(paginate(comments, page, limit))
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

  const parsed = commentSchema.safeParse(body)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const e of parsed.error.issues) {
      fieldErrors[e.path.join(".")] = e.message
    }
    return jsonError("Validation failed", 400, fieldErrors)
  }

  if (!parsed.data.projectId && !parsed.data.taskId) {
    return jsonError("Either projectId or taskId is required", 400)
  }

  // Get user email for the comment record
  const user = await prisma.user.findUnique({
    where: { id: auth.id },
    select: { email: true, name: true },
  })
  if (!user) return jsonError("User not found", 400)

  const comment = await createComment(
    parsed.data.projectId ?? null,
    parsed.data.taskId ?? null,
    user.email,
    parsed.data.body,
    auth.id
  )

  // Process @mentions
  const mentions = parseMentions(parsed.data.body)
  const usernames = extractMentionedUsernames(mentions)
  if (usernames.length > 0) {
    const mentionRecords = await createMentions(comment.id, usernames)

    // Send real-time notifications for each mentioned user
    let context: { projectTitle?: string; taskTitle?: string; projectId?: number; taskId?: number } = {}
    if (parsed.data.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: parsed.data.projectId },
        select: { title: true },
      })
      context = { projectTitle: project?.title, projectId: parsed.data.projectId }
    } else if (parsed.data.taskId) {
      const task = await prisma.task.findUnique({
        where: { id: parsed.data.taskId },
        select: { title: true },
      })
      context = { taskTitle: task?.title, taskId: parsed.data.taskId }
    }

    for (const mention of mentionRecords) {
      if (mention.userId !== auth.id) {
        await notificationService.sendMentionNotification(
          mention.userId,
          user.name,
          comment.id,
          parsed.data.body,
          context
        )
      }
    }
  }

  return jsonCreated(comment)
}
