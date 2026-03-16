import { NextRequest } from "next/server"
import { updateUserRole } from "@/db/users"
import { requireAdmin, isErrorResponse } from "../../../../_lib/auth"
import { checkMaintenance } from "../../../../_lib/maintenance"
import { jsonSuccess, jsonError } from "../../../../_lib/responses"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const auth = await requireAdmin(request)
  if (isErrorResponse(auth)) return auth

  const blocked = await checkMaintenance(auth)
  if (blocked) return blocked

  const { userId } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonError("Invalid JSON body")
  }

  const { role } = body as { role?: string }
  if (role !== "user" && role !== "admin") {
    return jsonError('role must be "user" or "admin"', 400)
  }

  const user = await updateUserRole(userId, role)
  const { password, salt, ...sanitized } = user as typeof user & { password?: string; salt?: string }
  return jsonSuccess(sanitized)
}
