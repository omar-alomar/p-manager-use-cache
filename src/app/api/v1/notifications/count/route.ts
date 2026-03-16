import { NextRequest } from "next/server"
import { getUnreadNotificationCount } from "@/db/mentions"
import { requireAuth, isErrorResponse } from "../../_lib/auth"
import { jsonSuccess } from "../../_lib/responses"

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (isErrorResponse(auth)) return auth

  const count = await getUnreadNotificationCount(auth.id)
  return jsonSuccess({ count })
}
