import { NextRequest } from "next/server"
import { notificationService } from "@/services/notificationService"
import { requireAuth, isErrorResponse } from "../_lib/auth"
import { jsonSuccess } from "../_lib/responses"

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (isErrorResponse(auth)) return auth

  const { searchParams } = new URL(request.url)
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 100)

  const notifications = await notificationService.getUserNotifications(auth.id, limit)
  return jsonSuccess(notifications)
}
