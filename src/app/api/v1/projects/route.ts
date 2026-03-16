import { NextRequest } from "next/server"
import { projectSchema } from "@/schemas/schemas"
import { getProjects, createProject } from "@/db/projects"
import { requireAuth, isErrorResponse } from "../_lib/auth"
import { checkMaintenance } from "../_lib/maintenance"
import { jsonSuccess, jsonCreated, jsonError } from "../_lib/responses"

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (isErrorResponse(auth)) return auth

  const { searchParams } = new URL(request.url)
  const query = searchParams.get("query") ?? undefined
  const userId = searchParams.get("userId") ?? undefined
  const includeArchived = searchParams.get("includeArchived") === "true"

  const projects = await getProjects({ query, userId, includeArchived })
  return jsonSuccess(projects)
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

  // Transform date strings to Date objects before validation
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

  const project = await createProject(parsed.data)
  return jsonCreated(project)
}
