import { NextRequest } from "next/server"
import { deleteTask, getTask } from "@/db/tasks"
import { requireAdmin, isErrorResponse } from "../../../_lib/auth"
import { checkMaintenance } from "../../../_lib/maintenance"
import { jsonNoContent, jsonNotFound } from "../../../_lib/responses"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const auth = await requireAdmin(request)
  if (isErrorResponse(auth)) return auth

  const blocked = await checkMaintenance(auth)
  if (blocked) return blocked

  const { taskId } = await params
  const existing = await getTask(taskId)
  if (!existing) return jsonNotFound("Task not found")

  await deleteTask(taskId)
  return jsonNoContent()
}
