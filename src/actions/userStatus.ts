"use server"

import { getCurrentUser } from "@/auth/currentUser"

export const runtime = "nodejs";
export const revalidate = 0; // or: export const dynamic = "force-dynamic";


export async function getCurrentUserStatus() {
  try {
    console.log("getCurrentUserStatus: Starting...")
    const user = await getCurrentUser({ withFullUser: true })
    console.log("getCurrentUserStatus: Got user:", user ? "found" : "null")
    return { success: true, user }
  } catch (error) {
    console.error("getCurrentUserStatus: Error:", error)
    return { success: false, user: null, error: "Failed to get user" }
  }
}
