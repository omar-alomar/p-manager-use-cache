import { NextRequest } from "next/server"
import { milestoneSchema } from "@/schemas/schemas"
import { addMilestone, getProject } from "@/db/projects"
import { requireAuth, isErrorResponse } from "../../../_lib/auth"
import { checkMaintenance } from "../../../_lib/maintenance"
import { jsonCreated, jsonError, jsonNotFound } from "../../../_lib/responses"

export async function POST(
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

  const parsed = milestoneSchema.safeParse(body)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const e of parsed.error.issues) {
      fieldErrors[e.path.join(".")] = e.message
    }
    return jsonError("Validation failed", 400, fieldErrors)
  }

  const milestone = await addMilestone(Number(projectId), {
    date: new Date(parsed.data.date),
    item: parsed.data.item,
    apfo: parsed.data.apfo,
  })
  return jsonCreated(milestone)
}
