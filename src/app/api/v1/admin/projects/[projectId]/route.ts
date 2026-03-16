import { NextRequest } from "next/server"
import { deleteProject, getProject } from "@/db/projects"
import { requireAdmin, isErrorResponse } from "../../../_lib/auth"
import { checkMaintenance } from "../../../_lib/maintenance"
import { jsonNoContent, jsonNotFound } from "../../../_lib/responses"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const auth = await requireAdmin(request)
  if (isErrorResponse(auth)) return auth

  const blocked = await checkMaintenance(auth)
  if (blocked) return blocked

  const { projectId } = await params
  const existing = await getProject(projectId)
  if (!existing) return jsonNotFound("Project not found")

  await deleteProject(projectId)
  return jsonNoContent()
}
