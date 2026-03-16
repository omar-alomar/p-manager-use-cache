import { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { removeUserFromSession } from "@/auth/session"
import { requireAuth, isErrorResponse } from "../../_lib/auth"
import { jsonNoContent } from "../../_lib/responses"

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (isErrorResponse(auth)) return auth

  await removeUserFromSession(await cookies())
  return jsonNoContent()
}
