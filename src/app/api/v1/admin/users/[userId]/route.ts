import { NextRequest } from "next/server"
import { deleteUserWithReassignment, getUserDeletionImpact } from "@/db/users"
import { requireAdmin, isErrorResponse } from "../../../_lib/auth"
import { checkMaintenance } from "../../../_lib/maintenance"
import { jsonSuccess, jsonNoContent, jsonError } from "../../../_lib/responses"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const auth = await requireAdmin(request)
  if (isErrorResponse(auth)) return auth

  const { userId } = await params

  try {
    const impact = await getUserDeletionImpact(userId)
    return jsonSuccess(impact)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get user info"
    return jsonError(message, 400)
  }
}

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

  const reassignTo = request.nextUrl.searchParams.get("reassignTo")
  if (!reassignTo) {
    return jsonError("reassignTo query parameter is required. Provide the user ID to reassign projects and tasks to.", 400)
  }

  try {
    await deleteUserWithReassignment(userId, reassignTo, auth.id)
    return jsonNoContent()
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete user"
    return jsonError(message, 400)
  }
}
