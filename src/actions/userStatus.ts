"use server"

import { getCurrentUser } from "@/auth/currentUser"

export async function getCurrentUserStatus() {
  try {
    const user = await getCurrentUser({ withFullUser: true })
    return { success: true, user }
  } catch (error) {
    return { success: false, user: null, error: "Failed to get user" }
  }
}
