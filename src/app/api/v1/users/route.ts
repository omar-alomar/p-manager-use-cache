import { NextRequest } from "next/server"
import { getUsers } from "@/db/users"
import { requireAuth, isErrorResponse } from "../_lib/auth"
import { jsonSuccess } from "../_lib/responses"

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (isErrorResponse(auth)) return auth

  const users = await getUsers()

  // Strip sensitive fields
  const sanitized = users.map(({ password, salt, ...u }) => u)
  return jsonSuccess(sanitized)
}
