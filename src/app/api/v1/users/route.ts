import { NextRequest } from "next/server"
import { getUsers } from "@/db/users"
import { requireAuth, isErrorResponse } from "../_lib/auth"
import { jsonSuccess } from "../_lib/responses"
import { getPaginationParams, paginate } from "../_lib/pagination"

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (isErrorResponse(auth)) return auth

  const { searchParams } = new URL(request.url)
  const { page, limit } = getPaginationParams(searchParams)

  const users = await getUsers()
  const sanitized = users.map(({ password, salt, ...u }) => u)
  return jsonSuccess(paginate(sanitized, page, limit))
}
