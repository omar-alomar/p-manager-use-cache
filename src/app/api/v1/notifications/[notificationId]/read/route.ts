import { NextRequest } from "next/server"
import { markNotificationAsRead } from "@/db/mentions"
import { notificationService } from "@/services/notificationService"
import { requireAuth, isErrorResponse } from "../../../_lib/auth"
import { jsonSuccess } from "../../../_lib/responses"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  const auth = await requireAuth(request)
  if (isErrorResponse(auth)) return auth

  const { notificationId } = await params

  // Mark read in DB
  await markNotificationAsRead(Number(notificationId), auth.id)

  // Also remove from Redis real-time list
  await notificationService.removeUserNotification(auth.id, notificationId)

  return jsonSuccess({ message: "Notification marked as read" })
}
