import { NextRequest } from "next/server"
import { updateUserLastSeenVersion } from "@/db/users"
import { requireAdmin, isErrorResponse } from "../../../../_lib/auth"
import { jsonSuccess, jsonError } from "../../../../_lib/responses"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const auth = await requireAdmin(request)
  if (isErrorResponse(auth)) return auth

  const { userId } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonError("Invalid JSON body")
  }

  const { version } = body as { version?: string | null }
  if (version !== null && typeof version !== "string") {
    return jsonError("version must be a string or null", 400)
  }

  const user = await updateUserLastSeenVersion(userId, version ?? null)
  return jsonSuccess({ id: user.id, lastSeenVersion: user.lastSeenVersion })
}
