import { NextRequest } from "next/server"
import { setProjectArchived, getProject } from "@/db/projects"
import { requireAuth, isErrorResponse } from "../../../_lib/auth"
import { checkMaintenance } from "../../../_lib/maintenance"
import { jsonSuccess, jsonError, jsonNotFound } from "../../../_lib/responses"

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

  const { archived } = body as { archived?: boolean }
  if (typeof archived !== "boolean") {
    return jsonError("archived must be a boolean", 400)
  }

  const project = await setProjectArchived(projectId, archived)
  return jsonSuccess(project)
}
