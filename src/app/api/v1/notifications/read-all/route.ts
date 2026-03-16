import { NextRequest } from "next/server"
import { markAllNotificationsAsRead } from "@/db/mentions"
import { notificationService } from "@/services/notificationService"
import { requireAuth, isErrorResponse } from "../../_lib/auth"
import { jsonSuccess } from "../../_lib/responses"

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (isErrorResponse(auth)) return auth

  // Mark read in both DB and Redis
  await Promise.all([
    markAllNotificationsAsRead(auth.id),
    notificationService.clearUserNotifications(auth.id),
  ])

  return jsonSuccess({ message: "All notifications marked as read" })
}
