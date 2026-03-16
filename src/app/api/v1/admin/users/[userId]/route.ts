import { NextRequest } from "next/server"
import { deleteUser } from "@/db/users"
import { requireAdmin, isErrorResponse } from "../../../_lib/auth"
import { checkMaintenance } from "../../../_lib/maintenance"
import { jsonNoContent, jsonError } from "../../../_lib/responses"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const auth = await requireAdmin(request)
  if (isErrorResponse(auth)) return auth

  const blocked = await checkMaintenance(auth)
  if (blocked) return blocked

  const { userId } = await params

  // Prevent self-deletion
  if (Number(userId) === auth.id) {
    return jsonError("Cannot delete your own account", 400)
  }

  try {
    await deleteUser(userId)
    return jsonNoContent()
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete user"
    return jsonError(message, 400)
  }
}
