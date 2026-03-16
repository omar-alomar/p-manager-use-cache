import { NextRequest } from "next/server"
import { projectSchema } from "@/schemas/schemas"
import { getProject, updateProject, deleteProject } from "@/db/projects"
import { requireAuth, isErrorResponse } from "../../_lib/auth"
import { checkMaintenance } from "../../_lib/maintenance"
import { jsonSuccess, jsonNoContent, jsonError, jsonNotFound } from "../../_lib/responses"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const auth = await requireAuth(request)
  if (isErrorResponse(auth)) return auth

  const { projectId } = await params
  const project = await getProject(projectId)
  if (!project) return jsonNotFound("Project not found")

  return jsonSuccess(project)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const auth = await requireAuth(request)
  if (isErrorResponse(auth)) return auth

  const blocked = await checkMaintenance(auth)
  if (blocked) return blocked

  const { projectId } = await params
  const existing = await getProject(projectId)
  if (!existing) return jsonNotFound("Project not found")

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonError("Invalid JSON body")
  }

  const raw = body as Record<string, unknown>
  if (typeof raw.milestone === "string") raw.milestone = new Date(raw.milestone)
  else if (raw.milestone === undefined) raw.milestone = null
  if (Array.isArray(raw.milestones)) {
    raw.milestones = raw.milestones.map((m: Record<string, unknown>) => ({
      ...m,
      date: typeof m.date === "string" ? new Date(m.date) : m.date,
    }))
  }

  const parsed = projectSchema.safeParse(raw)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const e of parsed.error.issues) {
      fieldErrors[e.path.join(".")] = e.message
    }
    return jsonError("Validation failed", 400, fieldErrors)
  }

  const project = await updateProject(projectId, parsed.data)
  return jsonSuccess(project)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const auth = await requireAuth(request)
  if (isErrorResponse(auth)) return auth

  const blocked = await checkMaintenance(auth)
  if (blocked) return blocked

  const { projectId } = await params
  const existing = await getProject(projectId)
  if (!existing) return jsonNotFound("Project not found")

  await deleteProject(projectId)
  return jsonNoContent()
}
