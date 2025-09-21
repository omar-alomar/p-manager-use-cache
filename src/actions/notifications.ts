"use server"

import { getUnreadNotificationCount, getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "@/db/mentions"

export async function getUnreadNotificationCountAction(userId: number) {
  return await getUnreadNotificationCount(userId)
}

export async function getUserNotificationsAction(userId: number, limit = 50) {
  return await getUserNotifications(userId, limit)
}

export async function markNotificationAsReadAction(notificationId: number, userId: number) {
  return await markNotificationAsRead(notificationId, userId)
}

export async function markAllNotificationsAsReadAction(userId: number) {
  return await markAllNotificationsAsRead(userId)
}
