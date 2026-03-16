import { NextRequest } from "next/server"
import { updateProjectField, getProject } from "@/db/projects"
import { requireAuth, isErrorResponse } from "../../../_lib/auth"
import { checkMaintenance } from "../../../_lib/maintenance"
import { jsonSuccess, jsonError, jsonNotFound } from "../../../_lib/responses"

const ALLOWED_FIELDS = ["body", "mbaNumber", "coFileNumbers", "dldReviewer"] as const

export async function PATCH(
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

  const { field, value } = body as { field?: string; value?: string }
  if (!field || !ALLOWED_FIELDS.includes(field as typeof ALLOWED_FIELDS[number])) {
    return jsonError(`Invalid field. Allowed: ${ALLOWED_FIELDS.join(", ")}`, 400)
  }
  if (typeof value !== "string") {
    return jsonError("Value must be a string", 400)
  }

  const project = await updateProjectField(
    Number(projectId),
    field as typeof ALLOWED_FIELDS[number],
    value
  )
  return jsonSuccess(project)
}
