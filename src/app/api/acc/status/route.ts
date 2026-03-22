// ACC connection status endpoint
//
// Returns whether the current user has a valid Autodesk connection
// and when the refresh token expires. Used by the file browser to
// show "Connect" or "Reconnect" prompts.

import { NextResponse } from "next/server"
import { getUserFromSession } from "@/auth/session"
import { getUserAutodeskStatus } from "@/db/autodesk"
import { cookies } from "next/headers"

export async function GET() {
  const cookieStore = await cookies()
  const session = await getUserFromSession(cookieStore)
  if (!session) {
    return NextResponse.json({ connected: false, refreshExpiresAt: null })
  }

  const status = await getUserAutodeskStatus(session.id)

  let daysUntilExpiry: number | null = null
  if (status.connected && status.refreshExpiresAt) {
    daysUntilExpiry = Math.ceil(
      (status.refreshExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
  }

  return NextResponse.json({
    connected: status.connected,
    refreshExpiresAt: status.refreshExpiresAt,
    daysUntilExpiry,
  })
}
