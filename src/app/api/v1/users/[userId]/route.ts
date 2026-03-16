import { NextRequest } from "next/server"
import { getUser } from "@/db/users"
import { requireAuth, isErrorResponse } from "../../_lib/auth"
import { jsonSuccess, jsonNotFound } from "../../_lib/responses"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const auth = await requireAuth(request)
  if (isErrorResponse(auth)) return auth

  const { userId } = await params
  const user = await getUser(userId)
  if (!user) return jsonNotFound("User not found")

  // Strip sensitive fields
  const { password, salt, ...sanitized } = user
  return jsonSuccess(sanitized)
}
